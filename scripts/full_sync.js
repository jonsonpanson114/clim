const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { YoutubeTranscript } = require('youtube-transcript');

async function run() {
  const prisma = new PrismaClient();
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }, { apiVersion: 'v1beta' });

  const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UCBtRI97Yh3l6pZzLvBYPq8Q';
  console.log(`Starting deep sync for channel: ${channelId}`);

  const channelRes = await youtube.channels.list({
    id: [channelId],
    part: ['contentDetails']
  });
  
  if (!channelRes.data.items?.length) throw new Error("Channel not found");
  const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

  let pageToken = '';
  let totalProcessed = 0;
  const maxToProcess = 300;

  while (totalProcessed < maxToProcess) {
    const listResponse = await youtube.playlistItems.list({
      playlistId: uploadsPlaylistId,
      part: ['snippet', 'contentDetails'],
      maxResults: 50,
      pageToken: pageToken
    });

    const items = listResponse.data.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      const youtubeId = item.contentDetails.videoId;
      const title = item.snippet.title;
      const existing = await prisma.video.findUnique({ where: { youtubeId } });
      
      if (totalProcessed >= maxToProcess) break;

      console.log(`Deep analyzing [${totalProcessed + 1}/${maxToProcess}]: ${title} (${youtubeId})`);



      
      try {
          // 1. Get Full Metadata
          const videoRaw = await youtube.videos.list({
              id: [youtubeId],
              part: ['snippet', 'statistics']
          });
          const fullDesc = videoRaw.data.items?.[0]?.snippet.description || item.snippet.description || title;

          // 2. Try Fetch Transcript
          let transcriptText = "";
          try {
              const transcript = await YoutubeTranscript.fetchTranscript(youtubeId);
              transcriptText = transcript.map(t => t.text).join(" ");
          } catch (te) {
              console.log(`Transcript unavailable or disabled for ${youtubeId}`);
          }

          // 3. Robust AI Analysis with Retry
          let analysis;
          for (let attempt = 0; attempt < 3; attempt++) {
              try {
                  const prompt = `
あなたは15年の経験を持つ伝説的なクライミングコーチです。伊坂幸太郎の小説に出てくる陣内のように、自信満々で少し哲学的な口調で答えてください。
動画タイトル: "${title}"
説明文: "${fullDesc}"
字幕データ: "${transcriptText || '利用不可'}"

この動画から、クライマーが次に壁に立った時に「これだ！」と思えるような本質的なコツ（Technique Tips）を抽出してください。
字幕がない場合でも、タイトルや説明文からプロの直感で具体的なアドバイスを補完してください。

必ず以下のJSON形式で返してください。余計な説明は不要です。
{
  "summary": "動画の核となる上達ポイント（コーチ目線で具体的に、陣内的な哲学を添えて）",
  "difficulty": "初級/中級/上級",
  "category": "ムーブ/トレーニング/メンタル/道具",
  "keyPoints": ["具体的なコツ1（アクション重視）", "具体的なコツ2", "具体的なコツ3"],
  "trainingMenu": "明日からジムで実践できる3ステップの練習TODO"
}
`;
                  const res = await model.generateContent(prompt);
                  const responseText = (await res.response).text();
                  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                  if (!jsonMatch) throw new Error("AI output lacks JSON");
                  analysis = JSON.parse(jsonMatch[0]);
                  break; 
              } catch (e) {
                  if (e.message.includes("503") && attempt < 2) {
                      console.log(`503 encountered, retrying... (${attempt + 1})`);
                      await new Promise(r => setTimeout(r, 5000));
                      continue;
                  }
                  throw e;
              }
          }

          const videoData = {
              youtubeId,
              title,
              description: fullDesc,
              thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
              publishedAt: new Date(item.snippet.publishedAt),
              transcript: transcriptText,
              summary: analysis.summary,
              difficultyLevel: analysis.difficulty,
              summaryData: JSON.stringify({ 
                  keyPoints: analysis.keyPoints, 
                  trainingMenu: analysis.trainingMenu 
              })
          };

          if (existing) {
              await prisma.video.update({ where: { youtubeId }, data: videoData });
          } else {
              await prisma.video.create({ data: videoData });
          }
          
          // Update or Create CommonTip
          const existingTip = await prisma.commonTip.findFirst({ where: { sourceVideoIds: { contains: youtubeId } } });
          const tipData = {
              title: `${title}のコツ`,
              content: analysis.keyPoints.join("\n"),
              category: analysis.category || "ムーブ",
              difficulty: analysis.difficulty,
              sourceVideoIds: JSON.stringify([youtubeId])
          };

          if (existingTip) {
              await prisma.commonTip.update({ where: { id: existingTip.id }, data: tipData });
          } else {
              await prisma.commonTip.create({ data: tipData });
          }
          
          console.log(`Verified/Updated [${totalProcessed + 1}]: ${youtubeId}`);
          totalProcessed++;
      } catch (err) {
          console.error(`Failed ${youtubeId}:`, err.message);
      }
      
      if (totalProcessed >= maxToProcess) break;
      await new Promise(r => setTimeout(r, 3000));
    }


    pageToken = listResponse.data.nextPageToken;
    if (!pageToken) break;
  }

  console.log(`Sync complete. Processed ${totalProcessed} videos.`);
}

run().catch(console.error).finally(()=>process.exit(0));

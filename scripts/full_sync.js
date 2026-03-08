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

  // Get channel IDs from env, default to the main coach channel
  const rawChannelIds = process.env.YOUTUBE_CHANNEL_ID || 'UCBtRI97Yh3l6pZzLvBYPq8Q';
  const channelIds = rawChannelIds.split(',').map(id => id.trim());
  
  console.log(`Starting deep sync for ${channelIds.length} channels: ${channelIds.join(', ')}`);

  let totalProcessed = 0;
  const maxToProcess = 300;

  for (let cIdx = 0; cIdx < channelIds.length; cIdx++) {
      const channelId = channelIds[cIdx];
      const isExternal = cIdx > 0; // First channel is official, others are external
      
      console.log(`\n--- Syncing Channel [${cIdx + 1}/${channelIds.length}]: ${channelId} (${isExternal ? 'External' : 'Official'}) ---`);

      try {
          const channelRes = await youtube.channels.list({
            id: [channelId],
            part: ['contentDetails', 'snippet']
          });
          
          if (!channelRes.data.items?.length) {
              console.error(`Channel ${channelId} not found, skipping.`);
              continue;
          }
          
          const channelTitle = channelRes.data.items[0].snippet.title;
          const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

          let pageToken = '';
          let chanProcessed = 0;
          let itemsSkipped = 0;
          const skipCount = (cIdx === 0) ? 162 : 0; // Skip already deep-analyzed ones on official channel

          while (chanProcessed < 100 && totalProcessed < maxToProcess) {
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
              
              if (itemsSkipped < skipCount) {
                  itemsSkipped++;
                  console.log(`Skipping [${itemsSkipped}/${skipCount}]: ${title}`);
                  continue;
              }
              
              if (totalProcessed >= maxToProcess) break;

              console.log(`Deep analyzing [${totalProcessed + 1}]: ${title} (${youtubeId}) from ${channelTitle}`);
              
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
                      // Transcript unavailable
                  }

                  // 3. AI Analysis with Retry
                  let analysis;
                  for (let attempt = 0; attempt < 3; attempt++) {
                      try {
                          const prompt = `
あなたは15年の経験を持つ伝説的なクライミングコーチです。伊坂幸太郎の小説に出てくる陣内のように、自信満々で少し哲学的な口調で答えてください。
動画の内容が英語（または日本語以外）の場合でも、すべての内容は日本語で作成し、その技術的本質を日本のクライマーが即座に理解できるよう翻訳・昇華させてください。
動画タイトル: "${title}"

説明文: "${fullDesc}"
字幕データ: "${transcriptText || '利用不可'}"

この動画から、クライマーが次に壁に立った時に「これだ！」と思えるような本質的なコツ（Technique Tips）を抽出してください。
字幕がない場合でも、タイトルや説明文からプロの直感で具体的なアドバイスを補完してください。

必ず以下のJSON形式で返してください。余計な説明は不要です。
{
  "summary": "動画の核となる上達ポイント（コーチ目線で具体的に。500文字程度で、登りの論理と陣内的な哲学を深く、濃密に語ること）",
  "difficulty": "初級/中級/上級",
  "category": "ムーブ/トレーニング/メンタル/道具",
  "keyPoints": [
    "具体的なコツ1（アクションと感覚の両面から、詳細に解説すること）",
    "具体的なコツ2（なぜその動きが必要なのかという理屈を添えること）",
    "具体的なコツ3（失敗する時の典型例と、その修正方法を具体的に）"
  ],
  "trainingMenu": "明日からジムで実践できる、ステップ分けされた詳細な練習TODO"
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
                      isExternal: isExternal,
                      summaryData: JSON.stringify({ 
                          keyPoints: analysis.keyPoints, 
                          trainingMenu: analysis.trainingMenu 
                      })
                  };

                  await prisma.video.upsert({
                      where: { youtubeId },
                      update: videoData,
                      create: videoData
                  });
                  
                  // Update or Create CommonTip
                  const existingTip = await prisma.commonTip.findFirst({ where: { sourceVideoIds: { contains: youtubeId } } });
                  const tipData = {
                      title: `${title}のコツ`,
                      content: analysis.keyPoints.join("\n"),
                      category: analysis.category || "ムーブ",
                      difficulty: analysis.difficulty,
                      isExternal: isExternal, // Set the flag!
                      sourceVideoIds: JSON.stringify([youtubeId])
                  };

                  if (existingTip) {
                      await prisma.commonTip.update({ where: { id: existingTip.id }, data: tipData });
                  } else {
                      await prisma.commonTip.create({ data: tipData });
                  }
                  
                  console.log(`Verified/Updated [${totalProcessed + 1}]: ${youtubeId} (${isExternal ? 'EXT' : 'OFF'})`);
                  totalProcessed++;
                  chanProcessed++;
              } catch (err) {
                  console.error(`Failed ${youtubeId}:`, err.message);
              }
              
              if (totalProcessed >= maxToProcess) break;
              await new Promise(r => setTimeout(r, 3000));
            }

            pageToken = listResponse.data.nextPageToken;
            if (!pageToken || totalProcessed >= maxToProcess) break;
          }
      } catch (ce) {
          console.error(`Error processing channel ${channelId}:`, ce.message);
      }
  }

  console.log(`\nSync complete. Processed ${totalProcessed} videos.`);
}

run().catch(console.error).finally(() => process.exit(0));

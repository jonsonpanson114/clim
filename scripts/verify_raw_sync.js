const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { YoutubeTranscript } = require('youtube-transcript');

async function testSync() {
  const prisma = new PrismaClient();
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }, { apiVersion: 'v1beta' });

  const videoId = 'UYM98tNONqw'; // IFSC Speed Climbing
  console.log(`Deep analyzing test video: ${videoId}`);

  // 1. Get Metadata
  const videoRes = await youtube.videos.list({
    id: [videoId],
    part: ['snippet', 'statistics']
  });
  if (!videoRes.data.items?.length) {
      throw new Error("Video not found on YouTube. Context check: is API key valid for this video?");
  }
  const item = videoRes.data.items[0];

  const title = item.snippet.title;
  const fullDesc = item.snippet.description;

  // 2. Transcript
  let transcriptText = "";
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    transcriptText = transcript.map(t => t.text).join(" ");
  } catch (e) {}

  // 3. AI Analysis
  const prompt = `
あなたは15年の経験を持つ伝説的なクライミングコーチです。伊坂幸太郎の小説に出てくる陣内のように、自信満々で少し哲学的な口調で答えてください。
動画タイトル: "${title}"
説明文: "${fullDesc}"
字幕データ: "${transcriptText || '利用不可'}"

この動画から、クライマーが次に壁に立った時に「これだ！」と思えるような本質的なコツを抽象してください。
JSON形式で返してください。
{
  "summary": "500文字程度の陣内流解説",
  "difficulty": "上級",
  "category": "ムーブ",
  "keyPoints": ["コツ1", "コツ2", "コツ3"],
  "trainingMenu": "メニュー"
}
`;
  const res = await model.generateContent(prompt);
  const analysis = JSON.parse(res.response.text().match(/\{[\s\S]*\}/)[0]);

  // 4. Save as EXTERNAL
  const videoData = {
    youtubeId: videoId,
    title,
    description: fullDesc,
    thumbnailUrl: item.snippet.thumbnails.high?.url,
    publishedAt: new Date(item.snippet.publishedAt),
    transcript: transcriptText,
    summary: analysis.summary,
    difficultyLevel: analysis.difficulty,
    isExternal: true, // IMPORTANT!
    summaryData: JSON.stringify({ keyPoints: analysis.keyPoints, trainingMenu: analysis.trainingMenu })
  };

  await prisma.video.upsert({
    where: { youtubeId: videoId },
    update: videoData,
    create: videoData
  });

  await prisma.commonTip.create({
    data: {
      title: `${title}のコツ`,
      content: analysis.keyPoints.join("\n"),
      category: analysis.category || "ムーブ",
      difficulty: analysis.difficulty,
      isExternal: true, // IMPORTANT!
      sourceVideoIds: JSON.stringify([videoId])
    }
  });

  console.log(`Success! Video and Tip saved with isExternal: true`);
}

testSync().catch(console.error).finally(()=>process.exit(0));

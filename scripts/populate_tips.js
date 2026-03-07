const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const prisma = new PrismaClient();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }, { apiVersion: 'v1beta' });

  const SUMMARY_PROMPT = (title, content) => `
動画タイトル: "${title}"
入力データ: """
${content}
"""

上記のクライミング解説動画の情報を解析し、以下の情報をJSON形式で抽出してください。
出力は日本語で行い、プロのクライミングコーチとしての視点を忘れないでください。

JSONフォーマット:
{
  "summary": "動画の全体的な要約（300文字程度）",
  "difficulty": "初級, 中級, 上級 のいずれか",
  "category": "ムーブ, トレーニング, メンタル, 道具 のいずれか",
  "keyPoints": ["重要なコツ1", "重要なコツ2", "重要なコツ3"],
  "moveTechniques": ["使用されている具体的なムーブ名（例：ヒールフック、ダイノ等）"],
  "trainingMenu": "この動画の内容を実践するための具体的な練習TODOリスト"
}
`;

  const videos = await prisma.video.findMany();
  console.log(`Checking ${videos.length} videos...`);

  for (const video of videos) {
    const existingTip = await prisma.commonTip.findFirst({
      where: { sourceVideoIds: { contains: video.youtubeId } }
    });

    if (existingTip && existingTip.content && existingTip.content.trim() !== '') {
      console.log(`Skipping ${video.youtubeId} (Tip has content)`);
      continue;
    }

    if (existingTip) {
      console.log(`Retrying empty tip for ${video.youtubeId}: ${video.title}`);
    } else {
      console.log(`Analyzing ${video.youtubeId}: ${video.title}`);
    }

    const inputContent = video.transcript || video.description || video.title;
    const prompt = SUMMARY_PROMPT(video.title, inputContent);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
      const analysis = JSON.parse(jsonStr);

      if (existingTip) {
          await prisma.commonTip.update({
              where: { id: existingTip.id },
              data: {
                  content: analysis.keyPoints?.join("\n") || "ポイントなし",
                  category: analysis.category || "ムーブ",
                  difficulty: analysis.difficulty,
              }
          });
          console.log(`Updated empty tip for ${video.youtubeId}`);
      } else {
          await prisma.commonTip.create({
            data: {
              title: `${video.title}のポイント`,
              content: analysis.keyPoints?.join("\n") || "ポイントなし",
              category: analysis.category || "ムーブ",
              difficulty: analysis.difficulty,
              sourceVideoIds: JSON.stringify([video.youtubeId]),
            }
          });
          console.log(`Created new tip for ${video.youtubeId}`);
      }
    } catch (e) {
      console.error(`Error analyzing ${video.youtubeId}:`, e.message);
    }
  }
}

run().catch(console.error).finally(() => process.exit(0));

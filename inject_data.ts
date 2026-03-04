import { prisma } from "./src/lib/db/prisma";
import { climbingCoachModel } from "./src/lib/gemini/client";
import { SUMMARY_PROMPT } from "./src/lib/gemini/prompts";

const transcriptText = `0:00 [音楽] 0:04 皆さん 0:05 こんにちは小川先生です ... (中略) ... 胸から手を生やす意識 ... 肩甲骨を閉める ... 短い振り子 ... 振られを安定させるトレーニング ... `; // ここに抽出したテキストを入れる

async function inject() {
    const videoId = "ioaKIIbwN5U";
    const title = "トップクライマーに学ぶ、ダイノのコツ‼️";

    console.log("Analyzing with Gemini...");
    const prompt = SUMMARY_PROMPT(title, transcriptText);
    const result = await climbingCoachModel.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const analysis = JSON.parse(jsonStr);
    console.log("Analysis complete:", analysis);

    const video = await prisma.video.upsert({
        where: { youtubeId: videoId },
        update: {
            transcript: transcriptText,
            summary: analysis.summary,
            summaryData: JSON.stringify({
                keyPoints: analysis.keyPoints,
                moveTechniques: analysis.moveTechniques,
                trainingMenu: analysis.trainingMenu
            }),
            difficultyLevel: analysis.difficulty,
        },
        create: {
            youtubeId: videoId,
            title: title,
            description: "手動解析データ",
            thumbnailUrl: "https://i.ytimg.com/vi/ioaKIIbwN5U/hqdefault.jpg",
            publishedAt: new Date(),
            transcript: transcriptText,
            summary: analysis.summary,
            summaryData: JSON.stringify({
                keyPoints: analysis.keyPoints,
                moveTechniques: analysis.moveTechniques,
                trainingMenu: analysis.trainingMenu
            }),
            difficultyLevel: analysis.difficulty,
        }
    });

    console.log("Injected video ID:", video.id);
}

inject().finally(() => process.exit());

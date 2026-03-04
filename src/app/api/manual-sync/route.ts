import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { climbingCoachModel } from "@/lib/gemini/client";
import { SUMMARY_PROMPT } from "@/lib/gemini/prompts";

export async function POST(req: Request) {
    try {
        const { videoId, title, transcript } = await req.json();

        // 1. Geminiで解析
        const prompt = SUMMARY_PROMPT(title, transcript);
        const result = await climbingCoachModel.generateContent(prompt);
        const responseText = result.response.text();

        const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
        const analysis = JSON.parse(jsonStr);

        // 2. DBに保存
        const video = await prisma.video.upsert({
            where: { youtubeId: videoId },
            update: {
                transcript: transcript,
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
                description: "AI解析データ（手動インジェクション）",
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                publishedAt: new Date(),
                transcript: transcript,
                summary: analysis.summary,
                summaryData: JSON.stringify({
                    keyPoints: analysis.keyPoints,
                    moveTechniques: analysis.moveTechniques,
                    trainingMenu: analysis.trainingMenu
                }),
                difficultyLevel: analysis.difficulty,
            }
        });

        // 3. コツとしても保存
        await prisma.commonTip.create({
            data: {
                title: `${title}のポイント`,
                content: analysis.keyPoints.join("\n"),
                category: analysis.category,
                difficulty: analysis.difficulty,
                sourceVideoIds: JSON.stringify([videoId]),
            }
        });

        return NextResponse.json({ success: true, video });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { climbingCoachModel } from "@/lib/gemini/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: videoId } = await params;

    try {
        // 1. すでにクイズがあるかチェック
        const existing = await prisma.quiz.findMany({
            where: { videoId }
        });

        if (existing.length > 0) {
            return NextResponse.json(existing);
        }

        // 2. 動画データを取得
        const video = await prisma.video.findUnique({
            where: { youtubeId: videoId }
        });

        if (!video || !video.transcript) {
            return NextResponse.json({ error: "Video or transcript not found" }, { status: 404 });
        }

        // 3. Geminiでクイズを生成
        const prompt = `
以下のクライミング解説動画の内容に基づき、三択クイズを1問作成してください。
動画タイトル: "${video.title}"
内容: """
${video.transcript.substring(0, 5000)}
"""

JSON形式で出力してください:
{
  "question": "クイズの問題文",
  "options": ["選択肢A", "選択肢B", "選択肢C"],
  "answer": "正解の選択肢"
}
`;

        const geminiResult = await climbingCoachModel.generateContent(prompt);
        const responseText = geminiResult.response.text();
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
        const quizData = JSON.parse(jsonStr);

        // 4. DBに保存
        const quiz = await prisma.quiz.create({
            data: {
                videoId,
                question: quizData.question,
                options: JSON.stringify(quizData.options),
                answer: quizData.answer,
            }
        });

        return NextResponse.json([quiz]);
    } catch (error) {
        console.error("Quiz error:", error);
        return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
    }
}

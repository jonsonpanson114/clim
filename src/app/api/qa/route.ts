import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { climbingCoachModel } from "@/lib/gemini/client";
import { QA_PROMPT } from "@/lib/gemini/prompts";

export async function POST(request: Request) {
    try {
        const { question } = await request.json();

        if (!question) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        // 1. 関連する動画要約を取得（簡易的な全文検索または最新の要約）
        const relevantVideos = await prisma.video.findMany({
            take: 5,
            where: { summary: { not: null } },
            orderBy: { publishedAt: "desc" },
            select: { title: true, summary: true, youtubeId: true }
        });

        const context = relevantVideos
            .map(v => `動画: ${v.title}\n内容: ${v.summary}`)
            .join("\n\n");

        // 2. Geminiに回答を依頼
        const prompt = QA_PROMPT(question, context);
        const geminiResult = await climbingCoachModel.generateContent(prompt);
        const responseText = geminiResult.response.text();

        const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
        const analysis = JSON.parse(jsonStr);

        // 3. セッションをDBに保存
        const session = await prisma.qASession.create({
            data: {
                question,
                answer: analysis.answer,
                sources: JSON.stringify(relevantVideos.map(v => v.youtubeId)),
            }
        });

        return NextResponse.json({
            id: session.id,
            answer: analysis.answer,
            reasoning: analysis.reasoning,
            caution: analysis.caution,
            sources: relevantVideos
        });
    } catch (error) {
        console.error("QA error:", error);
        return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
    }
}

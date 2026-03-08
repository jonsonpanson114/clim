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

        // 1. 質問からキーワードを抽出して関連動画を検索 (簡易実装)
        const keywords = question.split(/[\s　,、]+/).filter((k: string) => k.length > 1);
        
        let relevantVideos;
        if (keywords.length > 0) {
            relevantVideos = await prisma.video.findMany({
                where: {
                    OR: [
                        ...keywords.map((k: string) => ({ title: { contains: k } })),
                        ...keywords.map((k: string) => ({ summary: { contains: k } })),
                    ]
                },
                take: 10,
                select: { title: true, summary: true, youtubeId: true, difficultyLevel: true, isExternal: true }
            });
        }

        // 検索結果が少ない場合は最新動画を補完
        if (!relevantVideos || relevantVideos.length < 3) {
            const recentVideos = await prisma.video.findMany({
                take: 10,
                orderBy: { publishedAt: "desc" },
                select: { title: true, summary: true, youtubeId: true, difficultyLevel: true, isExternal: true }
            });

            relevantVideos = [...(relevantVideos || []), ...recentVideos].slice(0, 10);
        }

        const context = relevantVideos
            .map(v => `動画ID: ${v.youtubeId}\nタイトル: ${v.title}\nソース: ${v.isExternal ? "外部の世界知識" : "公式解説"}\nコーチの分析: ${v.summary}`)
            .join("\n\n");


        // 2. Geminiに回答を依頼
        // プロンプトに「動画IDを引用して推薦してくれ」という指示を追加
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
            recommendedVideoIds: analysis.recommendedVideoIds || [],
            sources: relevantVideos
        });

    } catch (error) {
        console.error("QA error:", error);
        return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
    }
}

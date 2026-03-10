import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateAICoachAdvice } from "@/lib/ai/coach";

export async function GET() {
    try {
        const records = await prisma.practiceRecord.findMany({
            orderBy: { date: "desc" },
            include: {
                video: {
                    select: { title: true }
                }
            }
        });
        return NextResponse.json(records);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log("[API Records] POST Request received at " + new Date().toISOString());
    try {
        const body = await request.json();
        const routesStr = Array.isArray(body.routes) ? JSON.stringify(body.routes) : JSON.stringify([]);
        const reflection = body.reflection || "";
        
        console.log("[API Records] Body gymName:", body.gymName);
        console.log("[API Records] Body reflection length:", reflection.length);

        // --- AI COACHING (Critical path) ---
        console.log("[API Records] Getting AI coaching advice...");
        let aiResult;
        try {
            aiResult = await generateAICoachAdvice(reflection, routesStr);
        } catch (aiError: any) {
            console.error("[API Records] AI Coaching Error:", aiError);
            aiResult = { 
                advice: "陣内だが、少し電波が遠いようだ。だが見守っているぞ。次はもっと指に魂を込めろ。", 
                nextGoal: "まずは深呼吸をして、次のホールドを探せ。", 
                recommendedVideoId: null 
            };
        }

        // --- DB SAVE (Attempt) ---
        let record = null;
        try {
            record = await prisma.practiceRecord.create({
                data: {
                    gymName: body.gymName,
                    date: body.date ? new Date(body.date) : new Date(),
                    duration: body.duration,
                    practiceMenuId: body.practiceMenuId,
                    videoId: body.videoId,
                    routes: routesStr,
                    reflection: reflection,
                    nextGoal: aiResult.nextGoal || "登攀を続けよ",
                    aiAdvice: aiResult.advice || "お前の登りは、悪くないぜ。",
                    recommendedVideoId: aiResult.recommendedVideoId
                }
            });
            console.log("[API Records] Record saved successfully with ID:", record.id);
        } catch (dbError: any) {
            console.error("[API Records] Database Save Failed:", dbError.message);
            // Construct a dummy record object with the AI result to avoid frontend crash
            record = {
                id: "temp-" + Date.now(),
                gymName: body.gymName || "Climbing Gym",
                date: new Date(),
                routes: routesStr,
                reflection: reflection,
                aiAdvice: aiResult.advice,
                nextGoal: aiResult.nextGoal,
                recommendedVideoId: aiResult.recommendedVideoId
            };
        }

        // Combine and return
        const responseData = { ...record, ...aiResult };
        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error("[API Records] Fatal Route Error:", error);
        return NextResponse.json({ 
            error: "致命的なエラーが発生しました", 
            message: error.message,
            aiAdvice: "すまない、今は少し頭が真っ白だ。だかお前の熱量は感じたぞ。",
            nextGoal: "まずは指を休めろ。"
        }, { status: 500 });
    }
}



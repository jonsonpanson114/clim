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
    try {
        const body = await request.json();

        // Generate AI coaching advice
        const routesStr = JSON.stringify(body.routes || []);
        const aiCoachResult = await generateAICoachAdvice(body.reflection || "", routesStr);

        const record = await prisma.practiceRecord.create({
            data: {
                gymName: body.gymName,
                date: body.date ? new Date(body.date) : new Date(),
                duration: body.duration,
                practiceMenuId: body.practiceMenuId,
                videoId: body.videoId,
                routes: routesStr,
                reflection: body.reflection,
                nextGoal: aiCoachResult.nextGoal || body.nextGoal,
                aiAdvice: aiCoachResult.advice,
                recommendedVideoId: aiCoachResult.recommendedVideoId
            }
        });
        return NextResponse.json(record);
    } catch (error: any) {
        console.error("Record creation error:", error);
        return NextResponse.json({ error: "Failed to create record", message: error.message, stack: error.stack }, { status: 500 });
    }
}



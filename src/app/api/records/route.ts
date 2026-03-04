import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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
        const record = await prisma.practiceRecord.create({
            data: {
                gymName: body.gymName,
                date: body.date ? new Date(body.date) : new Date(),
                duration: body.duration,
                practiceMenuId: body.practiceMenuId,
                videoId: body.videoId,
                routes: JSON.stringify(body.routes || []),
                reflection: body.reflection,
                nextGoal: body.nextGoal,
            }
        });
        return NextResponse.json(record);
    } catch (error) {
        console.error("Record creation error:", error);
        return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
    }
}

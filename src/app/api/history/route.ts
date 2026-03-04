import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const history = await prisma.history.findMany({
            orderBy: { watchedAt: "desc" },
            include: { video: true },
            take: 20
        });
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { videoId } = await request.json();
        const history = await prisma.history.upsert({
            where: { videoId },
            update: { watchedAt: new Date() },
            create: { videoId, watchedAt: new Date() }
        });
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update history" }, { status: 500 });
    }
}

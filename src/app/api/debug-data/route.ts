import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const videos = await prisma.video.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ count: videos.length, videos });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

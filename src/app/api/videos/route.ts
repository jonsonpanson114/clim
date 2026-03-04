import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const difficulty = searchParams.get("difficulty");

    try {
        const videos = await prisma.video.findMany({
            where: {
                AND: [
                    query ? { title: { contains: query } } : {},
                    difficulty ? { difficultyLevel: difficulty } : {},
                ],
            },
            orderBy: { publishedAt: "desc" },
        });

        return NextResponse.json(videos);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
    }
}

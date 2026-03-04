import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const favorites = await prisma.favorite.findMany({
            include: {
                video: true
            }
        });
        return NextResponse.json(favorites);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { videoId } = await request.json();
        const favorite = await prisma.favorite.upsert({
            where: { videoId },
            update: {},
            create: { videoId }
        });
        return NextResponse.json(favorite);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update favorites" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { videoId } = await request.json();
        await prisma.favorite.delete({
            where: { videoId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
    }
}

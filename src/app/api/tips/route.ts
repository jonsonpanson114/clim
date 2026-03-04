import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    try {
        const tips = await prisma.commonTip.findMany({
            where: category ? { category } : {},
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(tips);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tips" }, { status: 500 });
    }
}

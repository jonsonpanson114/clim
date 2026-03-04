"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Clock, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardProps {
    id: string;
    youtubeId: string;
    title: string;
    thumbnailUrl: string;
    publishedAt: Date;
    difficultyLevel?: string;
    className?: string;
}

export function VideoCard({
    id,
    youtubeId,
    title,
    thumbnailUrl,
    publishedAt,
    difficultyLevel,
    className,
}: VideoCardProps) {
    const dateStr = new Date(publishedAt).toLocaleDateString("ja-JP");

    return (
        <Link
            href={`/videos/${youtubeId}`}
            className={cn(
                "group relative block premium-card glass overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 focus:outline-none focus:ring-2 focus:ring-accent/50",
                className
            )}
        >
            <div className="relative aspect-video w-full overflow-hidden">
                <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base/80 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-accent/90 p-4 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play fill="#0f172a" className="text-base" size={24} />
                    </div>
                </div>

                {difficultyLevel && (
                    <div className="absolute top-3 right-3 z-20">
                        <span className="text-[10px] font-bold px-2 py-1 bg-base/80 backdrop-blur-md border border-white/10 text-silk rounded-full uppercase tracking-tighter">
                            {difficultyLevel}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4 space-y-2">
                <h3 className="text-silk font-bold line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-300">
                    {title}
                </h3>

                <div className="flex items-center gap-4 text-[11px] text-silk/40">
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BarChart2 size={12} />
                        <span className="capitalize">{difficultyLevel || "分析中"}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

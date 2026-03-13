"use client";

import { useState } from "react";
import { Calendar, Target, ChevronDown, ChevronUp, Sparkles, PlayCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RecordCardProps {
    record: any;
}

export function RecordCard({ record }: RecordCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Handle both old format (objects) and new format (strings)
    const rawRoutes = JSON.parse(record.routes || "[]");
    const routes: string[] = Array.isArray(rawRoutes) ? rawRoutes.map((r: any) => {
        if (typeof r === 'string') return r;
        return `${r.grade || '不明'}：${r.success ? '1/1' : '0/1'}${r.notes ? `（${r.notes}）` : ""}`;
    }) : [];

    // Count successes robustly
    const successCount = routes.reduce((acc, r) => {
        const match = r.match(/：(\d+)\//);
        if (match) return acc + parseInt(match[1]);
        return acc + (r.includes('1/1') ? 1 : 0);
    }, 0);

    return (
        <div className="premium-card glass border-white/5 space-y-4 transition-all duration-300">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-silk/40 text-[10px] font-bold uppercase tracking-widest">
                    <Calendar size={12} />
                    <span>{new Date(record.date).toLocaleDateString("ja-JP")}</span>
                </div>
                <div className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded text-[8px] font-bold">
                    {successCount} SUCCESSES
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-silk font-bold text-lg">
                    {record.gymName || "Climbing Gym"}
                </h3>
                {record.video && (
                    <div className="flex items-center gap-1 text-[10px] text-highlight font-medium">
                        <Target size={10} />
                        <span>テーマ: {record.video.title}</span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {routes.map((r, i) => (
                    <div key={i} className="text-[11px] text-silk/80 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                        <span className="flex-1">{r}</span>
                    </div>
                ))}
            </div>

            {record.reflection && (
                <p className="text-xs text-silk/60 leading-relaxed italic border-l-2 border-white/10 pl-3">
                    "{record.reflection}"
                </p>
            )}

            {/* Details Section (Accordion) */}
            {isExpanded && (
                <div className="pt-4 mt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {/* Duration */}
                    {record.duration && (
                        <div className="flex items-center gap-2 text-silk/40 text-[10px]">
                            <Clock size={12} />
                            <span>トレーニング時間: {record.duration} 分</span>
                        </div>
                    )}

                    {/* AI Advice */}
                    {record.aiAdvice && (
                        <div className="bg-accent/5 border border-accent/10 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2 text-accent">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">AI Coach Analysis</span>
                            </div>
                            <p className="text-xs text-silk/90 leading-relaxed whitespace-pre-wrap">
                                {record.aiAdvice}
                            </p>
                        </div>
                    )}

                    {/* Next Goal */}
                    {record.nextGoal && (
                        <div className="bg-highlight/5 border border-highlight/10 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2 text-highlight">
                                <Target size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Next Goal</span>
                            </div>
                            <p className="text-xs text-silk/90">
                                {record.nextGoal}
                            </p>
                        </div>
                    )}

                    {/* Recommended Video */}
                    {record.recommendedVideoId && (
                        <Link 
                            href={`/videos/${record.recommendedVideoId}`}
                            className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <PlayCircle className="text-accent" size={20} />
                                <div>
                                    <p className="text-[10px] text-silk/40 font-bold uppercase">Recommended Video</p>
                                    <p className="text-xs text-silk font-medium">この課題を克服するためのヒント</p>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            )}

            <div className="pt-2 border-t border-white/5 flex justify-end">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-[10px] text-accent font-bold hover:underline transition-all"
                >
                    {isExpanded ? (
                        <>閉じる <ChevronUp size={12} /></>
                    ) : (
                        <>詳細を表示 <ChevronDown size={12} /></>
                    )}
                </button>
            </div>
        </div>
    );
}

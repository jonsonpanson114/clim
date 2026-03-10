import { prisma } from "@/lib/db/prisma";
import { ClipboardList, Calendar, MapPin, Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TrainingCalendar } from "@/components/features/TrainingCalendar";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
    const records = await prisma.practiceRecord.findMany({
        orderBy: { date: "desc" },
        include: { video: { select: { title: true } } },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="py-6 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 text-accent mb-2">
                        <ClipboardList size={24} />
                        <h1 className="text-3xl text-silk font-serif">Training <span className="text-accent italic">Records</span></h1>
                    </div>
                    <p className="text-silk/50 font-light">積み重ねてきた、あなたの進化の軌跡。</p>
                </div>
                <Link
                    href="/practice"
                    className="gold-gradient p-3 rounded-2xl shadow-lg shadow-accent/20 active:scale-90 transition-transform"
                >
                    <Plus size={20} className="text-base" />
                </Link>
            </header>

            <TrainingCalendar records={records} />


            <div className="grid gap-6">
                {records.length > 0 ? (
                    records.map((record) => {
                        const routes = JSON.parse(record.routes || "[]") as string[];
                        
                        // Let's count success from strings like "3級：3/5"
                        const successCount = routes.reduce((acc, r) => {
                            const match = r.match(/：(\d+)\//);
                            return acc + (match ? parseInt(match[1]) : 0);
                        }, 0);

                        return (
                            <div key={record.id} className="premium-card glass border-white/5 space-y-4">
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
                                            {r}
                                        </div>
                                    ))}
                                </div>

                                {record.reflection && (
                                    <p className="text-xs text-silk/60 leading-relaxed italic border-l-2 border-white/10 pl-3">
                                        "{record.reflection}"
                                    </p>
                                )}
                                <div className="pt-2 border-t border-white/5 flex justify-end">
                                    <button className="text-[10px] text-accent font-bold hover:underline">詳細を表示</button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="premium-card glass text-center py-20 text-silk/30 border-dashed border-white/5">
                        <ClipboardList size={48} className="mx-auto mb-4 opacity-10" />
                        <p>まだ記録がありません。練習を始めましょう。</p>
                    </div>
                )}
            </div>
        </div>
    );
}

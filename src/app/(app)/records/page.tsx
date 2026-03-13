import { prisma } from "@/lib/db/prisma";
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { TrainingCalendar } from "@/components/features/TrainingCalendar";
import { RecordCard } from "@/components/features/RecordCard";

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
                    records.map((record) => (
                        <RecordCard key={record.id} record={record} />
                    ))
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

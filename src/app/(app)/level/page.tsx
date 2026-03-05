import { prisma } from "@/lib/db/prisma";
import { TrendingUp, Award, BarChart3, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function LevelPage() {
    const records = await prisma.practiceRecord.findMany();

    // 簡易的な最高グレード計算
    let maxGrade = "採点なし";
    if (records.length > 0) {
        const allRoutes = records.flatMap(r => JSON.parse(r.routes || "[]"));
        const successRoutes = allRoutes.filter(r => r.success);
        if (successRoutes.length > 0) {
            // 本来はグレードの重み付けが必要だが、簡易的に最新の成功グレードを出す
            maxGrade = successRoutes[successRoutes.length - 1].grade;
        }
    }

    const stats = [
        { label: "練習回数", value: `${records.length}回`, icon: Award, color: "text-accent" },
        { label: "最高グレード", value: maxGrade, icon: TrendingUp, color: "text-highlight" },
        { label: "完了した分析", value: "12本", icon: BarChart3, color: "text-silk" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="py-6">
                <h1 className="text-3xl text-silk font-serif font-bold italic">Process & Level</h1>
                <p className="text-silk/50 font-light mt-1">数値で見る、あなたの成長。</p>
            </header>

            <section className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className={cn(
                        "premium-card glass border-white/5 p-6 flex flex-col justify-between h-32",
                        i === 0 ? "col-span-2" : "col-span-1"
                    )}>
                        <stat.icon className={stat.color} size={24} />
                        <div>
                            <p className="text-[10px] text-silk/40 font-bold uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl text-silk font-bold mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </section>

            <section className="space-y-4">
                <h2 className="text-lg text-silk font-serif border-b border-white/5 pb-2">グレード別 成功率</h2>
                <div className="space-y-4">
                    {[
                        { grade: "3級", success: 20, total: 100 },
                        { grade: "4級", success: 65, total: 100 },
                        { grade: "5級", success: 95, total: 100 },
                    ].map((item) => (
                        <div key={item.grade} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-silk/60">
                                <span>{item.grade}</span>
                                <span>{item.success}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full transition-all duration-1000"
                                    style={{ width: `${item.success}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="premium-card glass gold-gradient bg-opacity-20 text-silk p-6 border-none shadow-xl shadow-accent/10">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">次のマイルストーン</h3>
                        <p className="text-xs opacity-70 mt-1">3級を5回連続で完登する</p>
                    </div>
                    <ChevronRight size={24} />
                </div>
            </section>
        </div>
    );
}

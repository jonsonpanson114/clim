import { prisma } from "@/lib/db/prisma";
import { Lightbulb, Layers, Zap, Brain, Hammer, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const categoryIcons: Record<string, any> = {
    "ムーブ": Zap,
    "トレーニング": Hammer,
    "メンタル": Brain,
    "道具": Layers,
};

export default async function TipsPage(props: {
    searchParams: Promise<{ category?: string }>;
}) {
    const searchParams = await props.searchParams;
    const category = searchParams.category;

    const tips = await prisma.commonTip.findMany({
        where: category ? { category } : {},
        orderBy: { createdAt: "desc" },
    });

    const categories = ["ムーブ", "トレーニング", "メンタル", "道具"];
    
    // helper to get the first video ID from sourceVideoIds JSON
    const getFirstVideoId = (sourceVideoIds: string) => {
        try {
            const ids = JSON.parse(sourceVideoIds);
            return Array.isArray(ids) ? ids[0] : ids;
        } catch {
            return null;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="py-6">
                <div className="flex items-center gap-2 text-accent mb-2">
                    <Lightbulb size={24} />
                    <h1 className="text-3xl text-silk font-serif">Technique Tips</h1>
                </div>
                <p className="text-silk/50 font-light">
                    コーチが動画から抽出した、上達へのエッセンス。
                </p>
            </header>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
                <Link 
                    href="/tips"
                    className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                        !category ? "bg-accent text-base border-accent shadow-lg shadow-accent/20" : "bg-secondary text-silk/40 border-white/5"
                    )}
                >
                    すべて
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat}
                        href={`/tips?category=${cat}`}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                            category === cat ? "bg-accent text-base border-accent shadow-lg shadow-accent/20" : "bg-secondary text-silk/40 border-white/5"
                        )}
                    >
                        {cat}
                    </Link>
                ))}
            </div>

            <div className="grid gap-4">
                {tips.length > 0 ? (
                    tips.map((tip) => {
                        const Icon = categoryIcons[tip.category] || Lightbulb;
                        const videoId = getFirstVideoId(tip.sourceVideoIds);
                        
                        const CardContent = (
                            <div className="premium-card glass space-y-3 group border-white/5 relative hover:border-accent/30 transition-all cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-accent">
                                        <Icon size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{tip.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {tip.difficulty && (
                                            <span className="text-[8px] px-1.5 py-0.5 bg-silk/10 text-silk/40 rounded border border-white/5 capitalize">
                                                {tip.difficulty}
                                            </span>
                                        )}
                                        <ArrowRight size={14} className="text-silk/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                                <h3 className="text-silk font-bold group-hover:text-accent transition-colors pr-6">{tip.title}</h3>
                                <p className="text-sm text-silk/60 leading-relaxed line-clamp-3">
                                    {tip.content}
                                </p>
                            </div>
                        );

                        return videoId ? (
                            <Link key={tip.id} href={`/videos/${videoId}`}>
                                {CardContent}
                            </Link>
                        ) : (
                            <div key={tip.id}>{CardContent}</div>
                        );
                    })
                ) : (
                    <div className="premium-card glass text-center py-20 text-silk/30 border-dashed border-white/5">
                        <p>抽出されたコツがまだありません。</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import { Search } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { VideoCard } from "@/components/features/VideoCard";
import { SyncButton } from "@/components/features/SyncButton";

export default async function HomePage() {
    const latestVideos = await prisma.video.findMany({
        take: 4,
        orderBy: { publishedAt: "desc" },
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-12">
            <header className="py-6 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl text-silk tracking-tight">
                        Ascent <span className="text-accent italic font-serif">Premium</span>
                    </h1>
                    <p className="text-silk/60 mt-2 font-light">
                        高みを目指す、すべてのクライマーへ。
                    </p>
                </div>
                <SyncButton />
            </header>

            <section className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-silk/40 group-focus-within:text-accent transition-colors">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="技術、ムーブ、課題を検索..."
                    className="w-full bg-secondary/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-silk placeholder:text-silk/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all glass"
                />
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif text-silk/90">今日の練習メニュー</h2>
                <div className="premium-card glass border-l-4 border-accent">
                    <h3 className="text-lg font-bold text-accent">フットワークの精密化</h3>
                    <p className="text-sm text-silk/70 mt-2 leading-relaxed">
                        静止した状態での正確な足場選びに焦点を当てます。動画「足形トレーニング」の要約をチェックしてください。
                    </p>
                    <div className="mt-4 flex gap-2">
                        <span className="text-[10px] px-2 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full uppercase tracking-wider">Technique</span>
                        <span className="text-[10px] px-2 py-1 bg-highlight/10 border border-highlight/20 text-highlight rounded-full uppercase tracking-wider">Level 2</span>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-serif text-silk/90">最新の動画解説</h2>
                    <button className="text-xs text-accent hover:underline">すべて見る</button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {latestVideos.length > 0 ? (
                        latestVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                id={video.id}
                                youtubeId={video.youtubeId}
                                title={video.title}
                                thumbnailUrl={video.thumbnailUrl || ""}
                                publishedAt={video.publishedAt}
                                difficultyLevel={video.difficultyLevel || undefined}
                            />
                        ))
                    ) : (
                        <div className="premium-card glass text-center py-12">
                            <p className="text-silk/40">解析済みの動画がまだありません。</p>
                            <p className="text-silk/20 text-xs mt-2">API同期を実行してください。</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

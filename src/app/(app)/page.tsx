import { Search, Plus, Sparkles, ArrowRight } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { VideoCard } from "@/components/features/VideoCard";
import { SyncButton } from "@/components/features/SyncButton";
import { HomeSearch } from "@/components/features/HomeSearch";

import { InstallBanner } from "@/components/features/InstallBanner";

export const dynamic = "force-dynamic";

export default async function HomePage() {

    const latestVideos = await prisma.video.findMany({
        take: 4,
        orderBy: { publishedAt: "desc" },
    });

    const latestRecord = await prisma.practiceRecord.findFirst({
        orderBy: { date: "desc" },
        where: { aiAdvice: { not: null } }
    });

    const totalRecords = await prisma.practiceRecord.count();
    const allRecords = await prisma.practiceRecord.findMany({
        select: { routes: true, date: true }
    });

    const totalSuccess = allRecords.reduce((acc, rec) => {
        const routes = JSON.parse(rec.routes || "[]");
        return acc + routes.filter((r: any) => r.success).length;
    }, 0);

    const thisMonth = new Date().getMonth();
    const sessionsThisMonth = allRecords.filter(rec => new Date(rec.date).getMonth() === thisMonth).length;

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
                <div className="flex gap-2">
                    <Link
                        href="/practice"
                        className="gold-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        <span className="text-sm">練習を開始</span>
                    </Link>
                    <SyncButton />
                </div>
            </header>

            <section className="grid grid-cols-3 gap-4">
                <div className="premium-card glass p-4 text-center space-y-1">
                    <p className="text-[10px] text-silk/40 font-bold uppercase tracking-widest">Sessions</p>
                    <p className="text-2xl text-silk font-serif">{totalRecords}</p>
                </div>
                <div className="premium-card glass p-4 text-center space-y-1">
                    <p className="text-[10px] text-silk/40 font-bold uppercase tracking-widest">Success</p>
                    <p className="text-2xl text-accent font-serif">{totalSuccess}</p>
                </div>
                <div className="premium-card glass p-4 text-center space-y-1">
                    <p className="text-[10px] text-silk/40 font-bold uppercase tracking-widest">Month</p>
                    <p className="text-2xl text-highlight font-serif">{sessionsThisMonth}</p>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-serif text-silk/90">AI Coaching</h2>
                    {latestRecord && <span className="bg-accent text-base text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter animate-pulse uppercase">Recent Analysis</span>}
                </div>

                {latestRecord ? (
                    <div className="premium-card glass border-l-4 border-accent p-6 space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-accent font-bold uppercase tracking-widest">前回のコーチング</p>
                            <p className="text-silk leading-relaxed italic">
                                「{latestRecord.aiAdvice}」
                            </p>
                        </div>
                        <div className="pt-3 border-t border-white/5 space-y-1">
                            <p className="text-[10px] text-silk/40 font-bold uppercase tracking-widest">今日挑戦すべきこと</p>
                            <p className="text-sm text-silk font-medium">
                                {latestRecord.nextGoal}
                            </p>
                        </div>
                    </div>
                ) : (
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
                )}
            </section>

            <HomeSearch />

            <section className="animate-in fade-in duration-1000 delay-200">
                <Link 
                    href="/qa"
                    className="block group overflow-hidden glass-premium rounded-[2rem] p-6 border border-white/10 hover:border-accent/40 transition-all active:scale-[0.98] relative"
                >
                    <div className="absolute top-0 right-0 p-8 text-accent/10 group-hover:text-accent/20 transition-colors">
                        <Sparkles size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl gold-gradient flex items-center justify-center text-base">
                                <Sparkles size={18} />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-white font-serif">Elite Coach Chat</h2>
                        </div>
                        <p className="text-silk/70 text-sm leading-relaxed max-w-[80%]">
                            「ヒールフックが抜ける」「オブザベのコツは？」<br/>
                            15年の経験を持つAIコーチが、お前の悩みに即答するぜ。
                        </p>
                        <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest mt-2">
                            <span>コーチに相談する</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>
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
                                isExternal={video.isExternal}
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

            <InstallBanner />
        </div>

    );
}

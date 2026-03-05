import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Lightbulb, Info, CheckCircle2, Youtube } from "lucide-react";

export default async function VideoDetailPage(props: {
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;
    const video = await prisma.video.findUnique({
        where: { youtubeId: params.id },
    });

    if (!video) {
        notFound();
    }

    const analysisData = video.summaryData ? JSON.parse(video.summaryData) : null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <section className="aspect-video w-full glass rounded-3xl overflow-hidden shadow-2xl relative border-white/5">
                <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </section>

            <header className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent">
                    <Youtube size={14} />
                    <span>YouTube Coach Analysis</span>
                </div>
                <h1 className="text-2xl text-silk font-bold leading-tight">
                    {video.title}
                </h1>
                <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-highlight/10 border border-highlight/20 text-highlight rounded-full">
                        {video.difficultyLevel || "分析中"}
                    </span>
                </div>
            </header>

            <section className="grid gap-6">
                <div className="premium-card glass space-y-4">
                    <div className="flex items-center gap-2 text-accent">
                        <Info size={20} />
                        <h2 className="font-serif text-lg">AIによる要約</h2>
                    </div>
                    <p className="text-silk/80 text-sm leading-relaxed">
                        {video.summary || "要約を生成中です..."}
                    </p>
                </div>

                {analysisData && (
                    <>
                        <div className="premium-card glass space-y-4">
                            <div className="flex items-center gap-2 text-highlight">
                                <Lightbulb size={20} />
                                <h2 className="font-serif text-lg">重要ポイント</h2>
                            </div>
                            <ul className="space-y-3">
                                {analysisData.keyPoints?.map((point: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm text-silk/70">
                                        <span className="text-accent mt-1">•</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="premium-card glass border-l-4 border-highlight space-y-4">
                            <div className="flex items-center gap-2 text-silk">
                                <CheckCircle2 size={20} />
                                <h2 className="font-serif text-lg">この動画のTODOリスト</h2>
                            </div>
                            <div className="text-sm text-silk/70 whitespace-pre-wrap leading-relaxed">
                                {analysisData.trainingMenu}
                            </div>
                        </div>
                    </>
                )}
            </section>

            <div className="flex gap-4">
                <button className="flex-1 py-4 glass border border-white/10 rounded-2xl text-silk font-bold active:scale-95 transition-all text-sm">
                    保存する
                </button>
                <button className="flex-1 py-4 gold-gradient rounded-2xl text-base font-bold active:scale-95 transition-all text-sm shadow-lg shadow-accent/20">
                    練習を開始
                </button>
            </div>
        </div>
    );
}

"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { Lightbulb, Info, CheckCircle2, Youtube, Volume2, Square } from "lucide-react";

interface VideoData {
    id: string;
    youtubeId: string;
    title: string;
    summary: string;
    summaryData: string;
    difficultyLevel: string;
}

export default function VideoDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [video, setVideo] = useState<VideoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        const fetchVideo = async () => {
            const resolvedParams = await params;
            const res = await fetch(`/api/videos/${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setVideo(data);
            }
            setLoading(false);
        };
        fetchVideo();
    }, [params]);

    if (loading) return <div className="p-8 text-silk/40">Loading coaching data...</div>;
    if (!video) notFound();

    const analysisData = video.summaryData ? JSON.parse(video.summaryData) : null;

    const handleSpeak = () => {
        if (!window.speechSynthesis) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const text = `
            ${video.title}のポイントを解説するぜ。
            要約。${video.summary}。
            重要ポイント。${analysisData?.keyPoints?.join("。")}。
            トレーニングメニュー。${analysisData?.trainingMenu}。
            以上だ。高みを目指して頑張れよ。
        `;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = 1.0;
        utterance.onend = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

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

            <header className="space-y-4 px-1">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent">
                            <Youtube size={14} />
                            <span>YouTube Coach Analysis</span>
                        </div>
                        <h1 className="text-2xl text-silk font-bold leading-tight">
                            {video.title}
                        </h1>
                    </div>
                    <button
                        onClick={handleSpeak}
                        className={`p-3 rounded-2xl glass border border-white/10 transition-all ${isSpeaking ? 'text-accent border-accent/30 animate-pulse' : 'text-silk/60 hover:text-accent'}`}
                        title="音声でコツを聴く"
                    >
                        {isSpeaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                    </button>
                </div>
                <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-highlight/10 border border-highlight/20 text-highlight rounded-full uppercase tracking-tighter">
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

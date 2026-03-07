"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, X, Check, Target, MapPin, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface RouteEntry {
    grade: string;
    success: boolean;
    notes: string;
}

export default function PracticeForm() {
    const router = useRouter();
    const [gymName, setGymName] = useState("");
    const [reflection, setReflection] = useState("");
    const [routes, setRoutes] = useState<RouteEntry[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coachResult, setCoachResult] = useState<any>(null);

    const addRoute = () => {
        setRoutes([...routes, { grade: "5級", success: true, notes: "" }]);
    };

    const updateRoute = (index: number, field: keyof RouteEntry, value: any) => {
        const newRoutes = [...routes];
        newRoutes[index] = { ...newRoutes[index], [field]: value };
        setRoutes(newRoutes);
    };

    const removeRoute = (index: number) => {
        setRoutes(routes.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gymName,
                    routes,
                    reflection,
                    date: new Date(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setCoachResult(data);
                // router.push("/records"); // Don't redirect immediately
                // router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (coachResult) {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-1000 pb-24">
                <header className="py-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-accent/10">
                        <Check size={40} className="text-accent" />
                    </div>
                    <h1 className="text-4xl text-silk font-serif font-bold italic">Session Logged.</h1>
                    <p className="text-silk/60">素晴らしい練習でした。コーチの分析が終わりました。</p>
                </header>

                <section className="premium-card glass border-l-4 border-accent p-8 space-y-6">
                    <div className="flex items-center gap-3 text-accent mb-2">
                        <div className="bg-accent text-base px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter">AI Coach</div>
                        <h2 className="text-xl font-serif text-silk font-bold italic">Training Analysis</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-lg text-silk leading-relaxed font-medium">
                            「{coachResult.aiAdvice}」
                        </p>

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-3">
                            <h3 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                <Target size={14} />
                                次回の目標
                            </h3>
                            <p className="text-silk/80 text-sm leading-relaxed">
                                {coachResult.nextGoal}
                            </p>
                        </div>
                    </div>
                </section>

                {coachResult.recommendedVideoId && (
                    <section className="space-y-4">
                        <h3 className="text-sm font-serif text-silk/60 italic ml-2">Recommended for you:</h3>
                        <Link href={`/videos/${coachResult.recommendedVideoId}`} className="block premium-card glass p-4 border border-white/10 hover:border-accent/30 transition-all group">
                            <div className="flex gap-4">
                                <div className="relative w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0">
                                    <Image
                                        src={`https://i.ytimg.com/vi/${coachResult.recommendedVideoId}/hqdefault.jpg`}
                                        alt="Recommended Video"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-base/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play size={20} fill="white" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className="text-sm font-bold text-silk group-hover:text-accent transition-colors line-clamp-2">必見のテクニック解説動画</h4>
                                    <p className="text-[10px] text-silk/40 uppercase tracking-widest font-bold">Watch & Learn</p>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => router.push("/records")}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-silk text-sm font-bold transition-all"
                    >
                        履歴を見る
                    </button>
                    <button
                        onClick={() => setCoachResult(null)}
                        className="w-full py-4 gold-gradient rounded-2xl text-base text-sm font-bold shadow-lg shadow-accent/10 transition-all active:scale-95"
                    >
                        もう一度入力
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
            <header className="py-6">
                <h1 className="text-3xl text-silk font-serif font-bold">New Session</h1>
                <p className="text-silk/50 font-light mt-1">今日の登攀を記録に残そう。</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-silk/80 text-sm font-bold">
                        <MapPin size={16} />
                        <span>ジムの情報</span>
                    </div>
                    <input
                        type="text"
                        value={gymName}
                        onChange={(e) => setGymName(e.target.value)}
                        placeholder="ジム名を入力（例: 秋葉原B-PUMP）"
                        className="w-full bg-secondary/50 border border-white/5 rounded-2xl py-4 px-4 text-silk placeholder:text-silk/30 focus:outline-none focus:ring-2 focus:ring-accent/40 glass"
                    />
                </section>

                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-silk/80 text-sm font-bold">
                            <Target size={16} />
                            <span>登攀ルート</span>
                        </div>
                        <button
                            type="button"
                            onClick={addRoute}
                            className="flex items-center gap-1 text-[10px] text-accent font-bold uppercase transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={14} />
                            <span>ルートを追加</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {routes.map((route, index) => (
                            <div key={index} className="flex gap-2 items-center animate-in zoom-in-95 duration-300">
                                <input
                                    value={route.grade}
                                    onChange={(e) => updateRoute(index, "grade", e.target.value)}
                                    className="w-20 bg-secondary/30 border border-white/5 rounded-xl p-2 text-center text-silk text-sm focus:ring-1 focus:ring-accent/50"
                                    placeholder="グレード"
                                />
                                <button
                                    type="button"
                                    onClick={() => updateRoute(index, "success", !route.success)}
                                    className={cn(
                                        "flex-1 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-bold",
                                        route.success
                                            ? "bg-accent/20 border-accent/40 text-accent"
                                            : "bg-secondary/40 border-white/10 text-silk/30"
                                    )}
                                >
                                    <Check size={14} />
                                    {route.success ? "SUCCESS" : "FAILED"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeRoute(index)}
                                    className="p-2 text-silk/20 hover:text-red-400 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                        {routes.length === 0 && (
                            <div className="py-8 text-center glass border border-dashed border-white/5 rounded-2xl text-silk/20 text-xs italic">
                                ルート記録なし（追加ボタンを押して開始）
                            </div>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-silk/80 text-sm font-bold">今日の振り返り / 次の目標</h2>
                    <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        rows={4}
                        className="w-full bg-secondary/50 border border-white/5 rounded-2xl py-4 px-4 text-silk placeholder:text-silk/30 focus:outline-none focus:ring-2 focus:ring-accent/40 glass resize-none"
                        placeholder="登っていて気づいたこと、次にやりたい課題など。"
                    />
                </section>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 gold-gradient rounded-3xl text-base font-bold text-base shadow-2xl shadow-accent/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-base/30 border-t-base rounded-full animate-spin" />
                            <span>Coach is thinking...</span>
                        </div>
                    ) : (
                        <>
                            <Save size={20} />
                            <span>記録を保存してコーチングを受ける</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

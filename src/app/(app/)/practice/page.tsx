"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, X, Check, Target, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

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
                router.push("/records");
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <div className="w-5 h-5 border-2 border-base/30 border-t-base rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save size={20} />
                            <span>記録を保存して終了</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Plus, Youtube, Loader2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImportVideoForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [error, setError] = useState("");
    const router = useRouter();

    const extractVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        const youtubeId = extractVideoId(url);
        if (!youtubeId) {
            setError("有効なYouTube URLを入力してください。");
            return;
        }

        setStatus("loading");
        setError("");

        try {
            const res = await fetch("/api/sync/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ youtubeId }),
            });

            if (!res.ok) throw new Error("インポートに失敗しました。");

            setStatus("success");
            setTimeout(() => {
                setIsOpen(false);
                setStatus("idle");
                setUrl("");
                router.refresh();
            }, 2000);
        } catch (err: any) {
            setStatus("error");
            setError(err.message || "エラーが発生しました。");
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-xs font-bold border border-accent/20 hover:bg-accent/20 transition-all"
            >
                <Plus size={14} />
                <span>コーチに動画を教える</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="premium-card glass w-full max-w-md space-y-6 border-white/10 shadow-2xl relative">
                <button 
                    onClick={() => { setIsOpen(false); setStatus("idle"); }}
                    className="absolute top-4 right-4 text-silk/40 hover:text-silk transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="space-y-2">
                    <h3 className="text-xl text-silk font-serif">コーチに知識を授ける</h3>
                    <p className="text-xs text-silk/50">
                        YouTubeのURLを入力してください。陣内コーチが即座に解析し、奥義を抽出します。
                    </p>
                </div>

                <form onSubmit={handleImport} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-silk/40">YouTube URL</label>
                        <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-silk/30" size={18} />
                            <input 
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full bg-secondary/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-silk placeholder:text-silk/20 focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none transition-all"
                                disabled={status === "loading"}
                            />
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</p>}

                    <button 
                        type="submit"
                        disabled={status === "loading" || !url}
                        className="w-full py-3 bg-accent text-base font-bold rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>解析中...</span>
                            </>
                        ) : status === "success" ? (
                            <>
                                <Check size={18} />
                                <span>習得完了！</span>
                            </>
                        ) : (
                            <span>知識を同期する</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

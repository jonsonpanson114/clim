"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "bot";
    content: string;
    reasoning?: string;
    caution?: string;
}

export default function QAPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "bot",
            content: "こんにちは。Ascent PremiumのAIコーチだ。動画から解析した内容を元に、お前の登りの悩みに答えるぜ。何が知りたい？",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/qa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: userMsg }),
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: data.answer,
                    reasoning: data.reasoning,
                    caution: data.caution
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: "済まない、少し考えがまとまらないようだ。後でまた聞いてくれ。" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-120px)] max-w-2xl mx-auto animate-in fade-in duration-500">
            <header className="py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-base shadow-lg shadow-accent/20">
                        <Bot size={18} />
                    </div>
                    <h1 className="text-silk font-bold font-serif">AI Coach</h1>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-accent font-bold uppercase tracking-wider">
                    <Sparkles size={12} />
                    <span>Gemini 2.5 Flash</span>
                </div>
            </header>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide"
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex flex-col gap-2 max-w-[85%]",
                            msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                    >
                        <div
                            className={cn(
                                "p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                                msg.role === "user"
                                    ? "bg-accent text-base rounded-tr-none shadow-accent/10"
                                    : "glass text-silk/90 rounded-tl-none border-white/5"
                            )}
                        >
                            {msg.content}
                        </div>

                        {msg.role === "bot" && (msg.reasoning || msg.caution) && (
                            <div className="w-full space-y-3 mt-1 px-1">
                                {msg.reasoning && (
                                    <div className="glass-sm border border-white/5 p-3 rounded-2xl space-y-2 bg-white/2">
                                        <div className="flex items-center gap-2 text-silk/40 uppercase tracking-tighter text-[9px] font-bold">
                                            <Sparkles size={10} className="text-accent" />
                                            <span>思考プロセス</span>
                                        </div>
                                        <p className="text-[11px] text-silk/50 leading-relaxed italic">
                                            {msg.reasoning}
                                        </p>
                                    </div>
                                )}
                                {msg.caution && (
                                    <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-2xl flex gap-3 items-start animate-pulse-slow">
                                        <div className="bg-red-500/20 p-1.5 rounded-lg text-red-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">コーチの警告</p>
                                            <p className="text-xs text-red-200/80 leading-snug">{msg.caution}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 mr-auto items-center glass p-4 rounded-3xl rounded-tl-none animate-pulse">
                        <Loader2 className="animate-spin text-silk/40" size={16} />
                        <span className="text-xs text-silk/40 font-light">コーチが動画と言語を解析中...</span>
                    </div>
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className="mt-4 relative"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="登り方やトレーニングの疑問を投げてくれ。"
                    className="w-full bg-secondary/80 border border-white/10 rounded-2xl py-4 pl-4 pr-14 text-silk placeholder:text-silk/30 focus:outline-none focus:ring-2 focus:ring-accent/40 glass"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-2 p-3 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-all disabled:opacity-30"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

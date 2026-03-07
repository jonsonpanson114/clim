"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Sparkles, Youtube, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface VideoSource {
    youtubeId: string;
    title: string;
    summary: string;
}

interface Message {
    role: "user" | "bot";
    content: string;
    reasoning?: string;
    caution?: string;
    recommendedVideos?: VideoSource[];
}

export default function QAPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "bot",
            content: "よお。Ascent PremiumのAIコーチだ。俺はお前の悩みを聞くためにここにいる。ヒールフックが抜ける、オブザベができない、なんでもいい。お前の『壁の前での迷い』を俺にぶつけてみろ。解決の糸口を、過去の動画から引きずり出してやるぜ。",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isLoading]);

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

            // Filter sources based on recommendedVideoIds from Gemini
            const recommended = data.sources?.filter((s: VideoSource) => 
                data.recommendedVideoIds?.includes(s.youtubeId)
            ) || [];

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: data.answer,
                    reasoning: data.reasoning,
                    caution: data.caution,
                    recommendedVideos: recommended
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: "済まない、少し思考のホールドが滑ったようだ。もう一度聞かせてくれ。" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-120px)] max-w-2xl mx-auto">
            <header className="py-4 border-b border-white/5 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-10 h-10 rounded-2xl gold-gradient flex items-center justify-center text-base shadow-xl shadow-accent/20"
                    >
                        <Bot size={22} />
                    </motion.div>
                    <div>
                        <h1 className="text-silk font-bold font-serif leading-tight">Elite Coach Chat</h1>
                        <p className="text-[9px] text-silk/40 uppercase tracking-widest font-bold">Expert AI Analysis</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-[10px] text-accent font-bold uppercase tracking-wider bg-accent/5 px-2 py-1 rounded-full border border-accent/10">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>Gemini 3 Flash</span>
                    </div>
                </div>
            </header>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto py-6 px-2 space-y-8 scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn(
                                "flex flex-col gap-3",
                                msg.role === "user" ? "ml-auto items-end w-[85%]" : "mr-auto items-start w-[90%]"
                            )}
                        >
                            <div
                                className={cn(
                                    "p-5 rounded-[2rem] text-sm leading-relaxed shadow-xl relative overflow-hidden",
                                    msg.role === "user"
                                        ? "bg-accent text-base rounded-tr-none shadow-accent/20 border border-white/10"
                                        : "glass-premium text-silk/90 rounded-tl-none border-white/10"
                                )}
                            >
                                {msg.role === "bot" && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-accent/30" />
                                )}
                                {msg.content}
                            </div>

                            {msg.role === "bot" && (msg.reasoning || msg.caution || msg.recommendedVideos?.length) && (
                                <div className="w-full space-y-4 mt-1">
                                    {msg.reasoning && (
                                        <div className="glass-sm border border-white/5 p-4 rounded-3xl space-y-2 bg-silk/[0.02] ml-2">
                                            <div className="flex items-center gap-2 text-silk/40 uppercase tracking-widest text-[8px] font-black">
                                                <Sparkles size={12} className="text-accent" />
                                                <span>Thinking Process</span>
                                            </div>
                                            <p className="text-[11px] text-silk/40 leading-relaxed italic font-light">
                                                {msg.reasoning}
                                            </p>
                                        </div>
                                    )}

                                    {msg.recommendedVideos && msg.recommendedVideos.length > 0 && (
                                        <div className="space-y-3 ml-2">
                                            <div className="flex items-center gap-2 text-accent/60 uppercase tracking-widest text-[8px] font-black pl-1">
                                                <Youtube size={12} />
                                                <span>Recommended Analysis</span>
                                            </div>
                                            <div className="grid gap-2">
                                                {msg.recommendedVideos.map((vid) => (
                                                    <Link 
                                                        key={vid.youtubeId} 
                                                        href={`/videos/${vid.youtubeId}`}
                                                        className="group flex items-center gap-3 p-3 glass border border-white/5 rounded-2xl hover:border-accent/40 transition-all active:scale-[0.98]"
                                                    >
                                                        <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-silk/10 border border-white/5">
                                                            <img 
                                                                src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`} 
                                                                alt={vid.title}
                                                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-[11px] font-bold text-silk line-clamp-1 group-hover:text-accent transition-colors">
                                                                {vid.title}
                                                            </h4>
                                                            <p className="text-[9px] text-silk/40 line-clamp-1 italic">
                                                                コーチがこの動画を選んだ理由あり
                                                            </p>
                                                        </div>
                                                        <ArrowRight size={14} className="text-silk/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {msg.caution && (
                                        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-3xl flex gap-3 items-start ml-2 border-l-4 border-l-red-500/50">
                                            <div className="bg-red-500/20 p-1.5 rounded-xl text-red-400">
                                                <AlertCircleIcon />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] text-red-400 font-black uppercase tracking-widest">Danger Alert</p>
                                                <p className="text-[11px] text-red-200/70 leading-relaxed font-medium">{msg.caution}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex gap-4 mr-auto items-center glass p-5 rounded-3xl rounded-tl-none border border-white/10"
                    >
                        <div className="flex gap-1">
                            <motion.span 
                                animate={{ y: [0, -5, 0] }} 
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                className="w-1.5 h-1.5 rounded-full bg-accent"
                            />
                            <motion.span 
                                animate={{ y: [0, -5, 0] }} 
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                className="w-1.5 h-1.5 rounded-full bg-accent/60"
                            />
                            <motion.span 
                                animate={{ y: [0, -5, 0] }} 
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                className="w-1.5 h-1.5 rounded-full bg-accent/30"
                            />
                        </div>
                        <span className="text-[11px] text-silk/50 font-bold uppercase tracking-widest">Coach Analyzing...</span>
                    </motion.div>
                )}
            </div>

            <div className="p-4 bg-secondary/50 backdrop-blur-xl border-t border-white/5">
                <form
                    onSubmit={handleSubmit}
                    className="relative max-w-2xl mx-auto"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="「ヒールフックのコツは？」など"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-5 pr-16 text-silk placeholder:text-silk/20 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all font-medium shadow-inner"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 bottom-2 px-4 gold-gradient text-base rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-accent/20 flex items-center justify-center"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}

function AlertCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    );
}

"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function HomeSearch() {
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed || isSearching) return;
        
        setIsSearching(true);
        router.push(`/qa?q=${encodeURIComponent(trimmed)}`);
    };




    return (
        <section className="relative group">
            <form onSubmit={handleSearch}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-silk/40 group-focus-within:text-accent transition-colors">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="技術、ムーブ、課題を検索..."
                    className="w-full bg-secondary/30 border border-white/5 rounded-2xl py-3 pl-10 pr-16 text-sm text-silk placeholder:text-silk/20 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 transition-all glass"
                />
                <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-accent text-base text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 active:scale-95 transition-all text-white disabled:opacity-50"
                >
                    {isSearching ? "..." : "Search"}
                </button>


            </form>
        </section>
    );
}

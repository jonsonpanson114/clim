"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Lightbulb, PlayCircle, ClipboardList, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "探す", icon: Search, href: "/" },
    { label: "コツ", icon: Lightbulb, href: "/tips" },
    { label: "相談", icon: Sparkles, href: "/qa" },
    { label: "練習", icon: PlayCircle, href: "/practice" },
    { label: "履歴", icon: ClipboardList, href: "/records" },
];


export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-6 pb-6 pt-3 flex justify-between items-center rounded-t-3xl sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md sm:rounded-3xl sm:border-x">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative flex flex-col items-center gap-1 transition-all duration-300",
                            isActive ? "text-accent scale-110" : "text-white/60 hover:text-white"
                        )}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {isActive && (
                            <div className="absolute -bottom-2 w-1 h-1 bg-accent rounded-full" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SyncButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const router = useRouter();

    const handleSync = async () => {
        if (status === "loading") return;

        setStatus("loading");
        try {
            const response = await fetch("/api/sync");
            const data = await response.json();

            if (data.success) {
                setStatus("success");
                router.refresh(); // 最新の動画を表示するためにページをリフレッシュ
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Sync failed:", error);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 5000);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={status === "loading"}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl glass border border-white/10 text-xs font-bold transition-all active:scale-95",
                status === "success" ? "text-highlight border-highlight/30" : "text-silk/60 hover:text-silk"
            )}
        >
            {status === "loading" ? (
                <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Syncing...</span>
                </>
            ) : status === "success" ? (
                <>
                    <CheckCircle2 size={14} />
                    <span>Updated</span>
                </>
            ) : status === "error" ? (
                <>
                    <AlertCircle className="text-red-400" size={14} />
                    <span className="text-red-400">Error</span>
                </>
            ) : (
                <>
                    <RefreshCw size={14} />
                    <span>Sync</span>
                </>
            )}
        </button>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function InstallBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // すでにホーム画面から起動されている場合は表示しない
        if (window.matchMedia("(display-mode: standalone)").matches) {
            return;
        }

        // 以前に閉じたことがあるかチェック（セッション中のみ非表示にするなど、必要に応じてローカルストレージを使用）
        const isDismissed = sessionStorage.getItem("install-banner-dismissed");
        if (isDismissed) return;

        // プラットフォーム判定
        const ua = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(ua)) {
            setPlatform("ios");
            setIsVisible(true);
        } else if (/android/.test(ua)) {
            setPlatform("android");
            // Androidの場合は beforeinstallprompt を待つ
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setPlatform("android");
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (platform === "android" && deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
                setIsVisible(false);
            }
        } else if (platform === "ios") {
            // iOSは自動実行できないため、ガイドを表示したままにするか
            // 詳細なモーダルを開くなどの処理を行う
            alert("Safariの『共有』ボタンから『ホーム画面に追加』を選択してください。");
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem("install-banner-dismissed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="premium-card glass p-4 flex items-center justify-between border-accent/30 shadow-2xl shadow-accent/20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
                        <Download size={20} className="text-base" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-silk">アプリとして利用する</h4>
                        <p className="text-[10px] text-silk/60">ホーム画面に追加して、全画面で快適に。</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInstall}
                        className="px-4 py-2 bg-accent text-base text-[10px] font-black uppercase tracking-widest rounded-lg active:scale-95 transition-all shadow-lg shadow-accent/20"
                    >
                        {platform === "ios" ? "追加方法を表示" : "インストール"}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-silk/40 hover:text-silk transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* iOS向け詳細ガイドモーダル（簡易実装） */}
            {platform === "ios" && (
                <div className="hidden">
                    {/* ここに詳細なステップを追加可能 */}
                </div>
            )}
        </div>
    );
}

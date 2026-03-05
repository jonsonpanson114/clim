import { BottomNav } from "@/components/mobile/BottomNav";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen pb-24">
            <main className="max-w-md mx-auto p-4 md:max-w-4xl">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}

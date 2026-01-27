import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-bg-0 text-text-1 font-sans antialiased selection:bg-accent-violet selection:text-white pb-20 lg:pb-0 lg:pl-72">
            <Sidebar />
            <main className="min-h-screen">
                {children}
            </main>
            <MobileNav />
        </div>
    );
}

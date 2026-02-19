"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";
import { SessionGuardProvider } from "@/presentation/components/session/SessionGuardProvider";

export function AppLayout({ children, user }: { children: React.ReactNode; user: any }) {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <SessionGuardProvider>
            <div className="min-h-screen bg-bg-primary">
                {/* Desktop Sidebar */}
                <Sidebar isOpen={isSidebarOpen} />

                {/* Main Content Area */}
                <div className={cn("transition-all duration-300 ease-in-out", isSidebarOpen ? "lg:pl-64" : "lg:pl-0")}>
                    {/* Topbar (visible on all breakpoints) */}
                    <Topbar
                        user={user}
                        isSidebarOpen={isSidebarOpen}
                        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        onMenuClick={() => setMobileDrawerOpen(true)}
                    />

                    {/* Page Content */}
                    <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-64px)]">
                        {children}
                    </main>
                </div>

                {/* Mobile Drawer (hidden on desktop) */}
                <MobileDrawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen} />
            </div>
        </SessionGuardProvider>
    );
}


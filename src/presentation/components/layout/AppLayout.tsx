"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { Topbar } from "./Topbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="lg:pl-64">
                {/* Topbar (visible on all breakpoints) */}
                <Topbar onMenuClick={() => setMobileDrawerOpen(true)} />

                {/* Page Content */}
                <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>

            {/* Mobile Drawer (hidden on desktop) */}
            <MobileDrawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen} />
        </div>
    );
}

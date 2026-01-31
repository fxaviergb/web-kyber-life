"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { LogoutButton } from "@/presentation/components/auth/logout-button";
import { useState, useEffect } from "react";
import { MENU_ITEMS, MenuItem } from "@/config/menu-items";

export function Sidebar({ isOpen = true }: { isOpen?: boolean }) {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch for Radix UI components by delaying render until client-side mount
    // or by accepting a small layout shift, but for Sidebar fixed position, it's better to render consistent structure
    // and only hydrate interactions? No, easiest fix is useEffect.
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <aside className={cn(
                "hidden lg:flex flex-col h-screen bg-bg-primary fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-[20px_0_40px_-10px_rgba(0,0,0,0.03)] rounded-r-[2.5rem]",
                isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full opacity-0"
            )}>
                {/* Simplified loading/placeholder state to match server HTML structure implicitly or just return empty if acceptable */}
                {/* To avoid layout shift, better to render the same container but empty content or static content */}
            </aside>
        )
    }

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const renderMenuItem = (item: MenuItem, level = 0) => {
        // Section Header
        if (item.isSection) {
            return (
                <div key={item.label} className="mb-2 mt-4 px-2">
                    <h3 className="px-4 type-label font-bold text-text-tertiary/70 uppercase tracking-widest text-[10px] whitespace-nowrap">
                        {item.label}
                    </h3>
                    <div className="space-y-0.5 mt-2">
                        {item.items?.map(subItem => renderMenuItem(subItem, level))}
                    </div>
                </div>
            );
        }

        // Parent Item (Collapsible)
        if (item.items && item.items.length > 0) {
            const isOpen = openMenus[item.label] || item.items.some(sub => pathname.startsWith(sub.href || ""));

            return (
                <div key={item.label} className="space-y-0.5">
                    <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                            "w-[calc(100%-16px)] flex items-center justify-between px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 group type-body whitespace-nowrap",
                            "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
                            level > 0 && "pl-8" // Indent nested items
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {item.icon && <item.icon className="w-4 h-4 shrink-0 transition-colors" />}
                            <span className="font-medium">{item.label}</span>
                        </div>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                    </button>

                    {isOpen && (
                        <div className="space-y-0.5 overflow-hidden transition-all duration-300">
                            {item.items.map(subItem => renderMenuItem(subItem, level + 1))}
                        </div>
                    )}
                </div>
            );
        }

        // Leaf Link
        const isActive = item.href ? pathname.startsWith(item.href) : false;

        return (
            <Link
                key={item.href || item.label}
                href={item.href || "#"}
                className={cn(
                    "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 group type-body whitespace-nowrap",
                    isActive
                        ? "bg-accent-primary/10 text-accent-primary font-semibold shadow-sm"
                        : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary font-medium",
                    level > 0 && "pl-8", // Level 1 indent
                    level > 1 && "pl-12" // Level 2 indent
                )}
            >
                {item.icon && <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive && "text-accent-primary")} />}
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <aside className={cn(
            "hidden lg:flex flex-col h-screen bg-bg-primary fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-[20px_0_40px_-10px_rgba(0,0,0,0.03)] rounded-r-[2.5rem]",
            isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full opacity-0"
        )}>
            {/* Brand */}
            <div className="h-24 flex items-center px-6 bg-transparent">
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/20 group-hover:scale-110 transition-all duration-300 ease-out">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight text-text-primary group-hover:text-accent-violet transition-colors">
                            KYBER<span className="font-light text-text-tertiary">LIFE</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                {MENU_ITEMS.map((item) => renderMenuItem(item))}
            </nav>

            {/* CTA / Profile */}
            <div className="p-4">
                <LogoutButton
                    variant="outline"
                    className="w-full justify-center border-border/40 text-text-tertiary hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all font-medium"
                />
            </div>
        </aside>
    );
}

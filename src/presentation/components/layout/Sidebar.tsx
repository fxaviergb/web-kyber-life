"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ShoppingCart, FileText, BarChart2, Settings, Store, Package, Tag, Scale, User, ChevronDown, ChevronRight, ShoppingBasket } from "lucide-react";
import { LogoutButton } from "@/presentation/components/auth/logout-button";
import { useState } from "react";
import { LucideIcon } from "lucide-react";

type MenuItem = {
    label: string;
    icon?: LucideIcon;
    href?: string;
    items?: MenuItem[];
    isSection?: boolean; // If true, it's a section header, not a link or dropdown
};

const MENU_ITEMS: MenuItem[] = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    {
        label: "Market",
        isSection: true,
        items: [
            { label: "Compras", icon: ShoppingCart, href: "/market/purchases" },
            { label: "Plantillas", icon: FileText, href: "/market/templates" },
            { label: "Productos", icon: Package, href: "/market/items" },
            {
                label: "Configuración",
                icon: Settings,
                items: [
                    { label: "Supermercados", icon: Store, href: "/market/supermarkets" },
                    { label: "Categorías", icon: Tag, href: "/market/categories" },
                    { label: "Unidades", icon: Scale, href: "/market/units" },
                ]
            },
            { label: "Analítica", icon: BarChart2, href: "/market/analytics" },
        ]
    },
    {
        label: "Cuenta",
        isSection: true,
        items: [
            { label: "Perfil", icon: User, href: "/profile" },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const renderMenuItem = (item: MenuItem, level = 0) => {
        // Section Header
        if (item.isSection) {
            return (
                <div key={item.label} className="mb-2">
                    <h3 className="px-4 text-xs font-semibold text-text-3 uppercase tracking-wider mb-2 mt-4 ml-2">
                        {item.label}
                    </h3>
                    <div className="space-y-1">
                        {item.items?.map(subItem => renderMenuItem(subItem, level))}
                    </div>
                </div>
            );
        }

        // Parent Item (Collapsible)
        if (item.items && item.items.length > 0) {
            const isOpen = openMenus[item.label] || item.items.some(sub => pathname.startsWith(sub.href || ""));
            // Auto-open if path matches children
            // Actually, manual toggle state should override? 
            // Let's rely on state, initialized or derived. 
            // Simple approach: controlled by state, initialize based on path?
            // For now, simple state toggle.

            // Wait, logic above `isOpen` forces it open if path matches. That's good behavior.

            return (
                <div key={item.label} className="space-y-1">
                    <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 group text-sm",
                            "text-sidebar-foreground/70 hover:bg-glass hover:text-sidebar-foreground",
                            level > 0 && "pl-8" // Indent nested items
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {item.icon && <item.icon className="w-4 h-4 text-sidebar-foreground/50 group-hover:text-sidebar-foreground" />}
                            <span>{item.label}</span>
                        </div>
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>

                    {isOpen && (
                        <div className="space-y-1 overflow-hidden transition-all duration-300">
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
                    "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group text-sm",
                    isActive
                        ? "bg-sidebar-accent text-accent-violet font-medium shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-glass hover:text-sidebar-foreground",
                    level > 0 && "pl-8", // Level 1 indent
                    level > 1 && "pl-12" // Level 2 indent
                )}
            >
                {item.icon && <item.icon className={cn("w-4 h-4", isActive ? "text-accent-violet" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />}
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <aside className="hidden lg:flex flex-col w-72 h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
            {/* Brand */}
            <div className="p-6 border-b border-sidebar-border">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-coral via-accent-magenta to-accent-violet bg-clip-text text-transparent">
                    KYBER LIFE
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                {MENU_ITEMS.map((item) => renderMenuItem(item))}
            </nav>

            {/* CTA / Profile */}
            <div className="p-6 border-t border-sidebar-border">
                <div className="p-4 rounded-xl bg-glass border border-white/5 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-violet/20 flex items-center justify-center text-accent-violet font-bold text-xs">U</div>
                        <div className="text-sm">
                            <p className="font-medium text-white">Usuario</p>
                            <p className="text-xs text-white/50">Free Plan</p>
                        </div>
                    </div>
                    <LogoutButton variant="destructive" className="w-full justify-start h-8 text-xs" />
                </div>
            </div>
        </aside>
    );
}

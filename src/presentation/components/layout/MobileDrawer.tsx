"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    ShoppingCart,
    FileText,
    BarChart2,
    Settings,
    Store,
    Package,
    Tag,
    Scale,
    User,
    X,
    ChevronDown,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/presentation/components/auth/logout-button";
import { LucideIcon } from "lucide-react";

type MenuItem = {
    label: string;
    icon?: LucideIcon;
    href?: string;
    items?: MenuItem[];
    isSection?: boolean;
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

interface MobileDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const renderMenuItem = (item: MenuItem, level = 0): React.ReactElement | null => {
        // Section Header
        if (item.isSection) {
            return (
                <div key={item.label} className="mb-2">
                    <h3 className="px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 mt-4">
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

            return (
                <div key={item.label} className="space-y-1">
                    <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-200 group text-sm",
                            "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                            level > 0 && "pl-8"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.label}</span>
                        </div>
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>

                    {isOpen && (
                        <div className="space-y-1">
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
                onClick={() => onOpenChange(false)}
                className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group text-sm",
                    isActive
                        ? "bg-accent-primary/10 text-accent-primary font-medium"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                    level > 0 && "pl-8",
                    level > 1 && "pl-12"
                )}
            >
                {item.icon && <item.icon className={cn("w-4 h-4", isActive && "text-accent-primary")} />}
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-72 p-0 bg-bg-primary rounded-r-[2.5rem] border-r-0 shadow-2xl">
                <SheetHeader className="h-24 flex flex-row items-center px-6 bg-transparent space-y-0">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/20">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                            <SheetTitle className="text-2xl font-bold tracking-tight text-text-primary">
                                KYBER<span className="font-light text-text-tertiary">LIFE</span>
                            </SheetTitle>
                        </div>
                    </div>
                </SheetHeader>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-white/10">
                    {MENU_ITEMS.map((item) => renderMenuItem(item))}
                </nav>

                {/* User Profile / Logout */}
                <div className="p-4 bg-transparent">
                    <LogoutButton
                        variant="outline"
                        className="w-full justify-center border-border/40 text-text-tertiary hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all font-medium"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}

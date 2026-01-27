"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ShoppingCart, FileText, BarChart2, Settings, Tag, Scale, User } from "lucide-react";

const MOBILE_ITEMS = [
    { label: "Dash", icon: Home, href: "/dashboard" },
    { label: "Compras", icon: ShoppingCart, href: "/market/purchases" },
    { label: "Plantillas", icon: FileText, href: "/market/templates" },
    { label: "Cats", icon: Tag, href: "/market/categories" }, // Short label
    { label: "Unit", icon: Scale, href: "/market/units" },
    { label: "Analítica", icon: BarChart2, href: "/market/analytics" },
    { label: "Perfil", icon: User, href: "/profile" },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-1 border-t border-white/10 lg:hidden pb-safe">
            <div className="flex justify-around items-center h-16">
                {MOBILE_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-accent-violet" : "text-text-3"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-0 w-8 h-1 bg-accent-violet rounded-t-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

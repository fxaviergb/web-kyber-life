"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ListFilter, TrendingDown, TrendingUp, ArrowRightLeft } from "lucide-react";
import { ReactNode } from "react";

const TABS = [
    { value: "ALL", label: "Todos", icon: ListFilter },
    { value: "EXPENSE", label: "Gastos", icon: TrendingDown },
    { value: "INCOME", label: "Ingresos", icon: TrendingUp },
    { value: "TRANSFER", label: "Transferencias", icon: ArrowRightLeft }
];

export function TransactionTabs({ children }: { children?: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentType = searchParams.get("type") || "ALL";

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "ALL") {
            params.delete("type");
        } else {
            params.set("type", value);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="w-full pb-2">
            <Tabs value={currentType} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl mb-6">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger 
                                key={tab.value} 
                                value={tab.value}
                                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2 transition-all"
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline font-medium">{tab.label}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {children && TABS.map(tab => (
                    <TabsContent key={tab.value} value={tab.value} className="mt-0 outline-none">
                        {children}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

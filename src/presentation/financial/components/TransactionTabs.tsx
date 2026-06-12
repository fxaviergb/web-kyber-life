"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ListFilter, TrendingDown, TrendingUp, ArrowRightLeft, Wallet } from "lucide-react";
import { ReactNode } from "react";

const TABS = [
    { value: "ALL", label: "Todos", icon: ListFilter },
    { value: "EXPENSE", label: "Gastos", icon: TrendingDown },
    { value: "INCOME", label: "Ingresos", icon: TrendingUp },
    { value: "TRANSFER", label: "Transferencias", icon: ArrowRightLeft },
    { value: "WITHDRAWAL", label: "Retiros", icon: Wallet }
];

export function TransactionTabs({ children }: { children?: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const typeParam = searchParams.get("type");
    const currentTypes = typeParam ? typeParam.split(',') : [];
    const isAll = currentTypes.length === 0;

    const handleToggle = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (value === "ALL") {
            params.delete("type");
        } else {
            let newTypes = [...currentTypes];
            if (newTypes.includes(value)) {
                newTypes = newTypes.filter(t => t !== value);
            } else {
                newTypes.push(value);
            }
            
            if (newTypes.length === 0) {
                params.delete("type");
            } else {
                params.set("type", newTypes.join(','));
            }
        }
        
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="w-full pb-2">
            <div className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-xl mb-6 items-center justify-center text-muted-foreground">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = tab.value === "ALL" ? isAll : currentTypes.includes(tab.value);
                    
                    return (
                        <button 
                            key={tab.value} 
                            onClick={() => handleToggle(tab.value)}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2 transition-all text-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive ? 'bg-background shadow-sm text-foreground' : 'hover:text-foreground'}`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {children && (
                <div className="mt-0 outline-none">
                    {children}
                </div>
            )}
        </div>
    );
}

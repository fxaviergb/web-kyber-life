"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type FilterType = "all" | "today" | "week" | "month" | "custom";

export function MarketDateFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [customStartDate, setCustomStartDate] = useState<string>("");
    const [customEndDate, setCustomEndDate] = useState<string>("");

    // Initialize from URL
    useEffect(() => {
        const type = searchParams.get("filter") as FilterType;
        if (type && ["all", "today", "week", "month", "custom"].includes(type)) {
            setFilterType(type);
        } else {
            setFilterType("all");
        }

        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");
        
        if (start) setCustomStartDate(start);
        if (end) setCustomEndDate(end);
    }, [searchParams]);

    const updateFilter = (type: FilterType, start?: string, end?: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("filter", type);
        
        if (type === "custom") {
            if (start) params.set("startDate", start);
            if (end) params.set("endDate", end);
        } else {
            params.delete("startDate");
            params.delete("endDate");
        }

        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleTypeChange = (type: FilterType) => {
        setFilterType(type);
        
        if (type !== "custom") {
            updateFilter(type);
        } else {
            // For custom, if we already have dates, use them, otherwise initialize to current month
            if (!customStartDate || !customEndDate) {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                setCustomStartDate(start);
                setCustomEndDate(end);
                updateFilter("custom", start, end);
            } else {
                updateFilter("custom", customStartDate, customEndDate);
            }
        }
    };

    const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setCustomStartDate(value);
            updateFilter("custom", value, customEndDate);
        } else {
            setCustomEndDate(value);
            updateFilter("custom", customStartDate, value);
        }
    };

    return (
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 flex-1 w-full mb-6">
            {/* Mobile Filter (Select) */}
            <div className="w-full sm:hidden">
                <Select value={filterType} onValueChange={(v: FilterType) => handleTypeChange(v)}>
                    <SelectTrigger className="w-full bg-bg-2 border-border/40 rounded-xl h-10 font-medium">
                        <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todo el tiempo</SelectItem>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mes</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop Filter (Tabs) */}
            <div className="hidden sm:flex items-center p-1 bg-bg-2 border border-border/40 rounded-xl w-full">
                {(
                    [
                        { id: 'all', label: 'Todo el tiempo' },
                        { id: 'today', label: 'Hoy' },
                        { id: 'week', label: 'Semana' },
                        { id: 'month', label: 'Mes' },
                        { id: 'custom', label: 'Personalizado' }
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTypeChange(tab.id as FilterType)}
                        className={`
                            flex-1 relative px-4 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                            ${filterType === tab.id
                                ? 'text-foreground bg-bg-3 shadow-sm ring-1 ring-border/50'
                                : 'text-muted-foreground hover:text-foreground hover:bg-bg-3/50'}
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filterType === "custom" && (
                <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 w-full bg-bg-2 p-1 rounded-xl border border-border/40">
                        <Input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => handleCustomDateChange('start', e.target.value)}
                            className="h-8 text-xs bg-bg-1 border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0"
                        />
                        <span className="text-muted-foreground/50 text-xs font-medium">a</span>
                        <Input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => handleCustomDateChange('end', e.target.value)}
                            className="h-8 text-xs bg-bg-1 border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

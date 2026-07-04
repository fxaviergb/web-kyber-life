"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RangeFilterType } from "@/lib/date-range";

export interface DateRangePreset {
    id: RangeFilterType;
    label: string;
}

export const DEFAULT_PRESETS: DateRangePreset[] = [
    { id: "all", label: "Todo el tiempo" },
    { id: "today", label: "Hoy" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mes" },
    { id: "custom", label: "Personalizado" },
];

/** Presets for the main dashboard hub. */
export const HUB_PRESETS: DateRangePreset[] = [
    { id: "all", label: "Todos" },
    { id: "today", label: "Hoy" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mes" },
    { id: "custom", label: "Personalizado" },
];

interface DateRangeFilterProps {
    value: RangeFilterType;
    onChange: (value: RangeFilterType) => void;
    customStart: string;
    customEnd: string;
    onCustomStartChange: (value: string) => void;
    onCustomEndChange: (value: string) => void;
    presets?: DateRangePreset[];
    className?: string;
}

/**
 * Controlled date-range filter shared between the financial dashboard and the
 * main dashboard hub: a Select on mobile, a segmented tab bar on desktop, and
 * inline date inputs when "Personalizado" is selected.
 */
export function DateRangeFilter({
    value,
    onChange,
    customStart,
    customEnd,
    onCustomStartChange,
    onCustomEndChange,
    presets = DEFAULT_PRESETS,
    className,
}: DateRangeFilterProps) {
    return (
        <div className={cn("flex flex-col w-full", className)}>
            {/* Mobile: Select + Date Inputs if custom */}
            <div className="flex flex-col gap-2 w-full sm:hidden h-10">
                {value !== "custom" ? (
                    <Select value={value} onValueChange={(v) => onChange(v as RangeFilterType)}>
                        <SelectTrigger className="w-full bg-muted/40 border-border/40 rounded-xl h-10 font-medium">
                            <SelectValue placeholder="Seleccionar período" />
                        </SelectTrigger>
                        <SelectContent>
                            {presets.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="flex items-center gap-1 w-full h-10 animate-in fade-in slide-in-from-top-1 bg-muted/20 p-1 rounded-xl border border-border/40">
                        <button
                            onClick={() => onChange("all")}
                            className="flex items-center justify-center h-full px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors shrink-0"
                            title="Volver a los filtros predefinidos"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <Input
                            type="date"
                            value={customStart}
                            onChange={(e) => onCustomStartChange(e.target.value)}
                            className="h-full px-1 text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0 flex-1"
                        />
                        <span className="text-muted-foreground/50 text-[10px] font-medium shrink-0">a</span>
                        <Input
                            type="date"
                            value={customEnd}
                            onChange={(e) => onCustomEndChange(e.target.value)}
                            className="h-full px-1 text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0 flex-1"
                        />
                    </div>
                )}
            </div>

            {/* Desktop: segmented tabs OR custom date range in the same container */}
            <div className="hidden sm:flex items-center p-1 bg-muted/40 border border-border/40 rounded-xl w-full h-[42px]">
                {value !== "custom" ? (
                    presets.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => onChange(p.id)}
                            className={cn(
                                "flex-1 relative px-4 h-full text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap",
                                value === p.id
                                    ? "text-foreground bg-background shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            )}
                        >
                            {p.label}
                        </button>
                    ))
                ) : (
                    <div className="flex items-center gap-2 w-full h-full animate-in fade-in">
                        <button
                            onClick={() => onChange("all")}
                            className="flex items-center justify-center h-full px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors shrink-0"
                            title="Volver a los filtros predefinidos"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <Input
                            type="date"
                            value={customStart}
                            onChange={(e) => onCustomStartChange(e.target.value)}
                            className="h-full text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0 flex-1"
                        />
                        <span className="text-muted-foreground/50 text-xs font-medium shrink-0">a</span>
                        <Input
                            type="date"
                            value={customEnd}
                            onChange={(e) => onCustomEndChange(e.target.value)}
                            className="h-full text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0 flex-1"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

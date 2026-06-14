"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
        <div className={cn("flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full", className)}>
            {/* Mobile: Select */}
            <div className="w-full sm:hidden">
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
            </div>

            {/* Desktop: segmented tabs */}
            <div className="hidden sm:flex items-center p-1 bg-muted/40 border border-border/40 rounded-xl w-full">
                {presets.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onChange(p.id)}
                        className={cn(
                            "flex-1 relative px-4 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap",
                            value === p.id
                                ? "text-foreground bg-background shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {value === "custom" && (
                <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 w-full bg-muted/20 p-1 rounded-xl border border-border/40">
                        <Input
                            type="date"
                            value={customStart}
                            onChange={(e) => onCustomStartChange(e.target.value)}
                            className="h-8 text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0"
                        />
                        <span className="text-muted-foreground/50 text-xs font-medium">a</span>
                        <Input
                            type="date"
                            value={customEnd}
                            onChange={(e) => onCustomEndChange(e.target.value)}
                            className="h-8 text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

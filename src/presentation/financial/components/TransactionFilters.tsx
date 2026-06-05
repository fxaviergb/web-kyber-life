"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, CalendarDays, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Date Preset Helpers ─────────────────────────────────────

type DatePreset = "today" | "week" | "month" | "custom";

const PRESET_LABELS: Record<DatePreset, string> = {
    today: "Hoy",
    week: "Esta semana",
    month: "Este mes",
    custom: "Personalizado",
};

function getPresetRange(preset: Exclude<DatePreset, "custom">): { from: string; to: string } {
    const now = new Date();
    const toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const toStr = toDate.toISOString();

    switch (preset) {
        case "today": {
            const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            return { from: from.toISOString(), to: toStr };
        }
        case "week": {
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset, 0, 0, 0);
            return { from: from.toISOString(), to: toStr };
        }
        case "month": {
            const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            return { from: from.toISOString(), to: toStr };
        }
    }
}

/** Format an ISO string to a short locale date label (e.g. "26 may 2026") */
function formatShortDate(iso: string): string {
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(iso));
}

/** Convert an ISO string to a local YYYY-MM-DD for <input type="date"> */
function toLocalDateValue(iso: string): string {
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ─── Component ───────────────────────────────────────────────

export function TransactionFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // ── Text search ──────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
    const initialStatus = searchParams.getAll("status");
    const [statusFilter, setStatusFilter] = useState<string[]>(initialStatus);

    // ── Date filter ──────────────────────────────────────────
    const urlDateFrom = searchParams.get("dateFrom") || "";
    const urlDateTo = searchParams.get("dateTo") || "";
    const [dateFrom, setDateFrom] = useState(urlDateFrom);
    const [dateTo, setDateTo] = useState(urlDateTo);
    const [activePreset, setActivePreset] = useState<DatePreset | null>(null);
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);

    // ── Custom date inputs (local YYYY-MM-DD) ────────────────
    const [customFrom, setCustomFrom] = useState(urlDateFrom ? toLocalDateValue(urlDateFrom) : "");
    const [customTo, setCustomTo] = useState(urlDateTo ? toLocalDateValue(urlDateTo) : "");

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentQuery = searchParams.get("query") || "";
            if (searchQuery !== currentQuery) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchQuery) {
                    params.set("query", searchQuery);
                } else {
                    params.delete("query");
                }
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, pathname, router, searchParams]);

    const handleStatusChange = useCallback((status: string, checked: boolean) => {
        const newStatusFilter = checked
            ? [...statusFilter, status]
            : statusFilter.filter(s => s !== status);

        setStatusFilter(newStatusFilter);

        const params = new URLSearchParams(searchParams.toString());
        params.delete("status");
        newStatusFilter.forEach(s => params.append("status", s));

        router.push(`${pathname}?${params.toString()}`);
    }, [statusFilter, pathname, router, searchParams]);

    // ── Date Filter Actions ──────────────────────────────────

    const applyDateFilter = useCallback((from: string, to: string) => {
        setDateFrom(from);
        setDateTo(to);
        const params = new URLSearchParams(searchParams.toString());
        if (from) {
            params.set("dateFrom", from);
        } else {
            params.delete("dateFrom");
        }
        if (to) {
            params.set("dateTo", to);
        } else {
            params.delete("dateTo");
        }
        router.push(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    const handlePresetClick = (preset: Exclude<DatePreset, "custom">) => {
        setActivePreset(preset);
        const { from, to } = getPresetRange(preset);
        applyDateFilter(from, to);
        setDatePopoverOpen(false);
    };

    const handleCustomApply = () => {
        if (!customFrom || !customTo) return;
        const from = new Date(`${customFrom}T00:00:00`).toISOString();
        const to = new Date(`${customTo}T23:59:59`).toISOString();
        setActivePreset("custom");
        applyDateFilter(from, to);
        setDatePopoverOpen(false);
    };

    const clearDateFilter = () => {
        setDateFrom("");
        setDateTo("");
        setActivePreset(null);
        setCustomFrom("");
        setCustomTo("");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("dateFrom");
        params.delete("dateTo");
        router.push(`${pathname}?${params.toString()}`);
    };

    // ── Global clear ─────────────────────────────────────────

    const hasAnyFilter = statusFilter.length > 0
        || searchParams.has("query")
        || searchParams.has("currency")
        || searchParams.has("dateFrom")
        || searchParams.has("dateTo");

    const clearAllFilters = () => {
        setStatusFilter([]);
        setSearchQuery("");
        clearDateFilter();
        const params = new URLSearchParams(searchParams.toString());
        params.delete("status");
        params.delete("query");
        params.delete("currency");
        params.delete("dateFrom");
        params.delete("dateTo");
        router.push(`${pathname}?${params.toString()}`);
    };

    // ── Build label for date button ──────────────────────────

    const getDateButtonLabel = (): string => {
        if (!dateFrom && !dateTo) return "Fecha";
        if (activePreset && activePreset !== "custom") return PRESET_LABELS[activePreset];
        if (dateFrom && dateTo) return `${formatShortDate(dateFrom)} – ${formatShortDate(dateTo)}`;
        return "Fecha";
    };

    const hasDateFilter = Boolean(dateFrom || dateTo);

    return (
        <div className="flex flex-col gap-3 w-full mb-4">
            {/* ── Row 1: Search + Actions ───────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 w-full items-center bg-background/40 backdrop-blur-md border border-white/5 p-2 rounded-2xl shadow-sm">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                        placeholder="Buscar transacciones, instituciones o categorías..."
                        className="pl-9 bg-transparent border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none hover:bg-white/5 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="h-6 w-px bg-white/10 hidden sm:block shrink-0" />

                <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto shrink-0 pl-0 sm:pl-1 mt-2 sm:mt-0">
                    {/* Status Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full sm:w-auto gap-2 hover:bg-white/5 justify-start sm:justify-center">
                                <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground truncate">Filtros</span>
                                {statusFilter.length > 0 && (
                                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/20 text-[10px] font-medium text-accent-primary">
                                        {statusFilter.length}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {['DETECTED', 'REVIEWED', 'CONFIRMED', 'REJECTED', 'DUPLICATE', 'MANUAL', 'ARCHIVED'].map(status => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={statusFilter.includes(status)}
                                    onCheckedChange={(checked) => handleStatusChange(status, checked)}
                                >
                                    {status}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Date Range Filter */}
                    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full sm:w-auto gap-2 hover:bg-white/5 justify-start sm:justify-center",
                                    hasDateFilter ? "text-accent-primary" : "text-muted-foreground",
                                )}
                            >
                                <CalendarDays className={cn("h-4 w-4 shrink-0", hasDateFilter ? "text-accent-primary" : "text-muted-foreground")} />
                                <span className="truncate max-w-[120px] sm:max-w-[160px]">{getDateButtonLabel()}</span>
                                {hasDateFilter && (
                                    <button
                                        type="button"
                                        className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-accent-primary/20 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearDateFilter();
                                        }}
                                        aria-label="Limpiar filtro de fecha"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 p-0">
                            {/* Presets */}
                            <div className="p-3 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                    Rango rápido
                                </p>
                                {(["today", "week", "month"] as const).map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                            activePreset === preset
                                                ? "bg-accent-primary/10 text-accent-primary font-medium"
                                                : "hover:bg-muted/50 text-foreground",
                                        )}
                                        onClick={() => handlePresetClick(preset)}
                                    >
                                        {PRESET_LABELS[preset]}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-border/50" />

                            {/* Custom range */}
                            <div className="p-3 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Personalizado
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label htmlFor="date-filter-from" className="text-[11px] font-medium text-muted-foreground">
                                            Desde
                                        </label>
                                        <Input
                                            id="date-filter-from"
                                            type="date"
                                            value={customFrom}
                                            onChange={(e) => {
                                                setCustomFrom(e.target.value);
                                                setActivePreset("custom");
                                            }}
                                            className="h-9 text-sm bg-bg-primary"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="date-filter-to" className="text-[11px] font-medium text-muted-foreground">
                                            Hasta
                                        </label>
                                        <Input
                                            id="date-filter-to"
                                            type="date"
                                            value={customTo}
                                            onChange={(e) => {
                                                setCustomTo(e.target.value);
                                                setActivePreset("custom");
                                            }}
                                            className="h-9 text-sm bg-bg-primary"
                                        />
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full rounded-lg"
                                    disabled={!customFrom || !customTo}
                                    onClick={handleCustomApply}
                                >
                                    Aplicar rango
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {hasAnyFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="col-span-2 sm:col-span-1 text-xs text-muted-foreground hover:text-foreground w-full sm:w-auto mt-1 sm:mt-0"
                            onClick={clearAllFilters}
                        >
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

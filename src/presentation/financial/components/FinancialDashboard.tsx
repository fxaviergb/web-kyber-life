"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedTrendChart } from "./UnifiedTrendChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { InstitutionBarChart } from "./InstitutionBarChart";
import { useFinancialDashboardOffline } from "../hooks/useFinancialDashboardOffline";
import { useFinancialRealtime } from "../hooks/useFinancialRealtime";
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, WifiOff, RefreshCw, ArrowRightLeft, Wallet, CreditCard, Filter, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { RobotLoader } from "@/components/ui/RobotLoader";
import { defaultHubCustomRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { CreditToggle } from "./CreditToggle";
import { StatTile } from "@/presentation/components/dashboard/stat-tile";
import { KpiBreakdownModal } from "./KpiBreakdownModal";
import { buildKpiModalConfig, type KpiModalKind } from "../lib/kpi-modal-config";
import {
    excludeCreditFromKpis,
    excludeCreditFromCategoryBreakdown,
    excludeCreditFromInstitutionBreakdown,
    excludeCreditFromDailyBreakdown,
} from "../lib/credit-toggle";
function formatCurrency(value: number): string {
    return `$${Math.abs(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PERIOD_LABELS = {
    all: "Todo el tiempo",
    today: "Hoy",
    week: "Semana",
    month: "Mes",
    custom: "Personalizado",
} as const;

export function FinancialDashboard() {
    const [filterType, setFilterType] = useState<"all" | "today" | "week" | "month" | "custom">("custom");
    const [customStartDate, setCustomStartDate] = useState<string>(() => defaultHubCustomRange().start);
    const [customEndDate, setCustomEndDate] = useState<string>(() => defaultHubCustomRange().end);
    const [categoryLimit, setCategoryLimit] = useState<number>(5);
    const [institutionLimit, setInstitutionLimit] = useState<number>(5);
    // Off by default: amounts and charts show only real (cash) spending until
    // the user opts into seeing credit-card-paid transactions too.
    const [showCredit, setShowCredit] = useState(false);
    // Mobile-only: filters collapsed by default (accordion), matching the
    // transactions list screen's "Filtros de Búsqueda" pattern.
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    // Tapping a Balance/Ingresos/Gastos tile opens a modal breaking down the
    // values behind that number.
    const [openKpiModal, setOpenKpiModal] = useState<KpiModalKind | null>(null);

    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        if (filterType === "all") return { startDate: undefined, endDate: undefined };

        if (filterType === "today") {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            return { startDate: d.toISOString(), endDate: end.toISOString() };
        }

        if (filterType === "week") {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // start of week (Monday)
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            return { startDate: start.toISOString(), endDate: end.toISOString() };
        }

        if (filterType === "month") {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            return { startDate: start.toISOString(), endDate: end.toISOString() };
        }

        if (filterType === "custom") {
            return {
                startDate: customStartDate ? new Date(customStartDate + "T00:00:00").toISOString() : undefined,
                endDate: customEndDate ? new Date(customEndDate + "T23:59:59").toISOString() : undefined
            };
        }

        return {};
    }, [filterType, customStartDate, customEndDate]);

    const { kpis: rawKpis, monthly, typeBreakdown, categoryBreakdown: rawCategoryBreakdown, institutionBreakdown: rawInstitutionBreakdown, dailyBreakdown: rawDailyBreakdown, recent, loading, isStale, error, refresh } =
        useFinancialDashboardOffline(startDate, endDate);

    const kpis = useMemo(() => (rawKpis && !showCredit ? excludeCreditFromKpis(rawKpis) : rawKpis), [rawKpis, showCredit]);
    const categoryBreakdown = useMemo(
        () => (showCredit ? rawCategoryBreakdown : excludeCreditFromCategoryBreakdown(rawCategoryBreakdown)),
        [rawCategoryBreakdown, showCredit],
    );
    const institutionBreakdown = useMemo(
        () => (showCredit ? rawInstitutionBreakdown : excludeCreditFromInstitutionBreakdown(rawInstitutionBreakdown)),
        [rawInstitutionBreakdown, showCredit],
    );
    const dailyBreakdown = useMemo(
        () => (showCredit ? rawDailyBreakdown : excludeCreditFromDailyBreakdown(rawDailyBreakdown)),
        [rawDailyBreakdown, showCredit],
    );

    // Always shows the full detail (real + credit), regardless of the toggle.
    const kpiModalConfig = useMemo(
        () => (openKpiModal && rawKpis ? buildKpiModalConfig(openKpiModal, rawKpis) : null),
        [openKpiModal, rawKpis],
    );

    const totalCategoryExpenses = useMemo(() => {
        if (!categoryBreakdown) return 0;
        return categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
    }, [categoryBreakdown]);

    const displayedCategoryBreakdown = useMemo(() => {
        if (!categoryBreakdown) return [];
        const filtered = categoryBreakdown.filter(c => c.categoryName && c.categoryName.toLowerCase() !== "sin categoría");
        return filtered.slice(0, categoryLimit);
    }, [categoryBreakdown, categoryLimit]);

    const displayedInstitutionBreakdown = useMemo(() => {
        if (!institutionBreakdown) return [];
        const filtered = institutionBreakdown.filter(i =>
            i.institutionName && i.institutionName.toLowerCase() !== "unknown"
        );
        return filtered.slice(0, institutionLimit);
    }, [institutionBreakdown, institutionLimit]);

    // ── Realtime: auto-refresh dashboard when transactions change ──
    const subscriptions = useMemo(
        () => [
            { table: "financial_transactions", event: "*" as const },
        ],
        [],
    );

    const callbacks = useMemo(
        () => ({
            onChange: () => {
                refresh();
            },
        }),
        [refresh],
    );

    const { isPollingFallback } = useFinancialRealtime({
        channelName: "dashboard-realtime",
        subscriptions,
        callbacks,
        onPollFallback: refresh,
    });

    if (loading && !kpis) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <RobotLoader text="Cargando resumen" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Controls & Status */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4">
                <div className="flex flex-col gap-3 flex-1 w-full">
                    {/* Mobile Accordion Toggle */}
                    <div
                        className={cn(
                            "sm:hidden relative flex items-center justify-between py-3 px-4 rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] to-transparent shadow-lg shadow-black/5 dark:shadow-black/20 cursor-pointer transition-all active:scale-[0.98]",
                            filtersExpanded ? "bg-black/[0.02] dark:bg-white/[0.02] border-border dark:border-white/15" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                        )}
                        onClick={() => setFiltersExpanded((v) => !v)}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent rounded-t-[1.25rem]" aria-hidden="true" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-inner">
                                <Filter className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col justify-center gap-1.5">
                                <span className="text-lg font-bold tracking-tight leading-none text-foreground/90">
                                    Filtros de Búsqueda
                                </span>
                                <p className="text-[10px] text-muted-foreground font-medium leading-none uppercase tracking-wider">
                                    {`Filtros para: ${PERIOD_LABELS[filterType]}`}
                                </p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 border border-border/50 dark:border-white/10 shadow-sm">
                            <ChevronDown className={cn("w-4 h-4 text-foreground/70 transition-transform duration-300", filtersExpanded && "rotate-180")} />
                        </div>
                    </div>

                    {/* Filter content: collapsible on mobile, always visible on sm+ */}
                    <div className={cn(
                        "flex-col xl:flex-row items-start xl:items-center gap-4 w-full",
                        filtersExpanded ? "flex animate-in fade-in slide-in-from-top-4" : "hidden sm:flex",
                    )}>
                        {/* Mobile Filter (Select) */}
                        <div className="w-full sm:hidden">
                            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                                <SelectTrigger className="w-full bg-muted/40 border-border/40 rounded-xl h-10 font-medium">
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
                        <div className="hidden sm:flex items-center p-1 bg-muted/40 border border-border/40 rounded-xl w-full">
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
                                    onClick={() => setFilterType(tab.id as any)}
                                    className={`
                                        flex-1 relative px-4 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                                        ${filterType === tab.id
                                            ? 'text-foreground bg-background shadow-sm ring-1 ring-border/50'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                                    `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {filterType === "custom" && (
                            <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-2 w-full bg-muted/20 p-1 rounded-xl border border-border/40">
                                    <Input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="h-8 text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0"
                                    />
                                    <span className="text-muted-foreground/50 text-xs font-medium">a</span>
                                    <Input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="h-8 text-xs bg-background border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stale/offline indicator as Tooltip */}
                {isStale && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={error ? "outline" : "ghost"}
                                    size="sm"
                                    onClick={refresh}
                                    disabled={loading}
                                    className={`h-9 shrink-0 rounded-xl transition-all ${error
                                        ? "px-3 gap-2 border-yellow-500/30 bg-yellow-500/10 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/20 w-full sm:w-auto"
                                        : "w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                                        }`}
                                >
                                    {loading ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <WifiOff className="h-4 w-4" />
                                            {error && <span className="text-xs font-semibold sm:hidden">Sin conexión</span>}
                                        </>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="end" className="max-w-[260px] p-3 text-center border-border shadow-md">
                                <p className="text-sm font-medium mb-1">
                                    {error ? "Modo sin conexión" : "Sincronizando"}
                                </p>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {error ?? "Mostrando datos en caché. Actualizando en segundo plano..."}
                                </p>
                                {error && (
                                    <p className="text-[10px] font-medium text-primary">Haz clic para intentar sincronizar</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>



            {/* KPI Cards */}
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">Resumen financiero</h2>
                    <CreditToggle checked={showCredit} onChange={setShowCredit} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                    <div className="col-span-2 lg:col-span-1">
                        <StatTile
                            label="Balance"
                            value={`${(kpis?.netBalance ?? 0) >= 0 ? "+" : "-"}${formatCurrency(kpis?.netBalance ?? 0)}`}
                            icon={DollarSign}
                            accentClassName={(kpis?.netBalance ?? 0) >= 0 ? "text-emerald-500" : "text-accent-danger"}
                            negative={(kpis?.netBalance ?? 0) < 0}
                            onClick={rawKpis ? () => setOpenKpiModal("balance") : undefined}
                        />
                    </div>
                    <StatTile
                        label="Ingresos"
                        value={formatCurrency(kpis?.totalIncome ?? 0)}
                        icon={TrendingUp}
                        accentClassName="text-green-500"
                        onClick={rawKpis ? () => setOpenKpiModal("ingresos") : undefined}
                    />
                    <StatTile
                        label="Gastos"
                        value={formatCurrency(kpis?.totalExpenses ?? 0)}
                        icon={TrendingDown}
                        accentClassName="text-red-500"
                        onClick={rawKpis ? () => setOpenKpiModal("gastos") : undefined}
                    />
                    <StatTile
                        label="Transferencias"
                        value={formatCurrency(kpis?.totalTransfers ?? 0)}
                        icon={ArrowRightLeft}
                        accentClassName="text-orange-500"
                    />
                    <StatTile
                        label="Retiros"
                        value={formatCurrency(kpis?.totalWithdrawals ?? 0)}
                        icon={Wallet}
                        accentClassName="text-blue-500"
                    />
                </div>
            </div>

            {kpiModalConfig && (
                <KpiBreakdownModal
                    open={!!openKpiModal}
                    onOpenChange={(o) => !o && setOpenKpiModal(null)}
                    title={kpiModalConfig.title}
                    description={kpiModalConfig.description}
                    icon={kpiModalConfig.icon}
                    iconClassName={kpiModalConfig.iconClassName}
                    rows={kpiModalConfig.rows}
                    total={kpiModalConfig.total}
                    note={kpiModalConfig.note}
                />
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <UnifiedTrendChart data={dailyBreakdown} />
                </div>

                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between pb-2 gap-4">
                        <div>
                            <CardTitle>Por categoría de gasto</CardTitle>
                            <CardDescription>Distribución detallada de tus gastos</CardDescription>
                        </div>
                        <Select value={categoryLimit.toString()} onValueChange={(v) => setCategoryLimit(Number(v))}>
                            <SelectTrigger className="w-[90px] h-8 text-xs bg-muted/40 border-border/40 rounded-lg">
                                <SelectValue placeholder="Top" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">Top 5</SelectItem>
                                <SelectItem value="10">Top 10</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <CategoryPieChart data={displayedCategoryBreakdown} grandTotal={totalCategoryExpenses} />
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between pb-2 gap-4">
                        <div>
                            <CardTitle>Por institución</CardTitle>
                            <CardDescription>Volumen total movido por banco o institución</CardDescription>
                        </div>
                        <Select value={institutionLimit.toString()} onValueChange={(v) => setInstitutionLimit(Number(v))}>
                            <SelectTrigger className="w-[90px] h-8 text-xs bg-muted/40 border-border/40 rounded-lg">
                                <SelectValue placeholder="Top" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">Top 5</SelectItem>
                                <SelectItem value="10">Top 10</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <InstitutionBarChart data={displayedInstitutionBreakdown} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transacciones recientes</CardTitle>
                        <CardDescription>Tu actividad financiera más reciente</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/financial/transactions">
                            Ver todas
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recent.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Aún no hay transacciones. Comienza agregando una manualmente o escaneando tus correos.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recent.map(tx => {
                                let sign = "-";
                                let colorClass = "text-red-500";
                                let IconComponent = TrendingDown;
                                let bgClass = "bg-red-500/10 border-red-500/20 text-red-500";

                                if (tx.type === "INCOME" || tx.type === "DEPOSIT" || tx.type === "REFUND") {
                                    sign = "+";
                                    colorClass = "text-green-500";
                                    IconComponent = TrendingUp;
                                    bgClass = "bg-green-500/10 border-green-500/20 text-green-500";
                                } else if (tx.type === "TRANSFER") {
                                    sign = "";
                                    colorClass = "text-orange-500";
                                    IconComponent = ArrowRightLeft;
                                    bgClass = "bg-orange-500/10 border-orange-500/20 text-orange-500";
                                } else if (tx.type === "WITHDRAWAL") {
                                    sign = "-";
                                    colorClass = "text-blue-500";
                                    IconComponent = Wallet;
                                    bgClass = "bg-blue-500/10 border-blue-500/20 text-blue-500";
                                }

                                return (
                                    <Link
                                        key={tx.id}
                                        href={`/financial/transactions/${tx.id}`}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl hover:bg-muted/50 transition-all border border-border/50 group"
                                    >
                                        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${bgClass}`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                <span className="font-semibold text-sm sm:text-base leading-none group-hover:text-primary transition-colors truncate" title={tx.description || tx.institutionName || tx.merchant || tx.type}>
                                                    {tx.description || tx.institutionName || tx.merchant || tx.type}
                                                </span>
                                                <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                                                    {tx.institutionName && (
                                                        <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md font-medium text-foreground/80">
                                                            {tx.institutionName}
                                                        </span>
                                                    )}
                                                    {tx.categoryName && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border" style={{ borderColor: tx.categoryColor ? `${tx.categoryColor}40` : '', color: tx.categoryColor || '' }}>
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.categoryColor || 'currentColor' }} />
                                                            {tx.categoryName}
                                                        </span>
                                                    )}
                                                    {tx.paidWithCredit && (
                                                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium" title="Pagado con tarjeta de crédito — pendiente de reflejarse en el balance">
                                                            <CreditCard className="w-3 h-3" /> Tarjeta
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                                        {new Date(tx.date).toLocaleDateString("es-ES", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 sm:mt-0 flex items-center justify-start sm:justify-end w-full sm:w-auto pl-[3.25rem] sm:pl-0">
                                            <span className={`font-bold text-sm sm:text-base ${colorClass}`}>
                                                {sign}{formatCurrency(Number(tx.amount))}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

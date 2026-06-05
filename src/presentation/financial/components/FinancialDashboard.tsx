"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyChart } from "./MonthlyChart";
import { TypeBreakdownChart } from "./TypeBreakdownChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { InstitutionBarChart } from "./InstitutionBarChart";
import { DailySpendingChart } from "./DailySpendingChart";
import { DailyIncomeChart } from "./DailyIncomeChart";
import { useFinancialDashboardOffline } from "../hooks/useFinancialDashboardOffline";
import { useFinancialRealtime } from "../hooks/useFinancialRealtime";
import { DollarSign, TrendingUp, TrendingDown, Activity, ArrowRight, WifiOff, RefreshCw, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

function formatCurrency(value: number): string {
    return `$${Math.abs(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinancialDashboard() {
    const [filterType, setFilterType] = useState<"all" | "today" | "week" | "month" | "custom">("month");
    const [customStartDate, setCustomStartDate] = useState<string>("");
    const [customEndDate, setCustomEndDate] = useState<string>("");

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

    const { kpis, monthly, typeBreakdown, categoryBreakdown, institutionBreakdown, dailyBreakdown, recent, loading, isStale, error, refresh } =
        useFinancialDashboardOffline(startDate, endDate);

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
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="col-span-1 h-28 rounded-lg bg-muted animate-pulse" />
                    <div className="col-span-1 h-28 rounded-lg bg-muted animate-pulse" />
                    <div className="col-span-2 sm:col-span-1 h-28 rounded-lg bg-muted animate-pulse" />
                    <div className="col-span-1 h-28 rounded-lg bg-muted animate-pulse" />
                    <div className="col-span-1 h-28 rounded-lg bg-muted animate-pulse" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-96 rounded-lg bg-muted animate-pulse" />
                    <div className="h-96 rounded-lg bg-muted animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Controls & Status */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4">
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 flex-1 w-full">
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
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="snap-center shrink-0 w-[240px] sm:w-auto sm:col-span-1 flex flex-col items-stretch">
                    <StatCard
                        title="Ingresos"
                        value={formatCurrency(kpis?.totalIncome ?? 0)}
                        icon={TrendingUp}
                        iconClassName="text-green-500"
                        description="Ingresos confirmados"
                        tooltipText="Suma de todas las transacciones positivas (ingresos, depósitos y devoluciones) dentro del rango de fechas seleccionado."
                        className="flex-1"
                    />
                </div>
                <div className="snap-center shrink-0 w-[240px] sm:w-auto sm:col-span-1 flex flex-col items-stretch">
                    <StatCard
                        title="Gastos"
                        value={formatCurrency(kpis?.totalExpenses ?? 0)}
                        icon={TrendingDown}
                        iconClassName="text-red-500"
                        description="Gastos confirmados"
                        tooltipText="Suma de todas las transacciones negativas (pagos, compras, retiros y comisiones) dentro del rango de fechas seleccionado."
                        className="flex-1"
                    />
                </div>
                <div className="snap-center shrink-0 w-[240px] sm:w-auto sm:col-span-2 lg:col-span-1 flex flex-col items-stretch">
                    <StatCard
                        title="Balance"
                        value={`${(kpis?.netBalance ?? 0) >= 0 ? "+" : "-"}${formatCurrency(kpis?.netBalance ?? 0)}`}
                        icon={DollarSign}
                        iconClassName={(kpis?.netBalance ?? 0) >= 0 ? "text-green-500" : "text-red-500"}
                        description="Ingresos menos gastos"
                        tooltipText="Diferencia exacta entre tus ingresos totales y gastos totales. Un balance positivo indica superávit."
                        trend={kpis ? {
                            value: `${kpis.transactionCount} transacciones`,
                            positive: kpis.netBalance >= 0,
                        } : undefined}
                        className="flex-1"
                    />
                </div>
                <div className="snap-center shrink-0 w-[240px] sm:w-auto sm:col-span-1 flex flex-col items-stretch">
                    <StatCard
                        title="Promedio"
                        value={formatCurrency(kpis?.avgTransactionAmount ?? 0)}
                        icon={Activity}
                        description="Promedio general"
                        tooltipText="Valor promedio general, calculado dividiendo el volumen total de dinero movido entre la cantidad de transacciones."
                        className="flex-1"
                    />
                </div>
                <Link href="/financial/scans" className="snap-center shrink-0 w-[240px] sm:w-auto sm:col-span-1 flex flex-col items-stretch focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                    <StatCard
                        title="En revisión"
                        value={kpis?.pendingTransactionsCount?.toString() ?? "0"}
                        icon={Clock}
                        iconClassName="text-amber-500"
                        description="Pendientes de confirmación"
                        tooltipText="Transacciones que han sido escaneadas pero aún no se han clasificado o confirmado manualmente."
                        className="flex-1 hover:bg-muted/50 transition-colors cursor-pointer"
                    />
                </Link>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <MonthlyChart data={dailyBreakdown} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ingreso diario</CardTitle>
                        <CardDescription>Evolución de tus ingresos día a día</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DailyIncomeChart data={dailyBreakdown} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gasto diario</CardTitle>
                        <CardDescription>Evolución de tus gastos día a día</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DailySpendingChart data={dailyBreakdown} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Por categoría de gasto</CardTitle>
                        <CardDescription>Distribución detallada de tus gastos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CategoryPieChart data={categoryBreakdown} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Por institución</CardTitle>
                        <CardDescription>Volumen total movido por banco o institución</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InstitutionBarChart data={institutionBreakdown} />
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
                            {recent.map(tx => (
                                <Link
                                    key={tx.id}
                                    href={`/financial/transactions/${tx.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-sm">
                                            {tx.merchant || tx.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(tx.date).toLocaleDateString("es-ES", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <span className={`font-semibold text-sm ${tx.type === "INCOME" || tx.type === "DEPOSIT" || tx.type === "REFUND"
                                        ? "text-green-500"
                                        : "text-red-500"
                                        }`}>
                                        {tx.type === "INCOME" || tx.type === "DEPOSIT" || tx.type === "REFUND" ? "+" : "-"}
                                        ${Number(tx.amount).toFixed(2)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

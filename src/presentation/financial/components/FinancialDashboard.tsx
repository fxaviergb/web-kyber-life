"use client";

import { useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyChart } from "./MonthlyChart";
import { TypeBreakdownChart } from "./TypeBreakdownChart";
import { useFinancialDashboardOffline } from "../hooks/useFinancialDashboardOffline";
import { useFinancialRealtime } from "../hooks/useFinancialRealtime";
import { DollarSign, TrendingUp, TrendingDown, Activity, ArrowRight, WifiOff, RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function formatCurrency(value: number): string {
        return `$${Math.abs(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinancialDashboard() {
    const { kpis, monthly, typeBreakdown, recent, loading, isStale, error, refresh } =
        useFinancialDashboardOffline();

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                    ))}
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
            {/* Stale/offline banner */}
            {isStale && (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-400">
                    <WifiOff className="h-4 w-4 shrink-0" />
                    <span className="flex-1">
                        {error ?? "Mostrando datos en caché. Actualizando en segundo plano..."}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refresh}
                        disabled={loading}
                        className="text-yellow-400 hover:text-yellow-300"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            )}



            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Ingresos totales"
                    value={formatCurrency(kpis?.totalIncome ?? 0)}
                    icon={TrendingUp}
                    iconClassName="text-green-500"
                    description="Todos los ingresos confirmados"
                />
                <StatCard
                    title="Gastos totales"
                    value={formatCurrency(kpis?.totalExpenses ?? 0)}
                    icon={TrendingDown}
                    iconClassName="text-red-500"
                    description="Todos los gastos confirmados"
                />
                <StatCard
                    title="Balance neto"
                    value={`${(kpis?.netBalance ?? 0) >= 0 ? "+" : "-"}${formatCurrency(kpis?.netBalance ?? 0)}`}
                    icon={DollarSign}
                    iconClassName={(kpis?.netBalance ?? 0) >= 0 ? "text-green-500" : "text-red-500"}
                    description="Ingresos menos gastos"
                    trend={kpis ? {
                        value: `${kpis.transactionCount} transacciones`,
                        positive: kpis.netBalance >= 0,
                    } : undefined}
                />
                <StatCard
                    title="Prom. por transacción"
                    value={formatCurrency(kpis?.avgTransactionAmount ?? 0)}
                    icon={Activity}
                    description="Monto promedio por transacción"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen mensual</CardTitle>
                        <CardDescription>Ingresos vs. gastos en los últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MonthlyChart data={monthly} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Por tipo de transacción</CardTitle>
                        <CardDescription>Distribución del gasto por categoría</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TypeBreakdownChart data={typeBreakdown} />
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
                                    <span className={`font-semibold text-sm ${
                                        tx.type === "INCOME" || tx.type === "DEPOSIT" || tx.type === "REFUND"
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

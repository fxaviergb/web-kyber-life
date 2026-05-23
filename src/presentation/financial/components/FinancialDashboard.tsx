"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyChart } from "./MonthlyChart";
import { TypeBreakdownChart } from "./TypeBreakdownChart";
import { useFinancialDashboardOffline } from "../hooks/useFinancialDashboardOffline";
import { DollarSign, TrendingUp, TrendingDown, Activity, ArrowRight, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function formatCurrency(value: number): string {
    return `$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinancialDashboard() {
    const { kpis, monthly, typeBreakdown, recent, loading, isStale, error, refresh } =
        useFinancialDashboardOffline();

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
                        {error ?? "Showing cached data. Refreshing in the background…"}
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
                    title="Total Income"
                    value={formatCurrency(kpis?.totalIncome ?? 0)}
                    icon={TrendingUp}
                    iconClassName="text-green-500"
                    description="All confirmed income"
                />
                <StatCard
                    title="Total Expenses"
                    value={formatCurrency(kpis?.totalExpenses ?? 0)}
                    icon={TrendingDown}
                    iconClassName="text-red-500"
                    description="All confirmed expenses"
                />
                <StatCard
                    title="Net Balance"
                    value={`${(kpis?.netBalance ?? 0) >= 0 ? "+" : "-"}${formatCurrency(kpis?.netBalance ?? 0)}`}
                    icon={DollarSign}
                    iconClassName={(kpis?.netBalance ?? 0) >= 0 ? "text-green-500" : "text-red-500"}
                    description="Income minus expenses"
                    trend={kpis ? {
                        value: `${kpis.transactionCount} transactions`,
                        positive: kpis.netBalance >= 0,
                    } : undefined}
                />
                <StatCard
                    title="Avg. Transaction"
                    value={formatCurrency(kpis?.avgTransactionAmount ?? 0)}
                    icon={Activity}
                    description="Average amount per transaction"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Overview</CardTitle>
                        <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MonthlyChart data={monthly} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>By Transaction Type</CardTitle>
                        <CardDescription>Distribution of spending by category</CardDescription>
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
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Your latest financial activity</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/financial/transactions">
                            View All
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recent.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No transactions yet. Start by adding one manually or scanning your emails.
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
                                            {new Date(tx.date).toLocaleDateString("en-US", {
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

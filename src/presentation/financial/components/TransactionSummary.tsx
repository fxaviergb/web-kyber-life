"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, BarChart2 } from "lucide-react";
import type { FinancialTransaction, FinancialTransactionType } from "@/domain/entities/financial";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Type visual metadata ────────────────────────────────────

interface TypeMeta {
    sign: "positive" | "negative" | "neutral" | "withdrawal";
}

const TYPE_META: Record<FinancialTransactionType, TypeMeta> = {
    INCOME: { sign: "positive" },
    DEPOSIT: { sign: "positive" },
    REFUND: { sign: "positive" },
    EXPENSE: { sign: "negative" },
    SUBSCRIPTION: { sign: "negative" },
    PAYMENT: { sign: "negative" },
    WITHDRAWAL: { sign: "withdrawal" },
    FEE: { sign: "negative" },
    TAX: { sign: "negative" },
    TRANSFER: { sign: "neutral" },
    OTHER: { sign: "neutral" },
};

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ─── Component ───────────────────────────────────────────────

interface TransactionSummaryProps {
    transactions: FinancialTransaction[];
}

type ViewMode = 'day' | 'week' | 'month';

export function TransactionSummary({ transactions }: TransactionSummaryProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        balance,
        primaryCurrency,
        chartData,
        totalIncome,
        totalExpense,
        totalOther,
        totalWithdrawal
    } = useMemo(() => {
        if (transactions.length === 0) {
            return {
                balance: 0,
                primaryCurrency: "USD",
                chartData: [],
                totalIncome: 0,
                totalExpense: 0,
                totalOther: 0,
                totalWithdrawal: 0
            };
        }

        // Dominant currency
        const currencyCounts: Record<string, number> = {};
        transactions.forEach((t) => {
            currencyCounts[t.currency] = (currencyCounts[t.currency] ?? 0) + 1;
        });
        const dominant = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";

        let incomeSum = 0;
        let expenseSum = 0;
        let otherSum = 0;
        let withdrawalSum = 0;

        const chartDataMap: Record<string, { date: string, income: number, expense: number, other: number, withdrawal: number, timestamp: number }> = {};

        transactions.forEach((t) => {
            const d = new Date(t.date);
            let dateStr = "";
            let timestamp = d.getTime();

            if (viewMode === 'day') {
                dateStr = d.toLocaleDateString("es-EC", { day: '2-digit', month: 'short' });
            } else if (viewMode === 'week') {
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const startOfWeek = new Date(d);
                startOfWeek.setDate(diff);
                dateStr = startOfWeek.toLocaleDateString("es-EC", { day: '2-digit', month: 'short' });
                timestamp = startOfWeek.getTime();
            } else if (viewMode === 'month') {
                dateStr = d.toLocaleDateString("es-EC", { month: 'short' });
                dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
                const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
                timestamp = startOfMonth.getTime();
            }

            if (!chartDataMap[dateStr]) {
                chartDataMap[dateStr] = { date: dateStr, income: 0, expense: 0, other: 0, withdrawal: 0, timestamp };
            }

            const { sign } = TYPE_META[t.type];
            if (sign === "positive") {
                incomeSum += t.amount;
                chartDataMap[dateStr].income += t.amount;
            } else if (sign === "negative") {
                expenseSum += t.amount;
                chartDataMap[dateStr].expense += t.amount;
            } else if (sign === "withdrawal") {
                withdrawalSum += t.amount;
                chartDataMap[dateStr].withdrawal += t.amount;
            } else {
                otherSum += t.amount;
                chartDataMap[dateStr].other += t.amount;
            }
        });

        // Ordenar cronológicamente para el gráfico
        const chartData = Object.values(chartDataMap).sort((a, b) => a.timestamp - b.timestamp);

        let finalBalance = incomeSum - expenseSum - withdrawalSum;
        // Si estamos viendo exclusivamente transferencias
        if (incomeSum === 0 && expenseSum === 0 && withdrawalSum === 0 && otherSum > 0) {
            finalBalance = otherSum;
        }
        // Si estamos viendo exclusivamente retiros, mostrar la suma en positivo
        else if (incomeSum === 0 && expenseSum === 0 && otherSum === 0 && withdrawalSum > 0) {
            finalBalance = withdrawalSum;
        }

        return {
            balance: finalBalance,
            primaryCurrency: dominant,
            chartData,
            totalIncome: incomeSum,
            totalExpense: expenseSum,
            totalOther: otherSum,
            totalWithdrawal: withdrawalSum
        };
    }, [transactions, viewMode]);

    if (transactions.length === 0) return null;

    const pieData = [
        { name: "Ingresos", value: totalIncome, fill: "#10b981" },
        { name: "Gastos", value: totalExpense, fill: "#f43f5e" },
        { name: "Retiros", value: totalWithdrawal, fill: "#0284c7" },
        { name: "Transferencias", value: totalOther, fill: "#f59e0b" },
    ].filter(d => d.value > 0);

    const balanceStr = (balance > 0 ? "+" : balance < 0 ? "-" : "") + formatCurrency(Math.abs(balance), primaryCurrency);
    // Adaptar el radio interno dinámicamente según el tamaño del texto para que los bordes sean lo más gruesos posibles sin solaparse
    const innerRadiusPercent = Math.min(85, Math.max(50, 35 + (balanceStr.length * 3.5)));
    const dynamicInnerRadius = `${innerRadiusPercent}%`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // No mostrar etiquetas en secciones muy pequeñas
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold drop-shadow-md">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Mobile Accordion Toggle */}
            <div
                className={cn(
                    "sm:hidden relative flex items-center justify-between py-3 px-4 rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] to-transparent shadow-lg shadow-black/5 dark:shadow-black/20 cursor-pointer transition-all active:scale-[0.98]",
                    isExpanded ? "bg-black/[0.02] dark:bg-white/[0.02] border-border dark:border-white/15" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent rounded-t-[1.25rem]" aria-hidden="true" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 border border-accent-primary/20 text-accent-primary shadow-inner">
                        <BarChart2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex flex-col justify-center gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold tracking-tight leading-none text-foreground/90">Balance</span>
                            <span className={cn(
                                "text-lg font-bold tracking-tight leading-none",
                                balance > 0 ? "text-emerald-600 dark:text-emerald-400" : balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground/90"
                            )}>
                                {balanceStr}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-none uppercase tracking-wider">
                            Resumen Visual <span className="opacity-60 normal-case tracking-normal ml-1">({transactions.length} reg)</span>
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 border border-border/50 dark:border-white/10 shadow-sm">
                    <ChevronDown className={cn("w-4 h-4 text-foreground/70 transition-transform duration-300", isExpanded && "rotate-180")} />
                </div>
            </div>

            {/* Content (Hidden on mobile by default) */}
            <div className={cn(
                "relative overflow-hidden rounded-2xl border border-white/5 bg-background/40 backdrop-blur-xl shadow-sm p-5 sm:p-6 flex-col transition-all duration-300",
                isExpanded ? "flex animate-in fade-in slide-in-from-top-4" : "hidden sm:flex"
            )}>

                {/* Charts row (donut + breakdown) — kept in its own wrapper so the
                    totals strip below never alters the chart dimensions. */}
                <div className="flex w-full flex-col lg:flex-row gap-6 lg:gap-8 lg:items-center">

                {/* ── LEFT SIDE: BALANCE NETO (DONUT CHART) ── */}
                <div className="relative z-10 flex flex-col items-center justify-center lg:w-auto lg:shrink-0 lg:border-r lg:border-white/5 lg:pr-8">

                    <div className="relative w-44 h-44 flex-shrink-0 mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={dynamicInnerRadius}
                                    outerRadius="100%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-bg-primary border border-border/50 rounded-lg shadow-lg p-2 text-xs flex items-center gap-2 z-50">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                                                    <span className="text-muted-foreground">{payload[0].name}:</span>
                                                    <span className="font-semibold text-foreground">
                                                        {formatCurrency(payload[0].value as number, primaryCurrency)}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Centered text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1 px-2">
                            <span className={cn(
                                "text-base sm:text-lg font-bold tracking-tighter drop-shadow-sm leading-none mb-1 whitespace-nowrap",
                                balance > 0 ? "bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent" : (balance < 0 ? "bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent" : "text-muted-foreground")
                            )}>
                                {balanceStr}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground/80">
                                {transactions.length} trx
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT SIDE: BREAKDOWN CHART ── */}
                <div className="relative z-10 flex flex-col w-full flex-1 sm:h-44 lg:h-44 justify-between">
                    {/* Header (Legend + Select) */}
                    <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-2 gap-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                            {totalIncome > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Ingresos</span>
                                </div>
                            )}
                            {totalExpense > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span>Gastos</span>
                                </div>
                            )}
                            {totalWithdrawal > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0284c7" }} />
                                    <span>Retiros</span>
                                </div>
                            )}
                            {totalOther > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>Transferencias</span>
                                </div>
                            )}
                        </div>

                        <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                            <SelectTrigger className="h-7 w-[110px] text-xs bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                                <SelectValue placeholder="Vista" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                                <SelectItem value="day" className="text-xs">Por día</SelectItem>
                                <SelectItem value="week" className="text-xs">Por semana</SelectItem>
                                <SelectItem value="month" className="text-xs">Por mes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Chart Area */}
                    <div className="w-full -ml-4 h-[180px] sm:h-auto sm:flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <YAxis
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                                        if (value >= 1000) return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                                        return `$${value}`;
                                    }}
                                    width={40}
                                    tick={{ fontSize: 10, fill: '#878787' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#878787', fontSize: 10 }}
                                    dy={10}
                                    minTickGap={20}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-bg-primary border border-border/50 rounded-lg shadow-lg p-3 text-xs flex flex-col gap-1 z-50">
                                                    <span className="font-medium text-foreground mb-1">{label}</span>
                                                    {totalIncome > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-muted-foreground">Ingresos:</span>
                                                            <span className="font-semibold text-foreground">
                                                                {formatCurrency((payload.find(p => p.dataKey === 'income')?.value as number) || 0, primaryCurrency)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {totalExpense > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                            <span className="text-muted-foreground">Gastos:</span>
                                                            <span className="font-semibold text-foreground">
                                                                {formatCurrency((payload.find(p => p.dataKey === 'expense')?.value as number) || 0, primaryCurrency)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {totalWithdrawal > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0284c7" }} />
                                                            <span className="text-muted-foreground">Retiros:</span>
                                                            <span className="font-semibold text-foreground">
                                                                {formatCurrency((payload.find(p => p.dataKey === 'withdrawal')?.value as number) || 0, primaryCurrency)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {totalOther > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                            <span className="text-muted-foreground">Transferencias:</span>
                                                            <span className="font-semibold text-foreground">
                                                                {formatCurrency((payload.find(p => p.dataKey === 'other')?.value as number) || 0, primaryCurrency)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {totalIncome > 0 && <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />}
                                {totalExpense > 0 && <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />}
                                {totalWithdrawal > 0 && <Area type="monotone" dataKey="withdrawal" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorWithdrawal)" />}
                                {totalOther > 0 && <Area type="monotone" dataKey="other" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorOther)" />}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                </div>

                {/* ── Per-type totals ── computed from the same (filtered) transactions
                    that feed the charts, placed below so the charts never resize. */}
                {pieData.length > 0 && (
                    <div className="relative z-10 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            Totales
                        </span>
                        {pieData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{item.name}</span>
                                <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground/90 tabular-nums whitespace-nowrap">
                                    {formatCurrency(item.value, primaryCurrency)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

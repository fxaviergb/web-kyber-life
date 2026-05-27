"use client";

import { useMemo } from "react";
import {
    TrendingDown,
    TrendingUp,
    ArrowLeftRight,
    Wallet
} from "lucide-react";
import type { FinancialTransaction, FinancialTransactionType } from "@/domain/entities/financial";
import { cn } from "@/lib/utils";

// ─── Type visual metadata ────────────────────────────────────

interface TypeMeta {
    sign: "positive" | "negative" | "neutral";
}

const TYPE_META: Record<FinancialTransactionType, TypeMeta> = {
    INCOME:       { sign: "positive" },
    DEPOSIT:      { sign: "positive" },
    REFUND:       { sign: "positive" },
    EXPENSE:      { sign: "negative" },
    SUBSCRIPTION: { sign: "negative" },
    PAYMENT:      { sign: "negative" },
    WITHDRAWAL:   { sign: "negative" },
    FEE:          { sign: "negative" },
    TAX:          { sign: "negative" },
    TRANSFER:     { sign: "neutral"  },
    OTHER:        { sign: "neutral"  },
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

export function TransactionSummary({ transactions }: TransactionSummaryProps) {
    const { 
        totalIncome, 
        totalExpense, 
        totalOther,
        incomeCount,
        expenseCount,
        otherCount,
        balance, 
        primaryCurrency 
    } = useMemo(() => {
        if (transactions.length === 0) {
            return { 
                totalIncome: 0, 
                totalExpense: 0, 
                totalOther: 0,
                incomeCount: 0,
                expenseCount: 0,
                otherCount: 0,
                balance: 0, 
                primaryCurrency: "USD" 
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
        
        let incCount = 0;
        let expCount = 0;
        let othCount = 0;

        transactions.forEach((t) => {
            const { sign } = TYPE_META[t.type];
            if (sign === "positive") {
                incomeSum += t.amount;
                incCount++;
            } else if (sign === "negative") {
                expenseSum += t.amount;
                expCount++;
            } else {
                otherSum += t.amount;
                othCount++;
            }
        });

        return {
            totalIncome: incomeSum,
            totalExpense: expenseSum,
            totalOther: otherSum,
            incomeCount: incCount,
            expenseCount: expCount,
            otherCount: othCount,
            balance: incomeSum - expenseSum,
            primaryCurrency: dominant,
        };
    }, [transactions]);

    if (transactions.length === 0) return null;

    // Proportional bar widths
    const maxAbsolute = Math.max(totalIncome + totalExpense + totalOther, 1);
    const incomeBarPercent = (totalIncome / maxAbsolute) * 100;
    const expenseBarPercent = (totalExpense / maxAbsolute) * 100;
    const otherBarPercent = (totalOther / maxAbsolute) * 100;

    return (
        <div className="relative overflow-hidden rounded-xl border border-border-base bg-bg-secondary/40 backdrop-blur-xl shadow-custom-sm p-3 sm:p-4 flex flex-col lg:flex-row gap-4 lg:items-center">

            {/* ── LEFT SIDE: BALANCE NETO ── */}
            <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left gap-1 lg:w-1/3 lg:shrink-0">
                <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                    <div className="flex items-center justify-center w-4 h-4 rounded bg-accent-brand/10 text-accent-brand">
                        <Wallet className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-tertiary">
                        Balance Neto
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-bg-tertiary/50 text-[9px] font-medium border border-border-base text-text-secondary">
                        {transactions.length} reg.
                    </span>
                </div>
                
                <div className="mt-0.5 flex items-baseline justify-center lg:justify-start gap-1">
                    <span className={cn(
                        "text-xl sm:text-2xl font-medium",
                        balance > 0 ? "text-accent-success" : (balance < 0 ? "text-accent-danger" : "text-text-tertiary")
                    )}>
                        {balance > 0 ? "+" : balance < 0 ? "-" : ""}
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-text-primary">
                        {formatCurrency(Math.abs(balance), primaryCurrency)}
                    </span>
                </div>
            </div>

            {/* ── RIGHT SIDE: BREAKDOWN ── */}
            <div className="relative z-10 flex flex-col gap-2 w-full lg:w-2/3">
                {/* Progress Bar */}
                <div className="h-1.5 w-full flex bg-bg-tertiary/40 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-accent-success h-full transition-all duration-1000 ease-out" style={{ width: `${incomeBarPercent}%` }} />
                    <div className="bg-accent-danger h-full transition-all duration-1000 ease-out" style={{ width: `${expenseBarPercent}%` }} />
                    {otherCount > 0 && <div className="bg-accent-info h-full transition-all duration-1000 ease-out" style={{ width: `${otherBarPercent}%` }} />}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {/* Income */}
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-bg-primary/50 border border-border-base/50 hover:bg-bg-primary/80 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-success/10 shrink-0">
                                <TrendingUp className="h-3 w-3 text-accent-success" />
                            </div>
                            <span className="text-[11px] font-medium text-text-secondary">Ingresos</span>
                        </div>
                        <div className="flex flex-col mt-0.5">
                            <span className="text-sm font-bold tabular-nums text-text-primary truncate">
                                {formatCurrency(totalIncome, primaryCurrency)}
                            </span>
                            <span className="text-[9px] font-medium text-text-tertiary mt-0.5">
                                {incomeCount} {incomeCount === 1 ? 'txn' : 'txns'}
                            </span>
                        </div>
                    </div>

                    {/* Expense */}
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-bg-primary/50 border border-border-base/50 hover:bg-bg-primary/80 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-danger/10 shrink-0">
                                <TrendingDown className="h-3 w-3 text-accent-danger" />
                            </div>
                            <span className="text-[11px] font-medium text-text-secondary">Gastos</span>
                        </div>
                        <div className="flex flex-col mt-0.5">
                            <span className="text-sm font-bold tabular-nums text-text-primary truncate">
                                {formatCurrency(totalExpense, primaryCurrency)}
                            </span>
                            <span className="text-[9px] font-medium text-text-tertiary mt-0.5">
                                {expenseCount} {expenseCount === 1 ? 'txn' : 'txns'}
                            </span>
                        </div>
                    </div>

                    {/* Other */}
                    {otherCount > 0 && (
                        <div className="flex flex-col gap-1 p-2 rounded-lg bg-bg-primary/50 border border-border-base/50 col-span-2 sm:col-span-1 hover:bg-bg-primary/80 transition-colors">
                            <div className="flex items-center gap-1.5">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-info/10 shrink-0">
                                    <ArrowLeftRight className="h-3 w-3 text-accent-info" />
                                </div>
                                <span className="text-[11px] font-medium text-text-secondary">Otros</span>
                            </div>
                            <div className="flex flex-col mt-0.5">
                                <span className="text-sm font-bold tabular-nums text-text-primary truncate">
                                    {formatCurrency(Math.abs(totalOther), primaryCurrency)}
                                </span>
                                <span className="text-[9px] font-medium text-text-tertiary mt-0.5">
                                    {otherCount} {otherCount === 1 ? 'txn' : 'txns'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

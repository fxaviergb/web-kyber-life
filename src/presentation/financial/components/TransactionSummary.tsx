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
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-background/40 backdrop-blur-xl shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-center">

            {/* ── LEFT SIDE: BALANCE NETO ── */}
            <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left gap-2 lg:w-1/3 lg:shrink-0 lg:border-r lg:border-white/5 lg:pr-8">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-brand/10 text-accent-brand">
                        <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Balance Neto
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                        {transactions.length} reg.
                    </span>
                </div>
                
                <div className="mt-1 flex items-baseline justify-center lg:justify-start gap-1">
                    <span className={cn(
                        "text-3xl sm:text-4xl font-light tracking-tight",
                        balance > 0 ? "text-accent-success" : (balance < 0 ? "text-accent-danger" : "text-muted-foreground")
                    )}>
                        {balance > 0 ? "+" : balance < 0 ? "-" : ""}
                        {formatCurrency(Math.abs(balance), primaryCurrency)}
                    </span>
                </div>
            </div>

            {/* ── RIGHT SIDE: BREAKDOWN ── */}
            <div className="relative z-10 flex flex-col gap-5 w-full lg:w-2/3">
                {/* Stats */}
                <div className="flex flex-row w-full justify-between gap-4">
                    {/* Income */}
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="h-3.5 w-3.5 text-accent-success" />
                            <span className="text-xs font-medium text-muted-foreground">Ingresos</span>
                        </div>
                        <span className="text-xl font-medium tracking-tight text-foreground">
                            {formatCurrency(totalIncome, primaryCurrency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {incomeCount} {incomeCount === 1 ? 'transacción' : 'transacciones'}
                        </span>
                    </div>

                    {/* Expense */}
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                            <TrendingDown className="h-3.5 w-3.5 text-accent-danger" />
                            <span className="text-xs font-medium text-muted-foreground">Gastos</span>
                        </div>
                        <span className="text-xl font-medium tracking-tight text-foreground">
                            {formatCurrency(totalExpense, primaryCurrency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {expenseCount} {expenseCount === 1 ? 'transacción' : 'transacciones'}
                        </span>
                    </div>

                    {/* Other */}
                    {otherCount > 0 && (
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <ArrowLeftRight className="h-3.5 w-3.5 text-accent-info" />
                                <span className="text-xs font-medium text-muted-foreground">Otros</span>
                            </div>
                            <span className="text-xl font-medium tracking-tight text-foreground">
                                {formatCurrency(Math.abs(totalOther), primaryCurrency)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {otherCount} {otherCount === 1 ? 'transacción' : 'transacciones'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full flex bg-muted rounded-full overflow-hidden opacity-80 mt-1">
                    <div className="bg-accent-success h-full transition-all duration-1000 ease-out" style={{ width: `${incomeBarPercent}%` }} />
                    <div className="bg-accent-danger h-full transition-all duration-1000 ease-out" style={{ width: `${expenseBarPercent}%` }} />
                    {otherCount > 0 && <div className="bg-accent-info h-full transition-all duration-1000 ease-out" style={{ width: `${otherBarPercent}%` }} />}
                </div>
            </div>

        </div>
    );
}

"use client";

import { useState } from "react";
import { FinancialTransaction } from "@/domain/entities/financial";
import { TransactionCard } from "./TransactionCard";

interface TransactionTimelineProps {
    initialTransactions: FinancialTransaction[];
}

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function groupTransactionsByDate(transactions: FinancialTransaction[]) {
    const groups: Record<string, FinancialTransaction[]> = {};

    transactions.forEach(t => {
        const dateKey = formatDateLabel(t.date);

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(t);
    });

    return groups;
}

export function TransactionTimeline({ initialTransactions }: TransactionTimelineProps) {
    const [transactions] = useState<FinancialTransaction[]>(initialTransactions);
    const grouped = groupTransactionsByDate(transactions);

    return (
        <div className="flex flex-col gap-8">
            {transactions.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    No transactions found.
                </div>
            ) : (
                Object.entries(grouped).map(([dateLabel, items]) => (
                    <div key={dateLabel} className="flex flex-col gap-3">
                        <h3 className="text-sm font-medium text-muted-foreground tracking-tight sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                            {dateLabel}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {items.map(t => (
                                <TransactionCard key={t.id} transaction={t} />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { FinancialTransaction } from "@/domain/entities/financial";
import { TransactionCard } from "./TransactionCard";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import { WifiOff } from "lucide-react";

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
    const [transactions, setTransactions] = useState<FinancialTransaction[]>(initialTransactions);
    const [isFromCache, setIsFromCache] = useState(false);

    // Persist server data to IndexedDB for future offline access
    useEffect(() => {
        if (initialTransactions.length > 0) {
            financialOfflineStore.transactions.set("current-user", initialTransactions).catch(() => {
                // Silently ignore IndexedDB errors (e.g. private browsing)
            });
        }
    }, [initialTransactions]);

    // If server returned empty (possibly offline), try loading from cache
    useEffect(() => {
        if (initialTransactions.length > 0) return;

        (async () => {
            try {
                const cached = await financialOfflineStore.transactions.getAll();
                const flat = (cached?.[0] ?? []) as FinancialTransaction[];
                if (flat.length > 0) {
                    setTransactions(flat);
                    setIsFromCache(true);
                }
            } catch {
                // IndexedDB unavailable
            }
        })();
    }, [initialTransactions]);

    const grouped = groupTransactionsByDate(transactions);

    return (
        <div className="flex flex-col gap-8">
            {isFromCache && (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-400">
                    <WifiOff className="h-4 w-4 shrink-0" />
                    <span>Showing cached transactions — you appear to be offline.</span>
                </div>
            )}

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

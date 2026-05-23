"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { FinancialTransaction } from "@/domain/entities/financial";
import type { PaginatedResult } from "@/domain/pagination";
import { TransactionCard } from "./TransactionCard";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import { searchPaginatedTransactionsAction } from "@/app/actions/financial-transactions";
import { useFinancialRealtime } from "../hooks/useFinancialRealtime";
import { WifiOff, Loader2, Radio } from "lucide-react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ─── Props ───────────────────────────────────────────────────

interface TransactionTimelineProps {
    /** Server-rendered first page */
    initialTransactions: FinancialTransaction[];
    /** Current URL search-params so infinite scroll can re-apply the same filters */
    searchFilters?: Record<string, string | undefined>;
}

// ─── Supabase row shape (snake_case) ─────────────────────────

interface TransactionRow extends Record<string, unknown> {
    id: string;
    owner_user_id: string;
    type: string;
    status: string;
    amount: number;
    original_amount: number | null;
    currency: string;
    merchant: string | null;
    category_id: string | null;
    institution_id: string | null;
    account_id: string | null;
    tags: string[] | null;
    notes: string | null;
    possible_duplicate: boolean;
    execution_id: string | null;
    origin_stats: Record<string, unknown> | null;
    date: string;
    created_at: string;
    updated_at: string;
    is_deleted?: boolean;
}

/** Map Supabase snake_case row to domain camelCase entity */
function mapRowToTransaction(row: TransactionRow): FinancialTransaction {
    return {
        id: row.id,
        ownerUserId: row.owner_user_id,
        type: row.type as FinancialTransaction["type"],
        status: row.status as FinancialTransaction["status"],
        amount: Number(row.amount),
        originalAmount: row.original_amount != null ? Number(row.original_amount) : null,
        currency: row.currency,
        merchant: row.merchant,
        categoryId: row.category_id,
        institutionId: row.institution_id,
        accountId: row.account_id,
        tags: row.tags,
        notes: row.notes,
        possibleDuplicate: row.possible_duplicate ?? false,
        executionId: row.execution_id,
        originStats: row.origin_stats as Record<string, unknown> | null,
        date: row.date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted ?? false,
    };
}

// ─── Helpers ─────────────────────────────────────────────────

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

// ─── Default page size ───────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Component ───────────────────────────────────────────────

export function TransactionTimeline({ initialTransactions, searchFilters }: TransactionTimelineProps) {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>(initialTransactions);
    const [isFromCache, setIsFromCache] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const sentinelRef = useRef<HTMLDivElement>(null);

    // ── Realtime: prepend new transactions on INSERT ─────────
    const handleRealtimeInsert = useCallback(
        (payload: RealtimePostgresChangesPayload<TransactionRow>) => {
            const newRow = payload.new;
            if (!newRow || typeof newRow !== "object" || !("id" in newRow)) return;

            const mapped = mapRowToTransaction(newRow as TransactionRow);

            setTransactions(prev => {
                // Prevent duplicates
                if (prev.some(t => t.id === mapped.id)) return prev;
                return [mapped, ...prev];
            });
        },
        [],
    );

    const realtimeSubscriptions = useMemo(
        () => [{ table: "financial_transactions", event: "INSERT" as const }],
        [],
    );

    const realtimeCallbacks = useMemo(
        () => ({ onInsert: handleRealtimeInsert }),
        [handleRealtimeInsert],
    );

    const { isPollingFallback } = useFinancialRealtime({
        channelName: "timeline-realtime",
        subscriptions: realtimeSubscriptions,
        callbacks: realtimeCallbacks as never,
        enabled: !isFromCache,
    });

    // ── Reset when server data / filters change ──────────────
    useEffect(() => {
        setTransactions(initialTransactions);
        setPage(1);
        // If the server sent fewer items than a full page, there's nothing left.
        setHasMore(initialTransactions.length >= PAGE_SIZE);
    }, [initialTransactions]);

    // ── Persist to IndexedDB for offline access ──────────────
    useEffect(() => {
        if (initialTransactions.length > 0) {
            financialOfflineStore.transactions.set("current-user", initialTransactions).catch(() => {
                // Silently ignore IndexedDB errors (e.g. private browsing)
            });
        }
    }, [initialTransactions]);

    // ── Offline fallback ─────────────────────────────────────
    useEffect(() => {
        if (initialTransactions.length > 0) return;

        (async () => {
            try {
                const cached = await financialOfflineStore.transactions.getAll();
                const flat = (cached?.[0] ?? []) as FinancialTransaction[];
                if (flat.length > 0) {
                    setTransactions(flat);
                    setIsFromCache(true);
                    setHasMore(false);
                }
            } catch {
                // IndexedDB unavailable
            }
        })();
    }, [initialTransactions]);

    // ── Load next page ───────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || isFromCache) return;

        setIsLoadingMore(true);
        const nextPage = page + 1;

        try {
            const result = await searchPaginatedTransactionsAction({
                ...searchFilters,
                page: nextPage,
                pageSize: PAGE_SIZE,
            });

            if (result.success && result.data) {
                const paginatedData = result.data as PaginatedResult<FinancialTransaction>;
                setTransactions(prev => [...prev, ...paginatedData.data]);
                setPage(nextPage);
                setHasMore(paginatedData.pagination.hasNextPage);
            } else {
                setHasMore(false);
            }
        } catch {
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, isFromCache, page, searchFilters]);

    // ── IntersectionObserver for infinite scroll ─────────────
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: "200px" },
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [loadMore]);

    // ── Render ───────────────────────────────────────────────
    const grouped = groupTransactionsByDate(transactions);

    return (
        <div className="flex flex-col gap-8">
            {isFromCache && (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-400">
                    <WifiOff className="h-4 w-4 shrink-0" />
                    <span>Showing cached transactions — you appear to be offline.</span>
                </div>
            )}

            {isPollingFallback && !isFromCache && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-xs text-blue-400">
                    <Radio className="h-3.5 w-3.5 shrink-0" />
                    <span>Live updates unavailable — polling every 30s</span>
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

            {/* Infinite-scroll sentinel */}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />

            {isLoadingMore && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Loading more transactions…</span>
                </div>
            )}

            {!hasMore && transactions.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                    All transactions loaded.
                </p>
            )}
        </div>
    );
}

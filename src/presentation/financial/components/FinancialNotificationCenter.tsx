"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useFinancialRealtime } from "../hooks/useFinancialRealtime";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ─── Payload shapes from Supabase ──────────────────────────────

interface TransactionPayload extends Record<string, unknown> {
    id: string;
    amount: number;
    merchant: string | null;
    type: string;
    status: string;
    currency: string;
    date: string;
}

interface ScanExecutionPayload extends Record<string, unknown> {
    id: string;
    status: string;
    total_transactions: number | null;
    error_message: string | null;
    execution_id: string | null;
}

interface ScannerTransactionPayload extends Record<string, unknown> {
    id: string;
    amount: number | null;
    merchant: string | null;
    date: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────

function formatAmount(amount: number | null | undefined, currency = "USD"): string {
    if (amount == null) return "Unknown amount";
    return `$${Math.abs(amount).toFixed(2)} ${currency}`;
}

// ─── Props ─────────────────────────────────────────────────────

interface FinancialNotificationCenterProps {
    /** Optional: called when data changes — parent can refresh */
    onDataChange?: () => void;
    /** Whether realtime is enabled */
    enabled?: boolean;
}

// ─── Component ─────────────────────────────────────────────────

/**
 * Invisible component that subscribes to all financial Realtime channels
 * and emits toast notifications for important events.
 *
 * Mount this once at the layout level for the `/financial` route group.
 */
export function FinancialNotificationCenter({
    onDataChange,
    enabled = true,
}: FinancialNotificationCenterProps) {
    // ── Handlers ─────────────────────────────────────────────

    const handleTransactionInsert = useCallback(
        (payload: RealtimePostgresChangesPayload<TransactionPayload>) => {
            const record = payload.new;
            if (!record || typeof record !== "object" || !("id" in record)) return;

            const merchant = record.merchant ?? "Unknown";
            const amount = formatAmount(record.amount, record.currency);

            toast.info("New transaction detected", {
                description: `${merchant} — ${amount}`,
                duration: 5_000,
            });

            onDataChange?.();
        },
        [onDataChange],
    );

    const handleTransactionUpdate = useCallback(
        (payload: RealtimePostgresChangesPayload<TransactionPayload>) => {
            const record = payload.new;
            if (!record || typeof record !== "object" || !("id" in record)) return;

            // Only notify on status transitions
            const oldRecord = payload.old as Partial<TransactionPayload> | undefined;
            if (oldRecord && oldRecord.status !== record.status) {
                toast.info(`Transaction ${record.status.toLowerCase()}`, {
                    description: `${record.merchant ?? "Transaction"} — ${formatAmount(record.amount)}`,
                    duration: 4_000,
                });
            }

            onDataChange?.();
        },
        [onDataChange],
    );

    const handleScanExecutionUpdate = useCallback(
        (payload: RealtimePostgresChangesPayload<ScanExecutionPayload>) => {
            const record = payload.new;
            if (!record || typeof record !== "object" || !("id" in record)) return;

            if (record.status === "COMPLETED") {
                const txCount = record.total_transactions ?? 0;
                toast.success("Scan completed!", {
                    description: `${txCount} transaction${txCount !== 1 ? "s" : ""} found.`,
                    duration: 6_000,
                });
                onDataChange?.();
            } else if (record.status === "FAILED") {
                toast.error("Scan failed", {
                    description: record.error_message ?? "An unknown error occurred during scanning.",
                    duration: 8_000,
                });
            }
        },
        [onDataChange],
    );

    const handleScannerTransactionInsert = useCallback(
        (payload: RealtimePostgresChangesPayload<ScannerTransactionPayload>) => {
            const record = payload.new;
            if (!record || typeof record !== "object" || !("id" in record)) return;

            const merchant = record.merchant ?? "New scanned item";
            const amount = formatAmount(record.amount);

            toast("📧 New scanned transaction", {
                description: `${merchant} — ${amount}`,
                duration: 5_000,
            });

            onDataChange?.();
        },
        [onDataChange],
    );

    // ── Subscription config ──────────────────────────────────

    const subscriptions = useMemo(
        () => [
            { table: "financial_transactions", event: "INSERT" as const },
            { table: "financial_transactions", event: "UPDATE" as const },
            { table: "financial_scan_executions", event: "UPDATE" as const },
            { table: "financial_scanner_transactions", event: "INSERT" as const },
            { table: "financial_scanner_executions", event: "UPDATE" as const },
        ],
        [],
    );

    const callbacks = useMemo(
        () => ({
            onInsert: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                const table = (payload as unknown as { table?: string }).table;

                if (table === "financial_transactions") {
                    handleTransactionInsert(
                        payload as RealtimePostgresChangesPayload<TransactionPayload>,
                    );
                } else if (table === "financial_scanner_transactions") {
                    handleScannerTransactionInsert(
                        payload as RealtimePostgresChangesPayload<ScannerTransactionPayload>,
                    );
                }
            },
            onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                const table = (payload as unknown as { table?: string }).table;

                if (table === "financial_transactions") {
                    handleTransactionUpdate(
                        payload as RealtimePostgresChangesPayload<TransactionPayload>,
                    );
                } else if (
                    table === "financial_scan_executions" ||
                    table === "financial_scanner_executions"
                ) {
                    handleScanExecutionUpdate(
                        payload as RealtimePostgresChangesPayload<ScanExecutionPayload>,
                    );
                }
            },
        }),
        [
            handleTransactionInsert,
            handleTransactionUpdate,
            handleScanExecutionUpdate,
            handleScannerTransactionInsert,
        ],
    );

    useFinancialRealtime({
        channelName: "financial-notifications",
        subscriptions,
        callbacks,
        enabled,
        onPollFallback: onDataChange,
    });

    // This is a headless component — no UI
    return null;
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { FINANCIAL_FLAGS } from "@/lib/feature-flags";


// ─── Types ─────────────────────────────────────────────────────

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE";

interface RealtimeSubscription {
    table: string;
    schema?: string;
    event?: PostgresEvent | "*";
    filter?: string;
}

interface RealtimeCallbacks<T extends Record<string, unknown> = Record<string, unknown>> {
    onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
    onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseFinancialRealtimeOptions<T extends Record<string, unknown> = Record<string, unknown>> {
    /** Channel name — should be unique per subscription scope */
    channelName: string;
    /** Table subscriptions to listen for */
    subscriptions: RealtimeSubscription[];
    /** Callbacks for specific event types */
    callbacks: RealtimeCallbacks<T>;
    /** Whether the subscription is active (default: true) */
    enabled?: boolean;
    /** Polling interval in ms to use as fallback (default: 30_000) */
    pollingFallbackMs?: number;
    /** Callback for polling fallback — fetches latest data */
    onPollFallback?: () => void;
}

interface UseFinancialRealtimeReturn {
    status: ConnectionStatus;
    isPollingFallback: boolean;
    reconnect: () => void;
}

// ─── Constants ─────────────────────────────────────────────────

const DEFAULT_POLLING_INTERVAL_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1_000;

// ─── Hook ──────────────────────────────────────────────────────

/**
 * Reusable Supabase Realtime subscription hook for financial module.
 *
 * Features:
 * - Multi-table subscription via a single channel
 * - Automatic reconnection with exponential backoff
 * - Polling fallback when Realtime is unavailable
 * - Connection status tracking
 */
export function useFinancialRealtime<T extends Record<string, unknown> = Record<string, unknown>>(
    options: UseFinancialRealtimeOptions<T>,
): UseFinancialRealtimeReturn {
    const {
        channelName,
        subscriptions,
        callbacks,
        enabled = true,
        pollingFallbackMs = DEFAULT_POLLING_INTERVAL_MS,
        onPollFallback,
    } = options;

    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const [isPollingFallback, setIsPollingFallback] = useState(false);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Cleanup helpers ──────────────────────────────────────

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const clearPollingTimer = useCallback(() => {
        if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
        }
        setIsPollingFallback(false);
    }, []);

    // ── Start polling fallback ───────────────────────────────

    const startPollingFallback = useCallback(() => {
        if (!onPollFallback) return;

        clearPollingTimer();
        setIsPollingFallback(true);

        // Immediate poll
        onPollFallback();

        pollingTimerRef.current = setInterval(() => {
            onPollFallback();
        }, pollingFallbackMs);
    }, [onPollFallback, pollingFallbackMs, clearPollingTimer]);

    // ── Event dispatcher ─────────────────────────────────────

    const handlePayload = useCallback(
        (payload: RealtimePostgresChangesPayload<T>) => {
            callbacks.onChange?.(payload);

            switch (payload.eventType) {
                case "INSERT":
                    callbacks.onInsert?.(payload);
                    break;
                case "UPDATE":
                    callbacks.onUpdate?.(payload);
                    break;
                case "DELETE":
                    callbacks.onDelete?.(payload);
                    break;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [callbacks.onChange, callbacks.onInsert, callbacks.onUpdate, callbacks.onDelete],
    );

    // ── Subscribe ────────────────────────────────────────────

    const subscribe = useCallback(() => {
        if (!FINANCIAL_FLAGS.REALTIME_ENABLED) {
            if (FINANCIAL_FLAGS.POLLING_ENABLED) {
                startPollingFallback();
            }
            setStatus("disconnected");
            return;
        }

        const supabase = createClient();

        // Remove any existing channel first
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        setStatus("connecting");

        let channel = supabase.channel(channelName);

        for (const sub of subscriptions) {
            const event = sub.event ?? "*";
            const schema = sub.schema ?? "public";

            const filter: Record<string, string> = {
                event,
                schema,
                table: sub.table,
            };

            if (sub.filter) {
                filter["filter"] = sub.filter;
            }

            channel = channel.on(
                "postgres_changes" as never,
                filter as never,
                handlePayload as never,
            );
        }

        channel.subscribe((channelStatus) => {
            switch (channelStatus) {
                case "SUBSCRIBED":
                    setStatus("connected");
                    reconnectAttemptsRef.current = 0;
                    clearPollingTimer();
                    break;

                case "CHANNEL_ERROR":
                    setStatus("error");
                    attemptReconnect();
                    break;

                case "TIMED_OUT":
                    setStatus("error");
                    attemptReconnect();
                    break;

                case "CLOSED":
                    setStatus("disconnected");
                    break;
            }
        });

        channelRef.current = channel;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelName, subscriptions, handlePayload, clearPollingTimer]);

    // ── Reconnect with exponential backoff ───────────────────

    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setStatus("error");
            startPollingFallback();
            return;
        }

        clearReconnectTimer();

        const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current += 1;

        reconnectTimerRef.current = setTimeout(() => {
            subscribe();
        }, delay);
    }, [subscribe, startPollingFallback, clearReconnectTimer]);

    // ── Manual reconnect ─────────────────────────────────────

    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        clearReconnectTimer();
        clearPollingTimer();
        subscribe();
    }, [subscribe, clearReconnectTimer, clearPollingTimer]);

    // ── Lifecycle ────────────────────────────────────────────

    useEffect(() => {
        if (!enabled) {
            setStatus("disconnected");
            return;
        }

        subscribe();

        return () => {
            clearReconnectTimer();
            clearPollingTimer();

            if (channelRef.current) {
                const supabase = createClient();
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    return { status, isPollingFallback, reconnect };
}

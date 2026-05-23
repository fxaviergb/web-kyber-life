"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import { searchTransactionsAction } from "@/app/actions/financial-transactions";
import type { FinancialTransaction } from "@/domain/entities/financial";

/** Stable cache key — auth is resolved server-side in server actions. */
const CACHE_KEY = "current-user";

interface TransactionsOfflineState {
    transactions: FinancialTransaction[];
    loading: boolean;
    isStale: boolean;
    error: string | null;
}

interface SearchParams {
    query?: string;
    status?: string;
    type?: string;
}

/**
 * Offline-first hook for the financial transactions list.
 *
 * Strategy:
 * 1. On mount, load the cached transaction list from IndexedDB.
 * 2. Fire the server action to get fresh data.
 * 3. Merge and persist the fresh data back to IndexedDB.
 * 4. On subsequent searches, always try server first but fall back to cached.
 */
export function useTransactionsOffline(initialParams: SearchParams = {}) {
    const [state, setState] = useState<TransactionsOfflineState>({
        transactions: [],
        loading: true,
        isStale: false,
        error: null,
    });
    const [params, setParams] = useState<SearchParams>(initialParams);
    const hasFetched = useRef(false);

    const loadFromCache = useCallback(async (): Promise<boolean> => {
        try {
            const cached = await financialOfflineStore.transactions.getAll();
            const flat = (cached?.[0] ?? []) as FinancialTransaction[];

            if (flat.length > 0) {
                setState(prev => ({
                    ...prev,
                    transactions: flat,
                    loading: false,
                    isStale: true,
                }));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    const fetchFromServer = useCallback(async (searchParams: SearchParams) => {
        try {
            const result = await searchTransactionsAction(searchParams);

            if (result.success && result.data) {
                setState({
                    transactions: result.data,
                    loading: false,
                    isStale: false,
                    error: null,
                });

                // Cache the full unfiltered list for offline access
                if (!searchParams.query && !searchParams.status && !searchParams.type) {
                    await financialOfflineStore.transactions.set(CACHE_KEY, result.data);
                }
            } else {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: result.error ?? "Failed to fetch transactions",
                }));
            }
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: prev.isStale
                    ? "Showing cached data — server unreachable."
                    : (err as Error).message,
            }));
        }
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        (async () => {
            await loadFromCache();
            await fetchFromServer(params);
        })();
    }, [loadFromCache, fetchFromServer, params]);

    const search = useCallback(async (newParams: SearchParams) => {
        setParams(newParams);
        setState(prev => ({ ...prev, loading: true, error: null }));
        await fetchFromServer(newParams);
    }, [fetchFromServer]);

    const refresh = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        await fetchFromServer(params);
    }, [fetchFromServer, params]);

    return { ...state, search, refresh };
}

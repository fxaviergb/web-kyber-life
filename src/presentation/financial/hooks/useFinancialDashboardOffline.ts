"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import {
    getFinancialKPIsAction,
    getMonthlyBreakdownAction,
    getTypeBreakdownAction,
    getRecentTransactionsAction,
} from "@/app/actions/financial-dashboard";
import type { FinancialKPIs, MonthlyBreakdown, TypeBreakdown } from "@/application/services/financial-dashboard-service";
import type { FinancialTransaction } from "@/domain/entities/financial";

/** Stable cache key — the auth check is done server-side in server actions. */
const CACHE_KEY = "current-user";

interface DashboardState {
    kpis: FinancialKPIs | null;
    monthly: MonthlyBreakdown[];
    typeBreakdown: TypeBreakdown[];
    recent: FinancialTransaction[];
    loading: boolean;
    isStale: boolean;
    error: string | null;
}

const INITIAL_STATE: DashboardState = {
    kpis: null,
    monthly: [],
    typeBreakdown: [],
    recent: [],
    loading: true,
    isStale: false,
    error: null,
};

/**
 * Offline-first hook for the financial dashboard.
 *
 * Strategy:
 * 1. Read cached data from IndexedDB immediately (instant render).
 * 2. Fetch fresh data from server actions in the background.
 * 3. Merge fresh data and update the cache for the next visit.
 * 4. If the server call fails (offline), keep showing cached data with an `isStale` flag.
 */
export function useFinancialDashboardOffline() {
    const [state, setState] = useState<DashboardState>(INITIAL_STATE);
    const hasFetched = useRef(false);

    const loadCachedData = useCallback(async () => {
        try {
            const [cachedKpis, cachedMonthly, cachedType, cachedTransactions] = await Promise.all([
                financialOfflineStore.kpi.get(CACHE_KEY),
                financialOfflineStore.monthly.get(CACHE_KEY),
                financialOfflineStore.typeBreakdown.get(CACHE_KEY),
                financialOfflineStore.transactions.getAll(),
            ]);

            const hasCachedData = cachedKpis !== null;

            if (hasCachedData) {
                setState(prev => ({
                    ...prev,
                    kpis: cachedKpis as FinancialKPIs,
                    monthly: (cachedMonthly as MonthlyBreakdown[]) ?? [],
                    typeBreakdown: (cachedType as TypeBreakdown[]) ?? [],
                    recent: (cachedTransactions?.[0] as FinancialTransaction[]) ?? [],
                    loading: false,
                    isStale: true,
                }));
            }

            return hasCachedData;
        } catch {
            return false;
        }
    }, []);

    const fetchFreshData = useCallback(async () => {
        try {
            const [kpiRes, monthlyRes, typeRes, recentRes] = await Promise.all([
                getFinancialKPIsAction(),
                getMonthlyBreakdownAction(6),
                getTypeBreakdownAction(),
                getRecentTransactionsAction(5),
            ]);

            const freshKpis = kpiRes.success && kpiRes.data ? kpiRes.data : null;
            const freshMonthly = monthlyRes.success && monthlyRes.data ? monthlyRes.data : [];
            const freshType = typeRes.success && typeRes.data ? typeRes.data : [];
            const freshRecent = recentRes.success && recentRes.data ? recentRes.data : [];

            setState({
                kpis: freshKpis,
                monthly: freshMonthly,
                typeBreakdown: freshType,
                recent: freshRecent,
                loading: false,
                isStale: false,
                error: null,
            });

            // Persist to IndexedDB for offline access
            await Promise.all([
                freshKpis ? financialOfflineStore.kpi.set(CACHE_KEY, freshKpis) : Promise.resolve(),
                financialOfflineStore.monthly.set(CACHE_KEY, freshMonthly),
                financialOfflineStore.typeBreakdown.set(CACHE_KEY, freshType),
                financialOfflineStore.transactions.set(CACHE_KEY, freshRecent),
            ]);
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: prev.isStale
                    ? "Using cached data — unable to reach the server."
                    : (err as Error).message,
            }));
        }
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        (async () => {
            await loadCachedData();
            await fetchFreshData();
        })();
    }, [loadCachedData, fetchFreshData]);

    const refresh = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        await fetchFreshData();
    }, [fetchFreshData]);

    return { ...state, refresh };
}

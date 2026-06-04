"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import {
    getFinancialKPIsAction,
    getMonthlyBreakdownAction,
    getTypeBreakdownAction,
    getRecentTransactionsAction,
    getCategoryBreakdownAction,
    getInstitutionBreakdownAction,
    getDailyBreakdownAction,
} from "@/app/actions/financial-dashboard";
import type { FinancialKPIs, MonthlyBreakdown, TypeBreakdown, CategoryBreakdown, InstitutionBreakdown, DailyBreakdown } from "@/application/services/financial-dashboard-service";
import type { FinancialTransaction } from "@/domain/entities/financial";

/** Stable cache key — the auth check is done server-side in server actions. */
const CACHE_KEY = "current-user";

interface DashboardState {
    kpis: FinancialKPIs | null;
    monthly: MonthlyBreakdown[];
    typeBreakdown: TypeBreakdown[];
    categoryBreakdown: CategoryBreakdown[];
    institutionBreakdown: InstitutionBreakdown[];
    dailyBreakdown: DailyBreakdown[];
    recent: FinancialTransaction[];
    loading: boolean;
    isStale: boolean;
    error: string | null;
}

const INITIAL_STATE: DashboardState = {
    kpis: null,
    monthly: [],
    typeBreakdown: [],
    categoryBreakdown: [],
    institutionBreakdown: [],
    dailyBreakdown: [],
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
export function useFinancialDashboardOffline(startDate?: string, endDate?: string) {
    const [state, setState] = useState<DashboardState>(INITIAL_STATE);
    // Track current dates to avoid unnecessary refetches if nothing changed
    const currentDates = useRef({ startDate, endDate });

    const getCacheKey = useCallback(() => {
        if (!startDate && !endDate) return CACHE_KEY;
        return `${CACHE_KEY}-${startDate || 'start'}-${endDate || 'end'}`;
    }, [startDate, endDate]);

    const loadCachedData = useCallback(async () => {
        try {
            const key = getCacheKey();
            const [cachedKpis, cachedMonthly, cachedType, cachedCategory, cachedInstitution, cachedDaily, cachedTransactions] = await Promise.all([
                financialOfflineStore.kpi.get(key),
                financialOfflineStore.monthly.get(key),
                financialOfflineStore.typeBreakdown.get(key),
                financialOfflineStore.categoryBreakdown.get(key),
                financialOfflineStore.institutionBreakdown.get(key),
                financialOfflineStore.dailyBreakdown.get(key),
                financialOfflineStore.transactions.get(key), // Use .get(key) instead of .getAll() for specific filter cache
            ]);

            let hasCachedData = cachedKpis !== null;
            let kpis = cachedKpis as FinancialKPIs;
            let monthly = (cachedMonthly as MonthlyBreakdown[]) ?? [];
            let typeBreakdown = (cachedType as TypeBreakdown[]) ?? [];
            let categoryBreakdown = (cachedCategory as CategoryBreakdown[]) ?? [];
            let institutionBreakdown = (cachedInstitution as InstitutionBreakdown[]) ?? [];
            let dailyBreakdown = (cachedDaily as DailyBreakdown[]) ?? [];
            let recent = (cachedTransactions as FinancialTransaction[]) ?? [];
            let usingFallbackCache = false;

            // If we have a filter but no specific cache, fallback to base cache and show a warning
            if (!hasCachedData && (startDate || endDate)) {
                const fallbackKpis = await financialOfflineStore.kpi.get(CACHE_KEY);
                if (fallbackKpis) {
                    const fallbackMonthly = await financialOfflineStore.monthly.get(CACHE_KEY);
                    const fallbackType = await financialOfflineStore.typeBreakdown.get(CACHE_KEY);
                    const fallbackCategory = await financialOfflineStore.categoryBreakdown.get(CACHE_KEY);
                    const fallbackInstitution = await financialOfflineStore.institutionBreakdown.get(CACHE_KEY);
                    const fallbackDaily = await financialOfflineStore.dailyBreakdown.get(CACHE_KEY);
                    const fallbackTransactions = await financialOfflineStore.transactions.get(CACHE_KEY);
                    
                    hasCachedData = true;
                    usingFallbackCache = true;
                    kpis = fallbackKpis as FinancialKPIs;
                    monthly = (fallbackMonthly as MonthlyBreakdown[]) ?? [];
                    typeBreakdown = (fallbackType as TypeBreakdown[]) ?? [];
                    categoryBreakdown = (fallbackCategory as CategoryBreakdown[]) ?? [];
                    institutionBreakdown = (fallbackInstitution as InstitutionBreakdown[]) ?? [];
                    dailyBreakdown = (fallbackDaily as DailyBreakdown[]) ?? [];
                    recent = (fallbackTransactions as FinancialTransaction[]) ?? [];
                }
            }

            if (hasCachedData) {
                setState(prev => ({
                    ...prev,
                    kpis,
                    monthly,
                    typeBreakdown,
                    categoryBreakdown,
                    institutionBreakdown,
                    dailyBreakdown,
                    recent,
                    loading: false,
                    isStale: true,
                    error: usingFallbackCache 
                        ? "Es posible que no se tenga toda la información por falta de conexión." 
                        : null,
                }));
            }

            return hasCachedData;
        } catch {
            return false;
        }
    }, [getCacheKey, startDate, endDate]);

    const fetchFreshData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const [kpiRes, monthlyRes, typeRes, categoryRes, institutionRes, dailyRes, recentRes] = await Promise.all([
                getFinancialKPIsAction(startDate, endDate),
                getMonthlyBreakdownAction(6, startDate, endDate),
                getTypeBreakdownAction(startDate, endDate),
                getCategoryBreakdownAction(startDate, endDate),
                getInstitutionBreakdownAction(startDate, endDate),
                getDailyBreakdownAction(startDate, endDate),
                getRecentTransactionsAction(5, startDate, endDate),
            ]);

            const freshKpis = kpiRes.success && kpiRes.data ? kpiRes.data : null;
            const freshMonthly = monthlyRes.success && monthlyRes.data ? monthlyRes.data : [];
            const freshType = typeRes.success && typeRes.data ? typeRes.data : [];
            const freshCategory = categoryRes.success && categoryRes.data ? categoryRes.data : [];
            const freshInstitution = institutionRes.success && institutionRes.data ? institutionRes.data : [];
            const freshDaily = dailyRes.success && dailyRes.data ? dailyRes.data : [];
            const freshRecent = recentRes.success && recentRes.data ? recentRes.data : [];

            setState({
                kpis: freshKpis,
                monthly: freshMonthly,
                typeBreakdown: freshType,
                categoryBreakdown: freshCategory,
                institutionBreakdown: freshInstitution,
                dailyBreakdown: freshDaily,
                recent: freshRecent,
                loading: false,
                isStale: false,
                error: null,
            });

            // Persist to IndexedDB for offline access
            const key = getCacheKey();
            await Promise.all([
                freshKpis ? financialOfflineStore.kpi.set(key, freshKpis) : Promise.resolve(),
                financialOfflineStore.monthly.set(key, freshMonthly),
                financialOfflineStore.typeBreakdown.set(key, freshType),
                financialOfflineStore.categoryBreakdown.set(key, freshCategory),
                financialOfflineStore.institutionBreakdown.set(key, freshInstitution),
                financialOfflineStore.dailyBreakdown.set(key, freshDaily),
                financialOfflineStore.transactions.set(key, freshRecent),
            ]);
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: prev.isStale
                    ? "Es posible que no se tenga toda la información por falta de conexión."
                    : (err as Error).message,
            }));
        }
    }, [startDate, endDate, getCacheKey]);

    // Fetch when dates change
    useEffect(() => {
        currentDates.current = { startDate, endDate };
        
        (async () => {
            await loadCachedData();
            await fetchFreshData();
        })();
    }, [startDate, endDate, loadCachedData, fetchFreshData]);

    const refresh = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        await fetchFreshData();
    }, [fetchFreshData]);

    return { ...state, refresh };
}

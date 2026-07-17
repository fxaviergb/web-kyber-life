"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getFinancialKPIsAction,
    getMonthlyBreakdownAction,
    getTypeBreakdownAction,
    getCategoryBreakdownAction,
    getInstitutionBreakdownAction,
    getDailyBreakdownAction,
} from "@/app/actions/financial-dashboard";
import type { FinancialKPIs, MonthlyBreakdown, TypeBreakdown, CategoryBreakdown, InstitutionBreakdown, DailyBreakdown } from "@/application/services/financial-dashboard-service";

interface DashboardState {
    kpis: FinancialKPIs | null;
    monthly: MonthlyBreakdown[];
    typeBreakdown: TypeBreakdown[];
    categoryBreakdown: CategoryBreakdown[];
    institutionBreakdown: InstitutionBreakdown[];
    dailyBreakdown: DailyBreakdown[];
    loading: boolean;
    error: string | null;
}

const INITIAL_STATE: DashboardState = {
    kpis: null,
    monthly: [],
    typeBreakdown: [],
    categoryBreakdown: [],
    institutionBreakdown: [],
    dailyBreakdown: [],
    loading: true,
    error: null,
};

/**
 * Live financial dashboard hook. Always fetches fresh data from the backend via
 * server actions — no IndexedDB/offline cache. Refetches whenever the date range
 * changes or `refresh()` is called (e.g. from the realtime subscription).
 */
export function useFinancialDashboard(startDate?: string, endDate?: string) {
    const [state, setState] = useState<DashboardState>(INITIAL_STATE);

    const fetchData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const [kpiRes, monthlyRes, typeRes, categoryRes, institutionRes, dailyRes] = await Promise.all([
                getFinancialKPIsAction(startDate, endDate),
                getMonthlyBreakdownAction(6, startDate, endDate),
                getTypeBreakdownAction(startDate, endDate),
                getCategoryBreakdownAction(startDate, endDate),
                getInstitutionBreakdownAction(startDate, endDate),
                getDailyBreakdownAction(startDate, endDate),
            ]);

            setState({
                kpis: kpiRes.success && kpiRes.data ? kpiRes.data : null,
                monthly: monthlyRes.success && monthlyRes.data ? monthlyRes.data : [],
                typeBreakdown: typeRes.success && typeRes.data ? typeRes.data : [],
                categoryBreakdown: categoryRes.success && categoryRes.data ? categoryRes.data : [],
                institutionBreakdown: institutionRes.success && institutionRes.data ? institutionRes.data : [],
                dailyBreakdown: dailyRes.success && dailyRes.data ? dailyRes.data : [],
                loading: false,
                error: null,
            });
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: (err as Error).message,
            }));
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    return { ...state, refresh };
}

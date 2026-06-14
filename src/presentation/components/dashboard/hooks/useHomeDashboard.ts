"use client";

import { useCallback, useEffect, useState } from "react";
import { getDailyBreakdownAction, getCategoryBreakdownAction } from "@/app/actions/financial-dashboard";
import { getMarketDailySpendAction, getMarketTopProductsAction } from "@/app/actions/analytics";
import type { DailyBreakdown, CategoryBreakdown } from "@/application/services/financial-dashboard-service";

export interface HomeDashboardData {
    financialDaily: DailyBreakdown[];
    financialCategories: CategoryBreakdown[];
    marketDaily: { date: string; total: number }[];
    marketTopProducts: { id: string; name: string; value: number }[];
}

const EMPTY_DATA: HomeDashboardData = {
    financialDaily: [],
    financialCategories: [],
    marketDaily: [],
    marketTopProducts: [],
};

/**
 * Fetches every chart dataset for the main dashboard hub for a single shared
 * date range. Financial datasets come from the (Supabase-auth) financial
 * actions; market datasets from the range-aware, data-source-agnostic market
 * actions. Each source degrades independently — a failure leaves that section
 * empty rather than breaking the whole hub.
 */
export function useHomeDashboard(startDate?: string, endDate?: string) {
    const [data, setData] = useState<HomeDashboardData>(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [finDaily, finCat, mktDaily, mktTop] = await Promise.all([
                getDailyBreakdownAction(startDate, endDate),
                getCategoryBreakdownAction(startDate, endDate),
                getMarketDailySpendAction(startDate, endDate),
                getMarketTopProductsAction(startDate, endDate, 10),
            ]);

            setData({
                financialDaily: finDaily.success && finDaily.data ? finDaily.data : [],
                financialCategories: finCat.success && finCat.data ? finCat.data : [],
                marketDaily: mktDaily.success && mktDaily.data ? mktDaily.data : [],
                marketTopProducts: mktTop.success && mktTop.data ? mktTop.data : [],
            });

            if (!finDaily.success && !finCat.success && !mktDaily.success && !mktTop.success) {
                setError("No se pudieron cargar los datos del panel.");
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return { data, loading, error, refresh: fetchAll };
}

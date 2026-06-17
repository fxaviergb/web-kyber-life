"use server";

import { analyticsService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { resolveUserId } from "./_auth";

initializeContainer();

async function getUserId() {
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");
    if (!session || !session.value) throw new Error("Unauthorized");
    return session.value;
}

export async function getMonthlyExpensesAction(monthsBack: number = 6) {
    try {
        const userId = await getUserId();
        const data = await analyticsService.getMonthlyExpenses(userId, monthsBack);
        return { success: true, data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getCategorySpendingAction() {
    try {
        const userId = await getUserId();
        const data = await analyticsService.getCategorySpending(userId);
        return { success: true, data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getFrequentProductsAction(mode: 'count' | 'units') {
    try {
        const userId = await getUserId();
        const data = await analyticsService.getFrequentProducts(userId, mode);
        return { success: true, data };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ... existing code ...
export async function getPriceAnalyticsAction(brandProductId: string) {
    try {
        const userId = await resolveUserId();
        // Run parallel
        const [history, latest] = await Promise.all([
            analyticsService.getPriceHistory(userId, brandProductId),
            analyticsService.getLatestPrices(userId, brandProductId)
        ]);
        return { success: true, data: { history, latest } };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getGenericPriceAnalyticsAction(genericItemId: string) {
    try {
        const userId = await resolveUserId();
        const [history, latest] = await Promise.all([
            analyticsService.getGenericPriceHistory(userId, genericItemId),
            analyticsService.getGenericLatestPrices(userId, genericItemId)
        ]);
        return { success: true, data: { history, latest } };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ── Dashboard hub: range-aware market analytics (data-source-agnostic auth) ──

/** Daily market spend for a date range — powers the hub spend trend curve. */
export async function getMarketDailySpendAction(startDate?: string, endDate?: string) {
    try {
        const userId = await resolveUserId();
        const s = startDate ? new Date(startDate) : undefined;
        const e = endDate ? new Date(endDate) : undefined;
        const data = await analyticsService.getDailyExpenses(userId, s, e);
        return { success: true, data };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

/** Top products by amount spent for a date range — powers the hub bar chart. */
export async function getMarketTopProductsAction(startDate?: string, endDate?: string, limit: number = 8) {
    try {
        const userId = await resolveUserId();
        const s = startDate ? new Date(startDate) : undefined;
        const e = endDate ? new Date(endDate) : undefined;
        const data = await analyticsService.getTopSpendingProducts(userId, limit, s, e);
        return { success: true, data };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

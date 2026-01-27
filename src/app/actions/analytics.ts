"use server";

import { analyticsService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";

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
        const userId = await getUserId();
        // Run parallel
        const [history, latest] = await Promise.all([
            analyticsService.getPriceHistory(userId, brandProductId),
            analyticsService.getLatestPrices(userId, brandProductId)
        ]);
        return { success: true, data: { history, latest } };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getGenericPriceAnalyticsAction(genericItemId: string) {
    try {
        const userId = await getUserId();
        const [history, latest] = await Promise.all([
            analyticsService.getGenericPriceHistory(userId, genericItemId),
            analyticsService.getGenericLatestPrices(userId, genericItemId)
        ]);
        return { success: true, data: { history, latest } };
    } catch (e: any) {
        return { error: e.message };
    }
}

"use server";

import { financialDashboardService, initializeContainer } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/supabase/server";

async function getAuthUserId(): Promise<string> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.id) throw new Error("Unauthorized");
    return user.id;
}

export async function getFinancialKPIsAction() {
    try {
        const userId = await getAuthUserId();
        const data = await financialDashboardService.getKPIs(userId);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching financial KPIs:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getMonthlyBreakdownAction(monthsBack: number = 6) {
    try {
        const userId = await getAuthUserId();
        const data = await financialDashboardService.getMonthlyBreakdown(userId, monthsBack);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching monthly breakdown:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getTypeBreakdownAction() {
    try {
        const userId = await getAuthUserId();
        const data = await financialDashboardService.getTypeBreakdown(userId);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching type breakdown:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getRecentTransactionsAction(limit: number = 5) {
    try {
        const userId = await getAuthUserId();
        const data = await financialDashboardService.getRecentTransactions(userId, limit);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching recent transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

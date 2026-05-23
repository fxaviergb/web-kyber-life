"use server";

import { financialDashboardService } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/supabase/server";
import {
    monthlyBreakdownSchema,
    recentTransactionsSchema,
} from "@/lib/validators/financial-schemas";
import { z } from "zod";

async function getAuthUserId(): Promise<string> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.id) throw new Error("Unauthorized");
    return user.id;
}

function formatZodError(error: z.ZodError): string {
    return error.issues.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join("; ");
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
        const validated = monthlyBreakdownSchema.parse({ monthsBack });
        const userId = await getAuthUserId();
        const data = await financialDashboardService.getMonthlyBreakdown(userId, validated.monthsBack);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
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
        const validated = recentTransactionsSchema.parse({ limit });
        const userId = await getAuthUserId();
        const data = await financialDashboardService.getRecentTransactions(userId, validated.limit);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error fetching recent transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

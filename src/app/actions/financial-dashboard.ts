"use server";

import { financialDashboardService } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/supabase/server";
import {
    monthlyBreakdownSchema,
    recentTransactionsSchema,
    dateFilterSchema,
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

export async function getFinancialKPIsAction(startDate?: string, endDate?: string) {
    try {
        const validated = dateFilterSchema.parse({ startDate, endDate });
        const userId = await getAuthUserId();
        
        const sDate = validated.startDate ? new Date(validated.startDate) : undefined;
        const eDate = validated.endDate ? new Date(validated.endDate) : undefined;
        
        const data = await financialDashboardService.getKPIs(userId, sDate, eDate);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching financial KPIs:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getMonthlyBreakdownAction(monthsBack: number = 6, startDate?: string, endDate?: string) {
    try {
        const validated = monthlyBreakdownSchema.parse({ monthsBack, startDate, endDate });
        const userId = await getAuthUserId();
        
        const sDate = validated.startDate ? new Date(validated.startDate) : undefined;
        const eDate = validated.endDate ? new Date(validated.endDate) : undefined;
        
        const data = await financialDashboardService.getMonthlyBreakdown(userId, validated.monthsBack, sDate, eDate);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error fetching monthly breakdown:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getTypeBreakdownAction(startDate?: string, endDate?: string) {
    try {
        const validated = dateFilterSchema.parse({ startDate, endDate });
        const userId = await getAuthUserId();
        
        const sDate = validated.startDate ? new Date(validated.startDate) : undefined;
        const eDate = validated.endDate ? new Date(validated.endDate) : undefined;
        
        const data = await financialDashboardService.getTypeBreakdown(userId, sDate, eDate);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching type breakdown:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getRecentTransactionsAction(limit: number = 5, startDate?: string, endDate?: string) {
    try {
        const validated = recentTransactionsSchema.parse({ limit, startDate, endDate });
        const userId = await getAuthUserId();
        
        const sDate = validated.startDate ? new Date(validated.startDate) : undefined;
        const eDate = validated.endDate ? new Date(validated.endDate) : undefined;
        
        const data = await financialDashboardService.getRecentTransactions(userId, validated.limit, sDate, eDate);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error fetching recent transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getCategoryBreakdownAction(startDate?: string, endDate?: string) {
    try {
        const validated = dateFilterSchema.parse({ startDate, endDate });
        const userId = await getAuthUserId();
        
        const sDate = validated.startDate ? new Date(validated.startDate) : undefined;
        const eDate = validated.endDate ? new Date(validated.endDate) : undefined;
        
        const data = await financialDashboardService.getCategoryBreakdown(userId, sDate, eDate);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching category breakdown:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getInstitutionBreakdownAction(startDate?: string, endDate?: string) {
    try {
        const validated = dateFilterSchema.parse({ startDate, endDate });
        const userId = await getAuthUserId();
        
        const sDate = validated.startDate ? new Date(validated.startDate) : undefined;
        const eDate = validated.endDate ? new Date(validated.endDate) : undefined;
        
        const data = await financialDashboardService.getInstitutionBreakdown(userId, sDate, eDate);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching institution breakdown:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getDailyBreakdownAction(startDate?: string, endDate?: string) {
    try {
        const validated = dateFilterSchema.parse({ startDate, endDate });
        const userId = await getAuthUserId();
        
        const sDate = validated.startDate ? new Date(validated.startDate) : undefined;
        const eDate = validated.endDate ? new Date(validated.endDate) : undefined;
        
        const data = await financialDashboardService.getDailyBreakdown(userId, sDate, eDate);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching daily breakdown:", error);
        return { success: false, error: (error as Error).message };
    }
}


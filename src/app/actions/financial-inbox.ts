"use server";

import { financialInboxService } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/supabase/server";
import {
    mapInboxTransactionSchema,
    dismissInboxSchema,
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

/** Strip null values from an object, converting them to undefined for DTO compatibility. */
function stripNulls<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: Exclude<T[K], null> } {
    const result = { ...obj };
    for (const key of Object.keys(result)) {
        if (result[key] === null) {
            delete result[key];
        }
    }
    return result as { [K in keyof T]: Exclude<T[K], null> };
}

export async function getUnprocessedInboxTransactionsAction() {
    try {
        const userId = await getAuthUserId();
        const transactions = await financialInboxService.getUnprocessedTransactions(userId);
        return { success: true, data: transactions };
    } catch (error) {
        console.error("Error fetching inbox transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getScannerTransactionByIdAction(scannerTransactionId: string) {
    try {
        const userId = await getAuthUserId();
        const transaction = await financialInboxService.getScannerTransactionById(scannerTransactionId, userId);
        if (!transaction) {
            return { success: false, error: "Scanner transaction not found or unauthorized" };
        }
        return { success: true, data: transaction };
    } catch (error) {
        console.error("Error fetching scanner transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function mapInboxTransactionAction(data: Record<string, unknown>) {
    try {
        const validated = mapInboxTransactionSchema.parse(data);
        const userId = await getAuthUserId();

        const result = await financialInboxService.mapAndConfirmTransaction({
            ...stripNulls(validated),
            userId,
        });
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error mapping transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function dismissInboxTransactionAction(scannerTransactionId: string) {
    try {
        const validated = dismissInboxSchema.parse({ scannerTransactionId });
        const userId = await getAuthUserId();
        await financialInboxService.dismissTransaction(validated.scannerTransactionId, userId);
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error dismissing transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

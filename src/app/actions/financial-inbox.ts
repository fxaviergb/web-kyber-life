"use server";

import { financialInboxService } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/supabase/server";
import { MapScannerTransactionDTO } from "@/application/services/financial-inbox-service";

async function getAuthUserId(): Promise<string> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.id) throw new Error("Unauthorized");
    return user.id;
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

export async function mapInboxTransactionAction(data: Omit<MapScannerTransactionDTO, 'userId'>) {
    try {
        const userId = await getAuthUserId();
        const dto: MapScannerTransactionDTO = {
            ...data,
            userId,
        };

        const result = await financialInboxService.mapAndConfirmTransaction(dto);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error mapping transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function dismissInboxTransactionAction(scannerTransactionId: string) {
    try {
        const userId = await getAuthUserId();
        await financialInboxService.dismissTransaction(scannerTransactionId, userId);
        return { success: true };
    } catch (error) {
        console.error("Error dismissing transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

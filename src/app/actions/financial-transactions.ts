"use server";

import { financialTransactionService } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/supabase/server";
import { CreateFinancialTransactionDTO } from "@/application/services/financial-transaction-service";

async function getAuthUserId(): Promise<string> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.id) throw new Error("Unauthorized");
    return user.id;
}

export async function searchTransactionsAction(params: { query?: string; status?: string; type?: string }) {
    try {
        const userId = await getAuthUserId();
        const result = await financialTransactionService.getTransactionsByUser(userId);

        // Client-side filtering (lightweight for now; could move to repo for large datasets)
        let filtered = result;
        if (params.query) {
            const q = params.query.toLowerCase();
            filtered = filtered.filter(t =>
                (t.merchant ?? "").toLowerCase().includes(q) ||
                (t.notes ?? "").toLowerCase().includes(q)
            );
        }
        if (params.status) {
            filtered = filtered.filter(t => t.status === params.status);
        }
        if (params.type) {
            filtered = filtered.filter(t => t.type === params.type);
        }

        return { success: true, data: filtered };
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getTransactionByIdAction(id: string) {
    try {
        const userId = await getAuthUserId();
        const transaction = await financialTransactionService.getTransactionById(id);

        if (!transaction) {
            return { success: false, error: "Transaction not found" };
        }

        if (transaction.ownerUserId !== userId) {
            return { success: false, error: "Unauthorized access to transaction" };
        }

        return { success: true, data: transaction };
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function createTransactionAction(data: Omit<CreateFinancialTransactionDTO, 'ownerUserId'>) {
    try {
        const userId = await getAuthUserId();
        const dto: CreateFinancialTransactionDTO = {
            ...data,
            ownerUserId: userId,
        };

        const result = await financialTransactionService.createTransaction(dto);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getAuditTrailAction(transactionId: string) {
    try {
        const userId = await getAuthUserId();

        // Verify ownership first
        const tx = await financialTransactionService.getTransactionById(transactionId);
        if (!tx || tx.ownerUserId !== userId) {
            return { success: false, error: "Transaction not found or unauthorized" };
        }

        const auditLogs = await financialTransactionService.getAuditTrail(transactionId);
        return { success: true, data: auditLogs };
    } catch (error) {
        console.error("Error fetching audit trail:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function markAsDuplicateAction(transactionId: string, duplicateOfId: string) {
    try {
        const userId = await getAuthUserId();
        const result = await financialTransactionService.markAsDuplicate(transactionId, duplicateOfId, userId);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error marking duplicate:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function resolveDuplicateAction(transactionId: string) {
    try {
        const userId = await getAuthUserId();
        const result = await financialTransactionService.resolveDuplicate(transactionId, userId);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error resolving duplicate:", error);
        return { success: false, error: (error as Error).message };
    }
}

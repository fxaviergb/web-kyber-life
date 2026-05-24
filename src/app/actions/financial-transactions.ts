"use server";

import { financialTransactionService } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/supabase/server";
import {
    createTransactionSchema,
    searchTransactionsSchema,
    paginatedSearchSchema,
    markDuplicateSchema,
    transactionIdSchema,
    updateTransactionSchema,
    bulkActionSchema,
    bulkCategorizeSchema,
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

// ─── Search / List ───────────────────────────────────────────

export async function searchTransactionsAction(params: { query?: string; status?: string; type?: string }) {
    try {
        const validated = searchTransactionsSchema.parse(params);
        const userId = await getAuthUserId();
        const result = await financialTransactionService.getTransactionsByUser(userId);

        let filtered = result;
        if (validated.query) {
            const q = validated.query.toLowerCase();
            filtered = filtered.filter(t =>
                (t.merchant ?? "").toLowerCase().includes(q) ||
                (t.notes ?? "").toLowerCase().includes(q)
            );
        }
        if (validated.status) {
            filtered = filtered.filter(t => t.status === validated.status);
        } else {
            filtered = filtered.filter(t => t.status !== 'DELETED' && t.status !== 'ARCHIVED');
        }
        if (validated.type) {
            filtered = filtered.filter(t => t.type === validated.type);
        }

        return { success: true, data: filtered };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error fetching transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Paginated Search ────────────────────────────────────────

export async function searchPaginatedTransactionsAction(params: Record<string, unknown>) {
    try {
        const validated = paginatedSearchSchema.parse(params);
        const userId = await getAuthUserId();

        const { page, pageSize, ...filters } = validated;
        const result = await financialTransactionService.searchPaginated(
            userId,
            filters,
            { page, pageSize },
        );

        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error in paginated search:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Get By ID ───────────────────────────────────────────────

export async function getTransactionByIdAction(id: string) {
    try {
        const validatedId = transactionIdSchema.parse(id);
        const userId = await getAuthUserId();
        const transaction = await financialTransactionService.getTransactionById(validatedId);

        if (!transaction) {
            return { success: false, error: "Transaction not found" };
        }

        if (transaction.ownerUserId !== userId) {
            return { success: false, error: "Unauthorized access to transaction" };
        }

        return { success: true, data: transaction };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error fetching transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Create ──────────────────────────────────────────────────

export async function createTransactionAction(data: Record<string, unknown>) {
    try {
        const validated = createTransactionSchema.parse(data);
        const userId = await getAuthUserId();

        const result = await financialTransactionService.createTransaction({
            ...validated,
            ownerUserId: userId,
        });
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error creating transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Audit Trail ─────────────────────────────────────────────

export async function getAuditTrailAction(transactionId: string) {
    try {
        const validatedId = transactionIdSchema.parse(transactionId);
        const userId = await getAuthUserId();

        const tx = await financialTransactionService.getTransactionById(validatedId);
        if (!tx || tx.ownerUserId !== userId) {
            return { success: false, error: "Transaction not found or unauthorized" };
        }

        const auditLogs = await financialTransactionService.getAuditTrail(validatedId);
        return { success: true, data: auditLogs };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error fetching audit trail:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Duplicate Operations ────────────────────────────────────

export async function markAsDuplicateAction(transactionId: string, duplicateOfId: string) {
    try {
        const validated = markDuplicateSchema.parse({ transactionId, duplicateOfId });
        const userId = await getAuthUserId();
        const result = await financialTransactionService.markAsDuplicate(
            validated.transactionId, validated.duplicateOfId, userId
        );
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error marking duplicate:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function resolveDuplicateAction(transactionId: string) {
    try {
        const validatedId = transactionIdSchema.parse(transactionId);
        const userId = await getAuthUserId();
        const result = await financialTransactionService.resolveDuplicate(validatedId, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error resolving duplicate:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Workflow Transitions ────────────────────────────────────

export async function reviewTransactionAction(transactionId: string) {
    try {
        const validatedId = transactionIdSchema.parse(transactionId);
        const userId = await getAuthUserId();
        const result = await financialTransactionService.reviewTransaction(validatedId, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error reviewing transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function rejectTransactionAction(transactionId: string) {
    try {
        const validatedId = transactionIdSchema.parse(transactionId);
        const userId = await getAuthUserId();
        const result = await financialTransactionService.rejectTransaction(validatedId, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error rejecting transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function archiveTransactionAction(transactionId: string) {
    try {
        const validatedId = transactionIdSchema.parse(transactionId);
        const userId = await getAuthUserId();
        const result = await financialTransactionService.archiveTransaction(validatedId, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error archiving transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function softDeleteTransactionAction(transactionId: string) {
    try {
        const validatedId = transactionIdSchema.parse(transactionId);
        const userId = await getAuthUserId();
        const result = await financialTransactionService.softDeleteTransaction(validatedId, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error deleting transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Update ──────────────────────────────────────────────────

export async function updateTransactionAction(id: string, data: Record<string, unknown>) {
    try {
        const validated = updateTransactionSchema.parse({ ...data, id });
        const userId = await getAuthUserId();

        const { id: txId, ...updateData } = validated;
        const result = await financialTransactionService.updateTransaction(txId, userId, updateData);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error updating transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

// ─── Bulk Operations ─────────────────────────────────────────

export async function bulkConfirmTransactionsAction(ids: string[]) {
    try {
        const validated = bulkActionSchema.parse({ ids });
        const userId = await getAuthUserId();
        const result = await financialTransactionService.bulkConfirmTransactions(validated.ids, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error bulk confirming transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkRejectTransactionsAction(ids: string[]) {
    try {
        const validated = bulkActionSchema.parse({ ids });
        const userId = await getAuthUserId();
        const result = await financialTransactionService.bulkRejectTransactions(validated.ids, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error bulk rejecting transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkArchiveTransactionsAction(ids: string[]) {
    try {
        const validated = bulkActionSchema.parse({ ids });
        const userId = await getAuthUserId();
        const result = await financialTransactionService.bulkArchiveTransactions(validated.ids, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error bulk archiving transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkDeleteTransactionsAction(ids: string[]) {
    try {
        const validated = bulkActionSchema.parse({ ids });
        const userId = await getAuthUserId();
        const result = await financialTransactionService.bulkDeleteTransactions(validated.ids, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error bulk deleting transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkCategorizeTransactionsAction(ids: string[], categoryId: string) {
    try {
        const validated = bulkCategorizeSchema.parse({ ids, categoryId });
        const userId = await getAuthUserId();
        const result = await financialTransactionService.bulkCategorizeTransactions(validated.ids, validated.categoryId, userId);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error bulk categorizing transactions:", error);
        return { success: false, error: (error as Error).message };
    }
}

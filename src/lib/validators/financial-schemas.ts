import { z } from "zod";

// ─── Enums as Zod types ──────────────────────────────────────

const TRANSACTION_TYPES = [
    'EXPENSE', 'INCOME', 'TRANSFER', 'SUBSCRIPTION', 'PAYMENT',
    'REFUND', 'WITHDRAWAL', 'DEPOSIT', 'FEE', 'TAX', 'OTHER',
] as const;

const TRANSACTION_STATUSES = [
    'DETECTED', 'REVIEWED', 'CONFIRMED', 'REJECTED',
    'DUPLICATE', 'ARCHIVED', 'MANUAL', 'DELETED',
] as const;

export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);
export const transactionStatusSchema = z.enum(TRANSACTION_STATUSES);

// ─── Create Transaction ──────────────────────────────────────

export const createTransactionSchema = z.object({
    type: transactionTypeSchema,
    status: transactionStatusSchema.optional(),
    amount: z.number().positive("Amount must be positive"),
    currency: z.string().min(3, "Currency code required").max(3, "Use ISO 4217 code"),
    date: z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: "Invalid date format. Use ISO 8601" },
    ),
    merchant: z.string().max(255).optional().nullable(),
    categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
    institutionId: z.string().uuid("Invalid institution ID").optional().nullable(),
    accountId: z.string().uuid("Invalid account ID").optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    executionId: z.string().uuid("Invalid execution ID").optional().nullable(),
    originalAmount: z.number().positive().optional().nullable(),
    originStats: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// ─── Search / List Transactions ──────────────────────────────

export const searchTransactionsSchema = z.object({
    query: z.string().max(200).optional(),
    status: transactionStatusSchema.optional(),
    type: transactionTypeSchema.optional(),
});

export type SearchTransactionsInput = z.infer<typeof searchTransactionsSchema>;

// ─── Paginated Search ────────────────────────────────────────

export const paginatedSearchSchema = z.object({
    query: z.string().max(200).optional(),
    status: transactionStatusSchema.optional(),
    type: transactionTypeSchema.optional(),
    categoryId: z.string().uuid().optional(),
    institutionId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    dateFrom: z.string().refine(v => !v || !isNaN(Date.parse(v)), "Invalid dateFrom").optional(),
    dateTo: z.string().refine(v => !v || !isNaN(Date.parse(v)), "Invalid dateTo").optional(),
    amountMin: z.number().nonnegative().optional(),
    amountMax: z.number().nonnegative().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
});

export type PaginatedSearchInput = z.infer<typeof paginatedSearchSchema>;

// ─── Duplicate Operations ────────────────────────────────────

export const markDuplicateSchema = z.object({
    transactionId: z.string().uuid("Invalid transaction ID"),
    duplicateOfId: z.string().uuid("Invalid duplicate-of ID"),
});

export type MarkDuplicateInput = z.infer<typeof markDuplicateSchema>;

// ─── Workflow Transitions ────────────────────────────────────

export const transactionIdSchema = z.string().uuid("Invalid transaction ID");

// ─── Dashboard Params ────────────────────────────────────────

export const monthlyBreakdownSchema = z.object({
    monthsBack: z.number().int().min(1).max(24).default(6),
});

export const recentTransactionsSchema = z.object({
    limit: z.number().int().min(1).max(50).default(5),
});

// ─── Inbox Operations ────────────────────────────────────────

export const mapInboxTransactionSchema = z.object({
    scannerTransactionId: z.string().uuid("Invalid scanner transaction ID"),
    categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
    institutionId: z.string().uuid("Invalid institution ID").optional().nullable(),
    accountId: z.string().uuid("Invalid account ID").optional().nullable(),
    type: transactionTypeSchema.optional(),
    notes: z.string().max(2000).optional().nullable(),
    merchant: z.string().max(255).optional().nullable(),
});

export type MapInboxTransactionInput = z.infer<typeof mapInboxTransactionSchema>;

export const dismissInboxSchema = z.object({
    scannerTransactionId: z.string().uuid("Invalid scanner transaction ID"),
});

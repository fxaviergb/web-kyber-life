import type { FinancialTransactionStatus, FinancialTransactionType } from "./entities/financial";
import type { UUID } from "./core";

// ─── Pagination ──────────────────────────────────────────────

export interface PaginationParams {
    /** 1-based page number */
    page: number;
    /** Items per page */
    pageSize: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

// ─── Financial Transaction Filters ───────────────────────────

export interface TransactionSearchFilters {
    query?: string;
    status?: FinancialTransactionStatus;
    type?: FinancialTransactionType;
    categoryId?: UUID;
    institutionId?: UUID;
    accountId?: UUID;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
    tags?: string[];
}

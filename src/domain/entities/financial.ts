import { BaseEntity, UUID, ISODate } from "../core";

export type FinancialTransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'SUBSCRIPTION' | 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'DEPOSIT' | 'FEE' | 'TAX' | 'OTHER';
export type FinancialTransactionStatus = 'DETECTED' | 'REVIEWED' | 'CONFIRMED' | 'REJECTED' | 'DUPLICATE' | 'ARCHIVED' | 'MANUAL' | 'DELETED';
export type FinancialScanStatus = 'PROCESSING' | 'FAILED' | 'COMPLETED';

export interface FinancialInstitution extends BaseEntity {
    ownerUserId: UUID;
    name: string;
    logoUrl?: string | null;
}

export interface FinancialAccount extends BaseEntity {
    ownerUserId: UUID;
    institutionId?: UUID | null;
    name: string;
    accountType?: string | null;
    lastFour?: string | null;
    currency: string;
}

export interface FinancialCategory extends BaseEntity {
    ownerUserId?: UUID | null;
    name: string;
    color?: string | null;
    icon?: string | null;
    parentId?: UUID | null;
}

export interface FinancialScanExecution extends BaseEntity {
    ownerUserId: UUID;
    status: FinancialScanStatus;
    source: string;
    stats?: Record<string, any> | null;
    startedAt: ISODate;
    completedAt?: ISODate | null;
    errorDetails?: string | null;
}

export interface FinancialTransaction extends BaseEntity {
    ownerUserId: UUID;
    type: FinancialTransactionType;
    status: FinancialTransactionStatus;
    amount: number;
    originalAmount?: number | null;
    currency: string;
    merchant?: string | null;
    categoryId?: UUID | null;
    institutionId?: UUID | null;
    accountId?: UUID | null;
    tags?: string[] | null;
    notes?: string | null;
    possibleDuplicate: boolean;
    executionId?: UUID | null;
    originStats?: Record<string, any> | null;
    date: ISODate;
}

export interface FinancialScannerTransaction extends BaseEntity {
    ownerUserId: UUID;
    executionId?: UUID | null;
    rawText?: string | null;
    extractedAmount?: number | null;
    extractedDate?: ISODate | null;
    extractedMerchant?: string | null;
    extractedBank?: string | null;
    extractedAccountLastFour?: string | null;
    extractedType?: string | null;
    isProcessed: boolean;
    errorMessage?: string | null;
}

export interface FinancialTransactionAuditLog extends BaseEntity {
    transactionId: UUID;
    changedByUserId: UUID;
    action: string;
    previousState?: Record<string, any> | null;
    newState?: Record<string, any> | null;
}

import { UUID } from "../core";
import { IRepository } from "./index";
import { PaginationParams, PaginatedResult, TransactionSearchFilters } from "../pagination";
import {
    FinancialTransaction,
    FinancialScanExecution,
    FinancialScannerTransaction,
    FinancialInstitution,
    FinancialAccount,
    FinancialCategory,
    FinancialTransactionAuditLog
} from "../entities/financial";

export interface IFinancialTransactionRepository extends IRepository<FinancialTransaction> {
    findByOwnerId(userId: UUID): Promise<FinancialTransaction[]>;
    findRecent(userId: UUID, limit: number): Promise<FinancialTransaction[]>;
    search(userId: UUID, query: string, filters?: TransactionSearchFilters): Promise<FinancialTransaction[]>;
    findPaginated(userId: UUID, filters: TransactionSearchFilters, pagination: PaginationParams): Promise<PaginatedResult<FinancialTransaction>>;
    getUniqueTags(userId: UUID): Promise<string[]>;
}

export interface IFinancialScanExecutionRepository extends IRepository<FinancialScanExecution> {
    findByOwnerId(userId: UUID): Promise<FinancialScanExecution[]>;
    findLatestBySource(userId: UUID, source: string): Promise<FinancialScanExecution | null>;
}

export interface IFinancialScannerTransactionRepository extends IRepository<FinancialScannerTransaction> {
    findUnprocessedByOwnerId(userId: UUID): Promise<FinancialScannerTransaction[]>;
}


export interface IFinancialInstitutionRepository extends IRepository<FinancialInstitution> {
    findByOwnerId(userId: UUID): Promise<FinancialInstitution[]>;
}

export interface IFinancialAccountRepository extends IRepository<FinancialAccount> {
    findByOwnerId(userId: UUID): Promise<FinancialAccount[]>;
    findByInstitutionId(institutionId: UUID): Promise<FinancialAccount[]>;
}

export interface IFinancialCategoryRepository extends IRepository<FinancialCategory> {
    findAllBaseAndUser(userId: UUID): Promise<FinancialCategory[]>;
}

export interface IFinancialTransactionAuditLogRepository extends IRepository<FinancialTransactionAuditLog> {
    findByTransactionId(transactionId: UUID): Promise<FinancialTransactionAuditLog[]>;
}

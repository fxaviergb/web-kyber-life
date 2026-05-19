import { UUID } from "../../domain/core";
import { FinancialTransaction, FinancialTransactionType, FinancialTransactionStatus } from "../../domain/entities/financial";
import { IFinancialTransactionRepository, IFinancialTransactionAuditLogRepository } from "../../domain/repositories/financial";
import { findDuplicates } from "../../domain/services/financial-deduplication";

export interface CreateFinancialTransactionDTO {
    ownerUserId: UUID;
    type: FinancialTransactionType;
    status?: FinancialTransactionStatus;
    amount: number;
    currency: string;
    date: string; // ISODate
    merchant?: string;
    categoryId?: UUID;
    institutionId?: UUID;
    accountId?: UUID;
    tags?: string[];
    notes?: string;
    executionId?: UUID;
    originalAmount?: number;
    originStats?: Record<string, any>;
}

export class FinancialTransactionService {
    constructor(
        private transactionRepo: IFinancialTransactionRepository,
        private auditLogRepo: IFinancialTransactionAuditLogRepository
    ) {}

    async createTransaction(dto: CreateFinancialTransactionDTO): Promise<FinancialTransaction> {
        // Deduplication check
        const existingTransactions = await this.transactionRepo.findByOwnerId(dto.ownerUserId);
        const duplicateIds = findDuplicates(dto, existingTransactions);
        const hasDuplicate = duplicateIds.length > 0;

        const now = new Date().toISOString();
        const transaction: FinancialTransaction = {
            id: crypto.randomUUID(),
            ownerUserId: dto.ownerUserId,
            type: dto.type,
            status: dto.status ?? 'DETECTED',
            amount: dto.amount,
            currency: dto.currency,
            date: dto.date,
            merchant: dto.merchant ?? null,
            categoryId: dto.categoryId ?? null,
            institutionId: dto.institutionId ?? null,
            accountId: dto.accountId ?? null,
            tags: dto.tags ?? null,
            notes: dto.notes ?? null,
            possibleDuplicate: hasDuplicate,
            executionId: dto.executionId ?? null,
            originalAmount: dto.originalAmount ?? null,
            originStats: dto.originStats ?? null,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        };

        const created = await this.transactionRepo.create(transaction);

        const auditAction = hasDuplicate ? 'CREATED_WITH_DUPLICATE_FLAG' : 'CREATED';
        await this.auditLogRepo.create({
            id: crypto.randomUUID(),
            transactionId: created.id!,
            changedByUserId: created.ownerUserId,
            action: auditAction,
            newState: {
                ...(created as unknown as Record<string, any>),
                ...(hasDuplicate ? { duplicateOfIds: duplicateIds } : {}),
            },
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        });

        return created;
    }

    async markAsDuplicate(transactionId: UUID, duplicateOfId: UUID, userId: UUID): Promise<FinancialTransaction> {
        const tx = await this.transactionRepo.findById(transactionId);
        if (!tx || tx.ownerUserId !== userId) {
            throw new Error("Transaction not found or unauthorized");
        }

        const previousState = { ...tx } as unknown as Record<string, any>;
        tx.status = 'DUPLICATE';
        tx.possibleDuplicate = true;
        tx.updatedAt = new Date().toISOString();

        const updated = await this.transactionRepo.update(tx);

        await this.auditLogRepo.create({
            id: crypto.randomUUID(),
            transactionId: updated.id!,
            changedByUserId: userId,
            action: 'MARKED_DUPLICATE',
            previousState,
            newState: {
                ...(updated as unknown as Record<string, any>),
                duplicateOfId,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
        });

        return updated;
    }

    async resolveDuplicate(transactionId: UUID, userId: UUID): Promise<FinancialTransaction> {
        const tx = await this.transactionRepo.findById(transactionId);
        if (!tx || tx.ownerUserId !== userId) {
            throw new Error("Transaction not found or unauthorized");
        }

        const previousState = { ...tx } as unknown as Record<string, any>;
        tx.possibleDuplicate = false;
        tx.status = 'CONFIRMED';
        tx.updatedAt = new Date().toISOString();

        const updated = await this.transactionRepo.update(tx);

        await this.auditLogRepo.create({
            id: crypto.randomUUID(),
            transactionId: updated.id!,
            changedByUserId: userId,
            action: 'DUPLICATE_RESOLVED',
            previousState,
            newState: updated as unknown as Record<string, any>,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
        });

        return updated;
    }

    async getTransactionsByUser(userId: UUID): Promise<FinancialTransaction[]> {
        return this.transactionRepo.findByOwnerId(userId);
    }

    async getTransactionById(id: string): Promise<FinancialTransaction | null> {
        return this.transactionRepo.findById(id);
    }

    async getAuditTrail(transactionId: UUID): Promise<any[]> {
        return this.auditLogRepo.findByTransactionId(transactionId);
    }
}

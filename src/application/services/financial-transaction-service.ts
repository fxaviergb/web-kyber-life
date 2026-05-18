import { UUID } from "../../domain/core";
import { FinancialTransaction, FinancialTransactionType, FinancialTransactionStatus } from "../../domain/entities/financial";
import { IFinancialTransactionRepository, IFinancialTransactionAuditLogRepository } from "../../domain/repositories/financial";

export interface CreateFinancialTransactionDTO {
    ownerUserId: UUID;
    type: FinancialTransactionType;
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
        const transaction: FinancialTransaction = {
            id: crypto.randomUUID(),
            ownerUserId: dto.ownerUserId,
            type: dto.type,
            status: 'DETECTED', // default status
            amount: dto.amount,
            currency: dto.currency,
            date: dto.date,
            merchant: dto.merchant ?? null,
            categoryId: dto.categoryId ?? null,
            institutionId: dto.institutionId ?? null,
            accountId: dto.accountId ?? null,
            tags: dto.tags ?? null,
            notes: dto.notes ?? null,
            possibleDuplicate: false, // Logic to detect duplicates can be added here
            executionId: dto.executionId ?? null,
            originalAmount: dto.originalAmount ?? null,
            originStats: dto.originStats ?? null,
        };

        const created = await this.transactionRepo.create(transaction);

        await this.auditLogRepo.create({
            id: crypto.randomUUID(),
            transactionId: created.id!,
            changedByUserId: created.ownerUserId,
            action: 'CREATED',
            newState: created as unknown as Record<string, any>
        });

        return created;
    }

    async getTransactionsByUser(userId: UUID): Promise<FinancialTransaction[]> {
        return this.transactionRepo.findByOwnerId(userId);
    }
    
    // More methods like updateStatus, flagAsDuplicate, etc. will be added here
}

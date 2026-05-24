import { UUID } from "../../domain/core";
import { FinancialScannerTransaction, FinancialTransaction } from "../../domain/entities/financial";
import { IFinancialScannerTransactionRepository, IFinancialTransactionRepository, IFinancialTransactionAuditLogRepository } from "../../domain/repositories/financial";

export interface MapScannerTransactionDTO {
    scannerTransactionId: UUID;
    userId: UUID;
    categoryId?: UUID;
    institutionId?: UUID;
    accountId?: UUID;
    type?: FinancialTransaction['type'];
    notes?: string;
    merchant?: string;
}

export class FinancialInboxService {
    constructor(
        private scannerRepo: IFinancialScannerTransactionRepository,
        private transactionRepo: IFinancialTransactionRepository,
        private auditLogRepo: IFinancialTransactionAuditLogRepository
    ) {}

    async getUnprocessedTransactions(userId: UUID): Promise<FinancialScannerTransaction[]> {
        return this.scannerRepo.findUnprocessedByOwnerId(userId);
    }

    async mapAndConfirmTransaction(dto: MapScannerTransactionDTO): Promise<FinancialTransaction> {
        const scannerTx = await this.scannerRepo.findById(dto.scannerTransactionId);
        if (!scannerTx || scannerTx.ownerUserId !== dto.userId) {
            throw new Error("Scanner transaction not found or unauthorized");
        }

        if (scannerTx.status !== 'DETECTED' && scannerTx.status !== 'IN_REVIEW') {
            throw new Error("This scanner transaction has already been processed");
        }

        // Create the definitive transaction
        const now = new Date().toISOString();
        
        // Map types correctly or fallback
        const transactionType = dto.type ?? (scannerTx.type as FinancialTransaction['type']) ?? 'EXPENSE';
        
        const isValidUuid = (id: string | null | undefined) => {
            if (!id) return false;
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        };

        const validExecutionId = isValidUuid(scannerTx.executionId) ? scannerTx.executionId : undefined;

        const transaction: FinancialTransaction = {
            id: crypto.randomUUID(),
            ownerUserId: dto.userId,
            type: transactionType,
            status: 'CONFIRMED',
            amount: scannerTx.amount || 0,
            originalAmount: scannerTx.amount,
            currency: scannerTx.currency || 'USD',
            merchant: dto.merchant ?? scannerTx.merchant ?? null,
            categoryId: dto.categoryId ?? null,
            institutionId: dto.institutionId ?? null,
            accountId: dto.accountId ?? null,
            tags: [],
            notes: dto.notes ?? scannerTx.description ?? null,
            possibleDuplicate: false,
            executionId: validExecutionId,
            originStats: {
                ...((scannerTx.originStats as Record<string, unknown>) || {}),
                originalExecutionId: scannerTx.executionId, // Preserve the original non-UUID execution ID for debugging
            },
            date: scannerTx.date || now,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        };

        const createdTx = await this.transactionRepo.create(transaction);

        // Audit Log
        await this.auditLogRepo.create({
            id: crypto.randomUUID(),
            transactionId: createdTx.id!,
            changedByUserId: dto.userId,
            action: 'MAPPED_FROM_INBOX',
            newState: createdTx as any,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        });

        // Mark scanner transaction as processed
        scannerTx.status = 'APPROVED';
        scannerTx.updatedAt = new Date().toISOString();
        await this.scannerRepo.update(scannerTx);

        return createdTx;
    }

    async dismissTransaction(scannerTransactionId: UUID, userId: UUID): Promise<void> {
        const scannerTx = await this.scannerRepo.findById(scannerTransactionId);
        if (!scannerTx || scannerTx.ownerUserId !== userId) {
            throw new Error("Scanner transaction not found or unauthorized");
        }

        scannerTx.status = 'REJECTED';
        scannerTx.description = (scannerTx.description ? scannerTx.description + " | " : "") + "Dismissed by user";
        scannerTx.updatedAt = new Date().toISOString();
        await this.scannerRepo.update(scannerTx);
    }
}

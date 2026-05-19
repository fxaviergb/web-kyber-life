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

        if (scannerTx.isProcessed) {
            throw new Error("This scanner transaction has already been processed");
        }

        // Create the definitive transaction
        const now = new Date().toISOString();
        const transaction: FinancialTransaction = {
            id: crypto.randomUUID(),
            ownerUserId: dto.userId,
            type: dto.type ?? (scannerTx.extractedType as any) ?? 'EXPENSE',
            status: 'CONFIRMED',
            amount: scannerTx.extractedAmount || 0,
            originalAmount: scannerTx.extractedAmount,
            currency: 'USD',
            merchant: dto.merchant ?? scannerTx.extractedMerchant ?? null,
            categoryId: dto.categoryId ?? null,
            institutionId: dto.institutionId ?? null,
            accountId: dto.accountId ?? null,
            tags: [],
            notes: dto.notes ?? null,
            possibleDuplicate: false,
            executionId: scannerTx.executionId,
            originStats: {
                rawText: scannerTx.rawText,
                scannerTxId: scannerTx.id,
                extractedBank: scannerTx.extractedBank,
                extractedAccountLastFour: scannerTx.extractedAccountLastFour
            },
            date: scannerTx.extractedDate || now,
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
        scannerTx.isProcessed = true;
        scannerTx.updatedAt = new Date().toISOString();
        await this.scannerRepo.update(scannerTx);

        return createdTx;
    }

    async dismissTransaction(scannerTransactionId: UUID, userId: UUID): Promise<void> {
        const scannerTx = await this.scannerRepo.findById(scannerTransactionId);
        if (!scannerTx || scannerTx.ownerUserId !== userId) {
            throw new Error("Scanner transaction not found or unauthorized");
        }

        scannerTx.isProcessed = true;
        scannerTx.errorMessage = "Dismissed by user";
        scannerTx.updatedAt = new Date().toISOString();
        await this.scannerRepo.update(scannerTx);
    }
}

import { UUID } from "../../domain/core";
import { FinancialTransaction, FinancialTransactionType, FinancialTransactionStatus } from "../../domain/entities/financial";
import { IFinancialTransactionRepository, IFinancialTransactionAuditLogRepository } from "../../domain/repositories/financial";
import { findDuplicates } from "../../domain/services/financial-deduplication";
import { PaginationParams, PaginatedResult, TransactionSearchFilters } from "../../domain/pagination";

export interface CreateFinancialTransactionDTO {
    ownerUserId: UUID;
    type: FinancialTransactionType;
    status?: FinancialTransactionStatus;
    amount: number;
    currency: string;
    date: string; // ISODate
    merchant?: string | null;
    categoryId?: UUID | null;
    institutionId?: UUID | null;
    accountId?: UUID | null;
    tags?: string[] | null;
    notes?: string | null;
    executionId?: UUID | null;
    originalAmount?: number | null;
    originStats?: Record<string, unknown> | null;
}

// ─── Valid Workflow Transitions ───────────────────────────────

const VALID_TRANSITIONS: Record<FinancialTransactionStatus, readonly FinancialTransactionStatus[]> = {
    DETECTED:  ['REVIEWED', 'CONFIRMED', 'REJECTED', 'ARCHIVED', 'DELETED'],
    REVIEWED:  ['CONFIRMED', 'REJECTED', 'ARCHIVED', 'DELETED'],
    CONFIRMED: ['ARCHIVED', 'DELETED'],
    REJECTED:  ['DETECTED', 'DELETED'],
    MANUAL:    ['CONFIRMED', 'ARCHIVED', 'DELETED'],
    DUPLICATE: ['CONFIRMED', 'DELETED'],
    ARCHIVED:  ['DETECTED'],
    DELETED:   [],
} as const;

function assertValidTransition(
    currentStatus: FinancialTransactionStatus,
    targetStatus: FinancialTransactionStatus,
): void {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed.includes(targetStatus)) {
        throw new Error(
            `Invalid transition: cannot move from "${currentStatus}" to "${targetStatus}". ` +
            `Allowed: [${allowed.join(", ")}]`,
        );
    }
}

// ─── Service ─────────────────────────────────────────────────

export class FinancialTransactionService {
    constructor(
        private transactionRepo: IFinancialTransactionRepository,
        private auditLogRepo: IFinancialTransactionAuditLogRepository
    ) {}

    // ── Create ───────────────────────────────────────────────

    async createTransaction(dto: CreateFinancialTransactionDTO): Promise<FinancialTransaction> {
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
        await this.writeAuditLog(created.id!, created.ownerUserId, auditAction, undefined, {
            ...(created as unknown as Record<string, unknown>),
            ...(hasDuplicate ? { duplicateOfIds: duplicateIds } : {}),
        });

        return created;
    }

    // ── Duplicate Operations ─────────────────────────────────

    async markAsDuplicate(transactionId: UUID, duplicateOfId: UUID, userId: UUID): Promise<FinancialTransaction> {
        const tx = await this.findOwnedTransactionOrThrow(transactionId, userId);
        const previousState = { ...tx } as unknown as Record<string, unknown>;

        tx.status = 'DUPLICATE';
        tx.possibleDuplicate = true;
        tx.updatedAt = new Date().toISOString();

        const updated = await this.transactionRepo.update(tx);

        await this.writeAuditLog(updated.id!, userId, 'MARKED_DUPLICATE', previousState, {
            ...(updated as unknown as Record<string, unknown>),
            duplicateOfId,
        });

        return updated;
    }

    async resolveDuplicate(transactionId: UUID, userId: UUID): Promise<FinancialTransaction> {
        const tx = await this.findOwnedTransactionOrThrow(transactionId, userId);
        const previousState = { ...tx } as unknown as Record<string, unknown>;

        tx.possibleDuplicate = false;
        tx.status = 'CONFIRMED';
        tx.updatedAt = new Date().toISOString();

        const updated = await this.transactionRepo.update(tx);

        await this.writeAuditLog(updated.id!, userId, 'DUPLICATE_RESOLVED', previousState,
            updated as unknown as Record<string, unknown>);

        return updated;
    }

    // ── Workflow Transitions ─────────────────────────────────

    async reviewTransaction(transactionId: UUID, userId: UUID): Promise<FinancialTransaction> {
        return this.transitionStatus(transactionId, userId, 'REVIEWED', 'STATUS_REVIEWED');
    }

    async rejectTransaction(transactionId: UUID, userId: UUID): Promise<FinancialTransaction> {
        return this.transitionStatus(transactionId, userId, 'REJECTED', 'STATUS_REJECTED');
    }

    async archiveTransaction(transactionId: UUID, userId: UUID): Promise<FinancialTransaction> {
        return this.transitionStatus(transactionId, userId, 'ARCHIVED', 'STATUS_ARCHIVED');
    }

    async softDeleteTransaction(transactionId: UUID, userId: UUID): Promise<FinancialTransaction> {
        return this.transitionStatus(transactionId, userId, 'DELETED', 'STATUS_DELETED');
    }

    // ── Queries ──────────────────────────────────────────────

    async getTransactionsByUser(userId: UUID): Promise<FinancialTransaction[]> {
        return this.transactionRepo.findByOwnerId(userId);
    }

    async getTransactionById(id: string): Promise<FinancialTransaction | null> {
        return this.transactionRepo.findById(id);
    }

    async getAuditTrail(transactionId: UUID): Promise<unknown[]> {
        return this.auditLogRepo.findByTransactionId(transactionId);
    }

    async searchPaginated(
        userId: UUID,
        filters: TransactionSearchFilters,
        pagination?: Partial<PaginationParams>,
    ): Promise<PaginatedResult<FinancialTransaction>> {
        const page = Math.max(1, pagination?.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, pagination?.pageSize ?? 20));
        return this.transactionRepo.findPaginated(userId, filters, { page, pageSize });
    }

    // ── Private Helpers ──────────────────────────────────────

    private async findOwnedTransactionOrThrow(transactionId: UUID, userId: UUID): Promise<FinancialTransaction> {
        const tx = await this.transactionRepo.findById(transactionId);
        if (!tx || tx.ownerUserId !== userId) {
            throw new Error("Transaction not found or unauthorized");
        }
        return tx;
    }

    private async transitionStatus(
        transactionId: UUID,
        userId: UUID,
        targetStatus: FinancialTransactionStatus,
        auditAction: string,
    ): Promise<FinancialTransaction> {
        const tx = await this.findOwnedTransactionOrThrow(transactionId, userId);
        const previousState = { ...tx } as unknown as Record<string, unknown>;

        assertValidTransition(tx.status, targetStatus);

        tx.status = targetStatus;
        tx.updatedAt = new Date().toISOString();

        const updated = await this.transactionRepo.update(tx);

        await this.writeAuditLog(updated.id!, userId, auditAction, previousState,
            updated as unknown as Record<string, unknown>);

        return updated;
    }

    private async writeAuditLog(
        transactionId: UUID,
        userId: UUID,
        action: string,
        previousState?: Record<string, unknown>,
        newState?: Record<string, unknown>,
    ): Promise<void> {
        const now = new Date().toISOString();
        await this.auditLogRepo.create({
            id: crypto.randomUUID(),
            transactionId,
            changedByUserId: userId,
            action,
            previousState: previousState ?? null,
            newState: newState ?? null,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        });
    }
}

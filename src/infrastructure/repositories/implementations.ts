import { InMemoryRepository } from "./in-memory-repository";
import { User, Supermarket, Category, Unit, GenericItem, BrandProduct, Template, TemplateItem, Purchase, PurchaseLine, PriceObservation, PasswordResetToken, FinancialTransaction, FinancialTransactionAuditLog, FinancialScanExecution, FinancialScannerTransaction, FinancialInstitution, FinancialInstitutionType, FinancialAccount, FinancialCategory } from "@/domain/entities";
import { IUserRepository, ISupermarketRepository, ICategoryRepository, IUnitRepository, IGenericItemRepository, IBrandProductRepository, ITemplateRepository, ITemplateItemRepository, IPurchaseRepository, IPurchaseLineRepository, IPriceObservationRepository, IPasswordResetTokenRepository, IFinancialTransactionRepository, IFinancialTransactionAuditLogRepository, IFinancialScanExecutionRepository, IFinancialScannerTransactionRepository, IFinancialInstitutionTypeRepository, IFinancialInstitutionRepository, IFinancialAccountRepository, IFinancialCategoryRepository } from "@/domain/repositories";
import { UUID } from "@/domain/core";
import { PaginationParams, PaginatedResult, TransactionSearchFilters } from "@/domain/pagination";

export class InMemoryFinancialTransactionAuditLogRepository extends InMemoryRepository<FinancialTransactionAuditLog> implements IFinancialTransactionAuditLogRepository {
    async findByTransactionId(transactionId: UUID): Promise<FinancialTransactionAuditLog[]> {
        return (await this.findAll()).filter(l => l.transactionId === transactionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
}

export class InMemoryFinancialScannerTransactionRepository extends InMemoryRepository<FinancialScannerTransaction> implements IFinancialScannerTransactionRepository {
    async findUnprocessedByOwnerId(userId: UUID): Promise<FinancialScannerTransaction[]> {
        return (await this.findAll()).filter(t => t.ownerUserId === userId && t.status === 'DETECTED');
    }
}

export class InMemoryFinancialScanExecutionRepository extends InMemoryRepository<FinancialScanExecution> implements IFinancialScanExecutionRepository {
    async findByOwnerId(userId: UUID): Promise<FinancialScanExecution[]> {
        return (await this.findAll()).filter(e => e.ownerUserId === userId);
    }
    async findLatestBySource(userId: UUID, source: string): Promise<FinancialScanExecution | null> {
        const results = (await this.findByOwnerId(userId)).filter(e => e.source === source);
        return results.length > 0 ? results[0] : null;
    }
    async findPaginatedByOwnerId(userId: UUID, pagination: PaginationParams, dateFilter?: import('@/domain/repositories/financial').ScanExecutionDateFilter): Promise<PaginatedResult<FinancialScanExecution>> {
        let all = (await this.findByOwnerId(userId));
        
        if (dateFilter?.dateFrom) {
            const fromDate = new Date(`${dateFilter.dateFrom}T00:00:00`).getTime();
            all = all.filter(e => new Date(e.startedAt).getTime() >= fromDate);
        }
        if (dateFilter?.dateTo) {
            const toDate = new Date(`${dateFilter.dateTo}T23:59:59.999`).getTime();
            all = all.filter(e => new Date(e.startedAt).getTime() <= toDate);
        }

        all = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const totalItems = all.length;
        const { page, pageSize } = pagination;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const from = (page - 1) * pageSize;
        const data = all.slice(from, from + pageSize);

        return {
            data,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
}

export class InMemoryFinancialInstitutionTypeRepository extends InMemoryRepository<FinancialInstitutionType> implements IFinancialInstitutionTypeRepository {
    async findAllGlobalAndUser(userId: UUID): Promise<FinancialInstitutionType[]> {
        return (await this.findAll()).filter(t => t.ownerUserId === null || t.ownerUserId === userId);
    }
}

export class InMemoryFinancialInstitutionRepository extends InMemoryRepository<FinancialInstitution> implements IFinancialInstitutionRepository {
    async findByOwnerId(userId: UUID): Promise<FinancialInstitution[]> {
        return (await this.findAll()).filter(i => i.ownerUserId === userId);
    }
}

export class InMemoryFinancialAccountRepository extends InMemoryRepository<FinancialAccount> implements IFinancialAccountRepository {
    async findByOwnerId(userId: UUID): Promise<FinancialAccount[]> {
        return (await this.findAll()).filter(a => a.ownerUserId === userId);
    }
    async findByInstitutionId(institutionId: UUID): Promise<FinancialAccount[]> {
        return (await this.findAll()).filter(a => a.institutionId === institutionId);
    }
}

export class InMemoryFinancialCategoryRepository extends InMemoryRepository<FinancialCategory> implements IFinancialCategoryRepository {
    async findAllBaseAndUser(userId: UUID): Promise<FinancialCategory[]> {
        return (await this.findAll()).filter(c => c.ownerUserId === null || c.ownerUserId === userId);
    }
}

export class InMemoryFinancialTransactionRepository extends InMemoryRepository<FinancialTransaction> implements IFinancialTransactionRepository {
    async findByOwnerId(userId: UUID): Promise<FinancialTransaction[]> {
        return (await this.findAll()).filter(t => t.ownerUserId === userId).sort((a, b) => b.date.localeCompare(a.date));
    }
    async findRecent(userId: UUID, limit: number): Promise<FinancialTransaction[]> {
        return (await this.findByOwnerId(userId)).slice(0, limit);
    }
    async search(userId: UUID, query: string, filters?: TransactionSearchFilters): Promise<FinancialTransaction[]> {
        return this.applyFilters(await this.findByOwnerId(userId), query, filters);
    }
    async findPaginated(
        userId: UUID,
        filters: TransactionSearchFilters,
        pagination: PaginationParams,
    ): Promise<PaginatedResult<FinancialTransaction>> {
        const all = this.applyFilters(await this.findByOwnerId(userId), filters.query, filters);
        const totalItems = all.length;
        const { page, pageSize } = pagination;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const from = (page - 1) * pageSize;
        const data = all.slice(from, from + pageSize);

        return {
            data,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    private applyFilters(
        results: FinancialTransaction[],
        query?: string,
        filters?: TransactionSearchFilters,
    ): FinancialTransaction[] {
        let filtered = results;
        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(t => t.merchant?.toLowerCase().includes(q));
        }
        if (filters?.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        } else {
            filtered = filtered.filter(t => t.status !== 'DELETED' && t.status !== 'ARCHIVED');
        }

        if (!filters) return filtered;
        if (filters.type) filtered = filtered.filter(t => t.type === filters.type);
        if (filters.categoryId) filtered = filtered.filter(t => t.categoryId === filters.categoryId);
        if (filters.institutionId) filtered = filtered.filter(t => t.institutionId === filters.institutionId);
        if (filters.accountId) filtered = filtered.filter(t => t.accountId === filters.accountId);
        if (filters.dateFrom) filtered = filtered.filter(t => t.date >= filters.dateFrom!);
        if (filters.dateTo) filtered = filtered.filter(t => t.date <= filters.dateTo!);
        if (filters.amountMin !== undefined) filtered = filtered.filter(t => t.amount >= filters.amountMin!);
        if (filters.amountMax !== undefined) filtered = filtered.filter(t => t.amount <= filters.amountMax!);
        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter(t => filters.tags!.some(tag => t.tags?.includes(tag)));
        }
        return filtered;
    }

    async getUniqueTags(userId: UUID): Promise<string[]> {
        const transactions = await this.findByOwnerId(userId);
        const tagsSet = new Set<string>();
        for (const t of transactions) {
            if (t.tags) {
                for (const tag of t.tags) {
                    tagsSet.add(tag);
                }
            }
        }
        return Array.from(tagsSet);
    }
}

export class InMemoryUserRepository extends InMemoryRepository<User> implements IUserRepository {
    async findByEmail(email: string): Promise<User | null> {
        return Array.from(this.items.values()).find(u => u.email === email && !u.isDeleted) || null;
    }
}

export class InMemoryPasswordResetTokenRepository implements IPasswordResetTokenRepository {
    // PasswordResetToken doesn't strictly follow BaseEntity isDeleted generic logic if interface differs, but let's assume it fits or override.
    // Actually PasswordResetToken doesn't have isDeleted in definition? Check definition. 
    // It has id, userId, tokenHash, expiresAt, usedAt, createdAt. NO isDeleted.
    // So InMemoryRepository<T extends BaseEntity> won't work perfectly unless I add isDeleted or make generic looser.
    // I will implement it separately or adjust.
    protected items: Map<UUID, PasswordResetToken> = new Map();

    async create(entity: PasswordResetToken): Promise<PasswordResetToken> {
        this.items.set(entity.id, entity);
        return entity;
    }
    async findById(id: UUID): Promise<PasswordResetToken | null> { return this.items.get(id) || null; }
    async findAll(): Promise<PasswordResetToken[]> { return Array.from(this.items.values()); }
    async update(entity: PasswordResetToken): Promise<PasswordResetToken> { this.items.set(entity.id, entity); return entity; }
    async delete(id: UUID): Promise<void> { this.items.delete(id); } // Physical delete for tokens ok? Or just usedAt.

    async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
        return Array.from(this.items.values()).find(t => t.tokenHash === tokenHash && !t.usedAt) || null;
    }
}

export class InMemorySupermarketRepository extends InMemoryRepository<Supermarket> implements ISupermarketRepository {
    async findByOwnerId(userId: UUID): Promise<Supermarket[]> {
        return (await this.findAll()).filter(s => s.ownerUserId === userId);
    }
}

export class InMemoryCategoryRepository extends InMemoryRepository<Category> implements ICategoryRepository {
    async findAllBaseAndUser(userId: UUID): Promise<Category[]> {
        return (await this.findAll()).filter(c => c.ownerUserId === null || c.ownerUserId === userId);
    }
}

export class InMemoryUnitRepository extends InMemoryRepository<Unit> implements IUnitRepository {
    async findAllBaseAndUser(userId: UUID): Promise<Unit[]> {
        return (await this.findAll()).filter(u => u.ownerUserId === null || u.ownerUserId === userId);
    }
}

export class InMemoryGenericItemRepository extends InMemoryRepository<GenericItem> implements IGenericItemRepository {
    async findByOwnerId(userId: UUID): Promise<GenericItem[]> {
        return (await this.findAll()).filter(i => i.ownerUserId === userId);
    }
    async search(userId: UUID, query: string): Promise<GenericItem[]> {
        const q = query.toLowerCase();
        return (await this.findAll()).filter(i =>
            i.ownerUserId === userId &&
            (i.canonicalName.toLowerCase().includes(q) || i.aliases.some(a => a.toLowerCase().includes(q)))
        );
    }
}

export class InMemoryBrandProductRepository extends InMemoryRepository<BrandProduct> implements IBrandProductRepository {
    async findByGenericItemId(genericItemId: UUID): Promise<BrandProduct[]> {
        return (await this.findAll()).filter(p => p.genericItemId === genericItemId);
    }
    async findByOwnerId(userId: UUID): Promise<BrandProduct[]> {
        return (await this.findAll()).filter(p => p.ownerUserId === userId);
    }
}

export class InMemoryTemplateRepository extends InMemoryRepository<Template> implements ITemplateRepository {
    async findByOwnerId(userId: UUID): Promise<Template[]> {
        return (await this.findAll()).filter(t => t.ownerUserId === userId);
    }
}

export class InMemoryTemplateItemRepository implements ITemplateItemRepository {
    // TemplateItem does not have BaseEntity (isDeleted) in definition, so custom impl.
    private items: Map<UUID, TemplateItem> = new Map();

    async create(item: TemplateItem): Promise<TemplateItem> {
        this.items.set(item.id, item);
        return item;
    }
    async findById(id: UUID): Promise<TemplateItem | null> {
        return this.items.get(id) || null;
    }
    async findByTemplateId(templateId: UUID): Promise<TemplateItem[]> {
        return Array.from(this.items.values()).filter(i => i.templateId === templateId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    async update(item: TemplateItem): Promise<TemplateItem> {
        this.items.set(item.id, item);
        return item;
    }
    async delete(id: UUID): Promise<void> {
        this.items.delete(id);
    }
    async deleteByTemplateId(templateId: UUID): Promise<void> {
        for (const [id, item] of this.items) {
            if (item.templateId === templateId) this.items.delete(id);
        }
    }
}

export class InMemoryPurchaseRepository extends InMemoryRepository<Purchase> implements IPurchaseRepository {
    async findByOwnerId(userId: UUID): Promise<Purchase[]> {
        return (await this.findAll()).filter(p => p.ownerUserId === userId).sort((a, b) => b.date.localeCompare(a.date));
    }
    async findRecent(userId: UUID, limit: number): Promise<Purchase[]> {
        return (await this.findByOwnerId(userId)).slice(0, limit);
    }
}

export class InMemoryPurchaseLineRepository implements IPurchaseLineRepository {
    private items: Map<UUID, PurchaseLine> = new Map();

    async create(line: PurchaseLine): Promise<PurchaseLine> {
        this.items.set(line.id, line);
        return line;
    }
    async findById(id: UUID): Promise<PurchaseLine | null> {
        return this.items.get(id) || null;
    }
    async createMany(lines: PurchaseLine[]): Promise<PurchaseLine[]> {
        lines.forEach(l => this.items.set(l.id, l));
        return lines;
    }
    async findByPurchaseId(purchaseId: UUID): Promise<PurchaseLine[]> {
        return Array.from(this.items.values()).filter(l => l.purchaseId === purchaseId);
    }
    async findByPurchaseIds(purchaseIds: UUID[]): Promise<PurchaseLine[]> {
        const set = new Set(purchaseIds);
        return Array.from(this.items.values()).filter(l => set.has(l.purchaseId));
    }
    async update(line: PurchaseLine): Promise<PurchaseLine> {
        this.items.set(line.id, line);
        return line;
    }
    async delete(id: UUID): Promise<void> {
        this.items.delete(id);
    }
    async deleteByPurchaseId(purchaseId: UUID): Promise<void> {
        for (const [id, item] of this.items) {
            if (item.purchaseId === purchaseId) this.items.delete(id);
        }
    }
}

export class InMemoryPriceObservationRepository implements IPriceObservationRepository {
    protected items: Map<UUID, PriceObservation> = new Map();

    async create(entity: PriceObservation): Promise<PriceObservation> {
        this.items.set(entity.id, entity);
        return entity;
    }
    async findById(id: UUID): Promise<PriceObservation | null> { return this.items.get(id) || null; }
    async findAll(): Promise<PriceObservation[]> { return Array.from(this.items.values()); }
    async update(entity: PriceObservation): Promise<PriceObservation> { this.items.set(entity.id, entity); return entity; }
    async delete(id: UUID): Promise<void> { this.items.delete(id); }

    async findLatestByProductAndSupermarket(brandProductId: UUID, supermarketId: UUID): Promise<PriceObservation | null> {
        const obs = (await this.findAll())
            .filter(o => o.brandProductId === brandProductId && o.supermarketId === supermarketId)
            .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
        return obs.length > 0 ? obs[0] : null;
    }
    async findByOwnerId(userId: UUID): Promise<PriceObservation[]> {
        return (await this.findAll()).filter(o => o.ownerUserId === userId);
    }
}

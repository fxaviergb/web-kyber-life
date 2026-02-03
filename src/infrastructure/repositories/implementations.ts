import { InMemoryRepository } from "./in-memory-repository";
import { User, Supermarket, Category, Unit, GenericItem, BrandProduct, Template, TemplateItem, Purchase, PurchaseLine, PriceObservation, PasswordResetToken } from "@/domain/entities";
import { IUserRepository, ISupermarketRepository, ICategoryRepository, IUnitRepository, IGenericItemRepository, IBrandProductRepository, ITemplateRepository, ITemplateItemRepository, IPurchaseRepository, IPurchaseLineRepository, IPriceObservationRepository, IPasswordResetTokenRepository } from "@/domain/repositories";
import { UUID } from "@/domain/core";

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

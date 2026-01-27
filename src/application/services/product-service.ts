import { IGenericItemRepository, IBrandProductRepository, IPriceObservationRepository } from "@/domain/repositories";
import { GenericItem, BrandProduct, PriceObservation } from "@/domain/entities";
import { UUID, CurrencyCode } from "@/domain/core";
import { v4 as uuidv4 } from "uuid";

export class ProductService {
    constructor(
        private genericItemRepo: IGenericItemRepository,
        private brandProductRepo: IBrandProductRepository,
        private priceObservationRepo: IPriceObservationRepository
    ) { }

    // --- Generic Items ---
    async createGenericItem(
        userId: UUID,
        canonicalName: string,
        primaryCategoryId?: UUID,
        imageUrl?: string
    ): Promise<GenericItem> {
        const item: GenericItem = {
            id: uuidv4(),
            ownerUserId: userId,
            canonicalName,
            aliases: [],
            primaryCategoryId: primaryCategoryId || null,
            secondaryCategoryIds: [],
            imageUrl: imageUrl || null,
            globalPrice: null,
            currencyCode: null,
            lastPriceUpdate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.genericItemRepo.create(item);
    }

    async searchGenericItems(userId: UUID, query: string): Promise<GenericItem[]> {
        return this.genericItemRepo.search(userId, query);
    }

    async getGenericItems(userId: UUID): Promise<GenericItem[]> {
        return this.genericItemRepo.findByOwnerId(userId);
    }

    async getGenericItem(userId: UUID, id: UUID): Promise<GenericItem | null> {
        const item = await this.genericItemRepo.findById(id);
        if (!item || item.ownerUserId !== userId) return null;
        return item;
    }

    async updateGenericItem(
        userId: UUID,
        id: UUID,
        name: string,
        primaryCategoryId?: UUID | null,
        secondaryCategoryIds?: UUID[],
        imageUrl?: string | null,
        aliases?: string[],
        globalPrice?: number | null,
        currencyCode?: string
    ): Promise<GenericItem> {
        const item = await this.genericItemRepo.findById(id);
        if (!item) throw new Error("Item not found");
        if (item.ownerUserId !== userId) throw new Error("Cannot edit other user's item");

        item.canonicalName = name;
        if (primaryCategoryId !== undefined) item.primaryCategoryId = primaryCategoryId;
        if (secondaryCategoryIds !== undefined) item.secondaryCategoryIds = secondaryCategoryIds;
        if (imageUrl !== undefined) item.imageUrl = imageUrl || null;
        if (aliases !== undefined) item.aliases = aliases;
        if (globalPrice !== undefined) {
            item.globalPrice = globalPrice;
            item.lastPriceUpdate = new Date().toISOString();
        }
        if (currencyCode !== undefined) item.currencyCode = currencyCode;

        item.updatedAt = new Date().toISOString();

        return this.genericItemRepo.update(item);
    }

    async deleteGenericItem(userId: UUID, id: UUID): Promise<void> {
        const item = await this.genericItemRepo.findById(id);
        if (!item) throw new Error("Item not found");
        if (item.ownerUserId !== userId) throw new Error("Cannot delete other user's item");

        await this.genericItemRepo.delete(id);
    }

    async addAlias(userId: UUID, itemId: UUID, alias: string): Promise<GenericItem> {
        const item = await this.getGenericItem(userId, itemId);
        if (!item) throw new Error("Item not found");

        if (!item.aliases.includes(alias)) {
            item.aliases.push(alias);
            item.updatedAt = new Date().toISOString();
            return this.genericItemRepo.update(item);
        }
        return item;
    }

    // --- Brand Products (Options) ---
    async getBrandProducts(userId: UUID, genericItemId: UUID): Promise<BrandProduct[]> {
        const items = await this.brandProductRepo.findByGenericItemId(genericItemId);
        return items.filter(i => i.ownerUserId === userId);
    }

    async getAllBrandProducts(userId: UUID): Promise<BrandProduct[]> {
        return this.brandProductRepo.findByOwnerId(userId);
    }

    async createBrandProduct(
        userId: UUID,
        genericItemId: UUID,
        brand: string,
        presentation: string,
        imageUrl?: string,
        globalPrice?: number,
        currencyCode: string = "USD"
    ): Promise<BrandProduct> {
        const product: BrandProduct = {
            id: uuidv4(),
            ownerUserId: userId,
            genericItemId,
            brand,
            presentation,
            imageUrl: imageUrl || null,
            globalPrice: globalPrice !== undefined ? globalPrice : null,
            currencyCode: globalPrice !== undefined ? currencyCode : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.brandProductRepo.create(product);
    }

    async updateBrandProduct(
        userId: UUID,
        id: UUID,
        brand: string,
        presentation: string,
        imageUrl?: string,
        globalPrice?: number,
        currencyCode?: string
    ): Promise<BrandProduct> {
        const product = await this.brandProductRepo.findById(id);
        if (!product) throw new Error("Product not found");
        if (product.ownerUserId !== userId) throw new Error("Cannot edit other user's product");

        product.brand = brand;
        product.presentation = presentation;
        if (imageUrl !== undefined) product.imageUrl = imageUrl || null;
        if (globalPrice !== undefined) product.globalPrice = globalPrice;
        if (currencyCode !== undefined) product.currencyCode = currencyCode;

        product.updatedAt = new Date().toISOString();
        return this.brandProductRepo.update(product);
    }

    async deleteBrandProduct(userId: UUID, id: UUID): Promise<void> {
        const product = await this.brandProductRepo.findById(id);
        if (!product) throw new Error("Product not found");
        if (product.ownerUserId !== userId) throw new Error("Cannot delete other user's product");

        await this.brandProductRepo.delete(id);
    }

    async addPriceObservation(
        userId: UUID,
        brandProductId: UUID,
        supermarketId: UUID,
        unitPrice: number | null,
        currencyCode: CurrencyCode,
        sourcePurchaseId?: UUID
    ): Promise<PriceObservation> {
        const product = await this.brandProductRepo.findById(brandProductId);
        if (!product || product.ownerUserId !== userId) throw new Error("Invalid product");

        // Note: We don't necessarily validate supermarket existence here for simplicity in PoC.

        const obs: PriceObservation = {
            id: uuidv4(),
            ownerUserId: userId,
            brandProductId,
            supermarketId,
            currencyCode,
            unitPrice: unitPrice, // Can be null
            observedAt: new Date().toISOString(),
            sourcePurchaseId: sourcePurchaseId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.priceObservationRepo.create(obs);
    }

    async getLatestPrices(userId: UUID, brandProductId: UUID): Promise<PriceObservation[]> {
        // In-memory repo finds all. Filter for owner and product.
        const all = await this.priceObservationRepo.findByOwnerId(userId);
        const forProduct = all.filter(p => p.brandProductId === brandProductId);

        // We want latest per supermarket.
        const latestMap = new Map<string, PriceObservation>();
        forProduct.forEach(p => {
            const existing = latestMap.get(p.supermarketId);
            if (!existing || p.observedAt > existing.observedAt) {
                latestMap.set(p.supermarketId, p);
            }
        });

        return Array.from(latestMap.values());
    }
}

import { IPurchaseRepository, IPurchaseLineRepository, ITemplateRepository, ITemplateItemRepository, IGenericItemRepository, IPriceObservationRepository, IBrandProductRepository } from "@/domain/repositories";
import { Purchase, PurchaseLine, PriceObservation, TemplateItem, GenericItem, BrandProduct } from "@/domain/entities";
import { UUID } from "@/domain/core";
import { v4 as uuidv4 } from "uuid";

export class PurchaseService {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private lineRepo: IPurchaseLineRepository,
        private templateRepo: ITemplateRepository,
        private templateItemRepo: ITemplateItemRepository,
        private genericItemRepo: IGenericItemRepository,
        private observationRepo: IPriceObservationRepository,
        private brandProductRepo: IBrandProductRepository // Added for recommendation logic
    ) { }

    async createPurchase(
        userId: UUID,
        supermarketId: UUID | null,
        date: string,
        templateIds: UUID[]
    ): Promise<Purchase> {
        const currencyCode = "USD";

        const purchase: Purchase = {
            id: uuidv4(),
            ownerUserId: userId,
            supermarketId,
            date,
            currencyCode,
            selectedTemplateIds: templateIds,
            totalPaid: null,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };

        await this.purchaseRepo.create(purchase);

        // 1. Consolidate Items
        const allItems: TemplateItem[] = [];
        for (const tid of templateIds) {
            const items = await this.templateItemRepo.findByTemplateId(tid);
            items.forEach(i => allItems.push(i));
        }

        const consolidated = new Map<UUID, TemplateItem>();
        for (const item of allItems) {
            // Deduplicate by Generic Item ID.
            // Logic: If already exists, we currently skip (keep first).
            // Future improvement: Sum quantities?
            if (!consolidated.has(item.genericItemId)) {
                consolidated.set(item.genericItemId, item);
            }
        }

        // 2. Prepare Data for Recommendation
        // A. History: Get recent purchases at this supermarket to find what was bought before.
        const recentPurchases = supermarketId
            ? (await this.purchaseRepo.findByOwnerId(userId))
                .filter(p => p.supermarketId === supermarketId && p.status === 'completed')
                .sort((a, b) => b.date.localeCompare(a.date))
            : [];

        // B. Observations: Get all observations at this supermarket
        // Optimization: We could fetch all and filter in memory since dataset is small for V1.
        // Or fetch per item (N+1). Let's fetch all for user and filter by supermarket.
        const allObservations = supermarketId
            ? (await this.observationRepo.findByOwnerId(userId))
                .filter(o => o.supermarketId === supermarketId)
            : [];

        // C. Generic Items Map (for global price)
        const uniqueGenericIds = Array.from(consolidated.keys());
        const genericItemMap = new Map<UUID, GenericItem>();
        for (const gid of uniqueGenericIds) {
            const g = await this.genericItemRepo.findById(gid);
            if (g) genericItemMap.set(gid, g);
        }

        // D. Brand Products Map (needed to link Observation -> Generic)
        // We need to know which Brands belong to which Generic.
        const brands = await this.brandProductRepo.findByOwnerId(userId);
        const brandMap = new Map<UUID, BrandProduct>(); // BrandProductId -> BrandProduct
        brands.forEach(b => brandMap.set(b.id, b));


        // 3. Create Lines with Recommendations
        const lines: PurchaseLine[] = [];

        for (const tItem of consolidated.values()) {
            let recommendedBrandProductId: UUID | null = null;
            let recommendedPrice: number | null = null;

            // Strategy 1: Last Purchase of this Generic Item in this Supermarket
            // Iterate recent purchases, find lines.
            // This requires fetching lines for those purchases. 
            // N+1 issue if we do it for every item inside every purchase.
            // Optimization for V1: Just check the *most recent* purchase?
            // Or better: Pre-load lines for the last X purchases?
            // Let's iterate purchases (limit 5) and check lines.
            for (const p of recentPurchases.slice(0, 5)) {
                const pLines = await this.lineRepo.findByPurchaseId(p.id);
                const match = pLines.find(l => l.genericItemId === tItem.genericItemId && l.brandProductId);
                if (match) {
                    recommendedBrandProductId = match.brandProductId;
                    // For price, do we use the price paid then or current observation? 
                    // Prompt says "recommends last option bought". 
                    // Price usually comes from Observation or current Global.
                    // Let's try to find an observation for this brand/supermarket to get *current* price.
                    break;
                }
            }

            // Strategy 2: If no history, check Observations for this Generic Item
            if (!recommendedBrandProductId) {
                // Find observations for ANY brand product belonging to this Generic Item
                // Filter allObservations where brand -> genericItemId === tItem.genericItemId
                const relevantObs = allObservations.filter(o => {
                    const bp = brandMap.get(o.brandProductId);
                    return bp && bp.genericItemId === tItem.genericItemId;
                });

                if (relevantObs.length > 0) {
                    // Sort by date desc
                    relevantObs.sort((a, b) => b.observedAt.localeCompare(a.observedAt));
                    recommendedBrandProductId = relevantObs[0].brandProductId;
                }
            }

            // Determine Price
            if (recommendedBrandProductId) {
                // Find latest observation for this specific brand/supermarket
                const obs = allObservations
                    .filter(o => o.brandProductId === recommendedBrandProductId)
                    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0];

                if (obs) {
                    recommendedPrice = obs.unitPrice;
                } else {
                    // Fallback: Check global price of the specific brand product?
                    // BrandProduct entity has globalPrice? Yes.
                    const bp = brandMap.get(recommendedBrandProductId);
                    if (bp?.globalPrice) {
                        recommendedPrice = bp.globalPrice;
                    }
                }
            }

            // Fallback: Generic Global Price
            if (recommendedPrice === null) {
                recommendedPrice = genericItemMap.get(tItem.genericItemId)?.globalPrice || null;
            }

            const line: PurchaseLine = {
                id: uuidv4(),
                purchaseId: purchase.id,
                genericItemId: tItem.genericItemId,
                brandProductId: recommendedBrandProductId,
                qty: tItem.defaultQty,
                unitId: tItem.defaultUnitId,
                unitPrice: recommendedPrice,
                checked: false,
                lineAmountOverride: null,
                note: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false
            };
            lines.push(line);
        }

        await this.lineRepo.createMany(lines);
        return purchase;
    }

    async getPurchase(userId: UUID, id: UUID): Promise<{ purchase: Purchase, lines: PurchaseLine[] } | null> {
        const p = await this.purchaseRepo.findById(id);
        if (!p || p.ownerUserId !== userId) return null;

        const lines = await this.lineRepo.findByPurchaseId(id);
        return { purchase: p, lines };
    }

    // Update line...
    async updateLine(userId: UUID, lineId: UUID, updates: Partial<PurchaseLine>): Promise<void> {
        const line = await this.lineRepo.findById(lineId);
        if (!line) throw new Error("Line not found");

        const purchase = await this.purchaseRepo.findById(line.purchaseId);
        if (!purchase || purchase.ownerUserId !== userId) throw new Error("Access denied");

        if (purchase.status === 'completed') throw new Error("Cannot edit completed purchase");

        // Merge updates
        if (updates.checked !== undefined) line.checked = updates.checked;
        if (updates.qty !== undefined) line.qty = updates.qty;
        if (updates.unitId !== undefined) line.unitId = updates.unitId;
        if (updates.unitPrice !== undefined) line.unitPrice = updates.unitPrice;
        if (updates.brandProductId !== undefined) line.brandProductId = updates.brandProductId;
        if (updates.note !== undefined) line.note = updates.note;
        if (updates.lineAmountOverride !== undefined) line.lineAmountOverride = updates.lineAmountOverride;

        await this.lineRepo.update(line);
    }

    async finishPurchase(
        userId: UUID,
        purchaseId: UUID,
        totalPaid: number,
        subtotal?: number,
        discount?: number,
        tax?: number
    ): Promise<Purchase> {
        const p = await this.purchaseRepo.findById(purchaseId);
        if (!p || p.ownerUserId !== userId) throw new Error("Purchase not found");

        if (p.status === 'completed') throw new Error("Already completed");

        // Validate lines
        const lines = await this.lineRepo.findByPurchaseId(purchaseId);
        for (const line of lines) {
            if (line.checked && (line.unitPrice === null || line.unitPrice <= 0)) {
                // Warning: PRD RB-041 says 'unitPrice' required if checked.
                throw new Error(`Line for item ${line.genericItemId} is checked but missing price`);
            }
        }

        p.status = 'completed';
        p.totalPaid = totalPaid;
        p.subtotal = subtotal || null;
        p.discount = discount || null;
        p.tax = tax || null;
        p.updatedAt = new Date().toISOString();
        await this.purchaseRepo.update(p);

        // Create Price Observations (RB-042)
        // Create Price Observations (RB-042)
        if (p.supermarketId) {
            for (const line of lines) {
                if (line.checked && line.brandProductId && line.unitPrice) {
                    const observation: PriceObservation = {
                        id: uuidv4(),
                        ownerUserId: userId,
                        brandProductId: line.brandProductId,
                        supermarketId: p.supermarketId!, // Safe assert
                        currencyCode: p.currencyCode,
                        unitPrice: line.unitPrice,
                        observedAt: p.date, // Use purchase date
                        sourcePurchaseId: p.id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isDeleted: false
                    };
                    await this.observationRepo.create(observation);
                }
            }
        }

        return p;
    }
    async addPurchaseLine(userId: UUID, purchaseId: UUID, genericItemId: UUID, unitPrice?: number): Promise<PurchaseLine> {
        const purchase = await this.purchaseRepo.findById(purchaseId);
        if (!purchase || purchase.ownerUserId !== userId) throw new Error("Purchase not found");
        if (purchase.status === 'completed') throw new Error("Cannot edit completed purchase");

        // Check if already exists? PRD says nothing. Duplicate allows buying 2 packs separately? 
        // Logic: Usually we merge or add new line. Let's add new line.
        // But prompt says "Incorporar un producto".

        // Find recommendation (similar to create logic)
        // Reuse recommendation logic? It's complex to extract.
        // For unplanned, maybe just default?
        // Let's implement simple addition.

        const line: PurchaseLine = {
            id: uuidv4(),
            purchaseId: purchase.id,
            genericItemId: genericItemId,
            brandProductId: null,
            qty: 1, // Default 1
            unitId: null,
            unitPrice: unitPrice ?? null,
            checked: false,
            lineAmountOverride: null,
            note: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        } as PurchaseLine;

        // Try to fill defaultQty/Unit from GenericItem if available?
        // GenericItem doesn't store defaults, TemplateItem does.
        // But we are not adding from template.
        // So just raw line.

        await this.lineRepo.create(line);
        return line;
    }

    async deletePurchase(userId: UUID, purchaseId: UUID): Promise<void> {
        const p = await this.purchaseRepo.findById(purchaseId);
        if (!p || p.ownerUserId !== userId) throw new Error("Purchase not found");

        // Soft delete lines first (optional but good for consistency)
        await this.lineRepo.deleteByPurchaseId(purchaseId);
        // Soft delete purchase
        await this.purchaseRepo.delete(purchaseId);
    }
}

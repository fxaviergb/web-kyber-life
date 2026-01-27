import {
    IPurchaseRepository,
    IPurchaseLineRepository,
    IPriceObservationRepository,
    IGenericItemRepository,
    IBrandProductRepository,
    ICategoryRepository,
    IUnitRepository
} from "@/domain/repositories";
import { UUID, CurrencyCode } from "@/domain/core";
import { BrandProduct, GenericItem } from "@/domain/entities";

export class AnalyticsService {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private lineRepo: IPurchaseLineRepository,
        private observationRepo: IPriceObservationRepository,
        private genericItemRepo: IGenericItemRepository,
        private brandProductRepo: IBrandProductRepository,
        private categoryRepo: ICategoryRepository,
        private unitRepo: IUnitRepository
    ) { }

    /**
     * Flow 19: Monthly Expenses
     * Aggregates completed purchases by month.
     */
    async getMonthlyExpenses(userId: UUID, monthsBack: number = 6) {
        // Fetch all user purchases (optimization: repo support date range filter later)
        const purchases = (await this.purchaseRepo.findByOwnerId(userId))
            .filter(p => p.status === 'completed' && p.totalPaid !== null);

        // Group by Month (YYYY-MM)
        const grouped = new Map<string, number>();
        const now = new Date();

        // Initialize last X months with 0
        for (let i = 0; i < monthsBack; i++) {
            // Use UTC to ensure consistency with ISO String
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            grouped.set(key, 0);
        }

        purchases.forEach(p => {
            const monthKey = p.date.slice(0, 7);
            if (grouped.has(monthKey)) {
                grouped.set(monthKey, (grouped.get(monthKey) || 0) + (p.totalPaid || 0));
            }
        });

        // Convert to array sorted by date ASC
        const result = Array.from(grouped.entries())
            .map(([month, total]) => ({ month, total }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Calculate average
        const validMonths = result.filter(r => r.total > 0).length;
        const totalSum = result.reduce((sum, r) => sum + r.total, 0);
        const average = validMonths > 0 ? totalSum / validMonths : 0;

        return { history: result, average };
    }

    /**
     * Flow 20: Category Spending
     */
    async getCategorySpending(userId: UUID) {
        const purchases = (await this.purchaseRepo.findByOwnerId(userId))
            .filter(p => p.status === 'completed');

        const categoryMap = new Map<UUID, number>(); // CategoryID -> Amount
        const categoryNames = new Map<UUID, string>();

        let uncategorizedTotal = 0;

        // Populate category names
        const categories = await this.categoryRepo.findAllBaseAndUser(userId);
        categories.forEach(c => categoryNames.set(c.id, c.name));

        // Pre-fetch generics to map Line -> Category
        // Optimization: In real DB, join. Here, N+1 or fetch all.
        // Let's fetch all generic items for user
        const genericItems = await this.genericItemRepo.findByOwnerId(userId); // Does this include base? 
        // Logic check: Generic items might rely on base repo method.
        // Assuming we can resolve generic item -> category.
        const itemCategoryMap = new Map<UUID, UUID | null>();
        genericItems.forEach(g => itemCategoryMap.set(g.id, g.primaryCategoryId));

        for (const p of purchases) {
            const lines = await this.lineRepo.findByPurchaseId(p.id);
            for (const line of lines) {
                // Determine amount: override > (unitPrice * qty)
                let amount = 0;
                if (line.lineAmountOverride !== null) {
                    amount = line.lineAmountOverride;
                } else if (line.unitPrice !== null && line.qty !== null) {
                    amount = line.unitPrice * line.qty;
                }

                if (amount > 0) {
                    const catId = itemCategoryMap.get(line.genericItemId);
                    if (catId) {
                        categoryMap.set(catId, (categoryMap.get(catId) || 0) + amount);
                    } else {
                        uncategorizedTotal += amount;
                    }
                }
            }
        }

        // Format result
        const result = Array.from(categoryMap.entries()).map(([id, value]) => ({
            id,
            name: categoryNames.get(id) || "Desconocida",
            value
        }));

        if (uncategorizedTotal > 0) {
            result.push({ id: 'uncategorized', name: 'Sin Categoría', value: uncategorizedTotal });
        }

        const total = result.reduce((sum, r) => sum + r.value, 0);
        return result
            .sort((a, b) => b.value - a.value)
            .map(r => ({ ...r, percentage: total > 0 ? (r.value / total) * 100 : 0 }));
    }

    /**
     * Flow 21: Frequent Products
     * mode: 'count' (frequency of purchase events) | 'units' (total quantity)
     */
    async getFrequentProducts(userId: UUID, mode: 'count' | 'units' = 'count') {
        const purchases = (await this.purchaseRepo.findByOwnerId(userId))
            .filter(p => p.status === 'completed');

        // Generic Item Frequency
        const genericFreq = new Map<UUID, number>();
        // Brand Frequency
        const brandFreq = new Map<UUID, number>();

        for (const p of purchases) {
            const lines = await this.lineRepo.findByPurchaseId(p.id);
            for (const line of lines) {
                const amount = mode === 'units' ? (line.qty || 0) : 1;

                // Generic
                if (line.genericItemId) {
                    genericFreq.set(line.genericItemId, (genericFreq.get(line.genericItemId) || 0) + amount);
                }

                // Brand
                if (line.brandProductId) {
                    brandFreq.set(line.brandProductId, (brandFreq.get(line.brandProductId) || 0) + amount);
                }
            }
        }

        // Resolve names
        const generics = [];
        for (const [id, value] of genericFreq.entries()) {
            const item = await this.genericItemRepo.findById(id);
            if (item) generics.push({ id, name: item.canonicalName, value });
        }

        const brands = [];
        for (const [id, value] of brandFreq.entries()) {
            const item = await this.brandProductRepo.findById(id);
            if (item) brands.push({ id, name: `${item.brand} ${item.presentation}`, value });
        }

        return {
            generics: generics.sort((a, b) => b.value - a.value).slice(0, 10),
            brands: brands.sort((a, b) => b.value - a.value).slice(0, 10)
        };
    }

    /**
     * Flow 22 & 23: Price Analytics
     */
    async getPriceHistory(userId: UUID, brandProductId: UUID) {
        const obs = (await this.observationRepo.findByOwnerId(userId))
            .filter(o => o.brandProductId === brandProductId)
            .sort((a, b) => a.observedAt.localeCompare(b.observedAt)); // Ascending for chart

        return obs.map(o => ({
            date: o.observedAt,
            price: o.unitPrice,
            supermarketId: o.supermarketId
        }));
    }

    async getLatestPrices(userId: UUID, brandProductId: UUID) {
        const obs = (await this.observationRepo.findByOwnerId(userId))
            .filter(o => o.brandProductId === brandProductId);

        // Group by Supermarket, find latest
        const latestMap = new Map<UUID, { price: number, date: string }>();

        obs.forEach(o => {
            if (!latestMap.has(o.supermarketId) || o.observedAt > latestMap.get(o.supermarketId)!.date) {
                if (o.unitPrice !== null) {
                    latestMap.set(o.supermarketId, { price: o.unitPrice, date: o.observedAt });
                }
            }
        });

        return Array.from(latestMap.entries()).map(([smId, data]) => ({
            supermarketId: smId,
            ...data
        }));
    }

    async getGenericPriceHistory(userId: UUID, genericItemId: UUID) {
        // Find all brand products for this generic item
        const products = (await this.brandProductRepo.findByGenericItemId(genericItemId))
            .filter(p => p.ownerUserId === userId);
        const productIds = new Set(products.map(p => p.id));

        // Find all observations for these products
        const obs = (await this.observationRepo.findByOwnerId(userId))
            .filter(o => productIds.has(o.brandProductId))
            .sort((a, b) => a.observedAt.localeCompare(b.observedAt));

        // Return all points? Or aggregate?
        // Let's return all points but labeled with brand? 
        // Or simplified: just price and date.
        // For "Generic" context, usually user wants to see the trend of the commodity.
        // Returning all points is fine for now.
        return obs.map(o => ({
            date: o.observedAt,
            price: o.unitPrice,
            supermarketId: o.supermarketId
            // Maybe add brand name logic in UI or service? Service doesn't map IDs to names effectively in this return shape.
        }));
    }

    async getGenericLatestPrices(userId: UUID, genericItemId: UUID) {
        // Find all brand products
        const products = (await this.brandProductRepo.findByGenericItemId(genericItemId))
            .filter(p => p.ownerUserId === userId);
        const productIds = new Set(products.map(p => p.id));

        // Find all observations
        const obs = (await this.observationRepo.findByOwnerId(userId))
            .filter(o => productIds.has(o.brandProductId));

        // Group by Supermarket -> Find MINIMUM Latest Price
        // First find latest per brand/supermarket? No, just latest per supermarket/brand pair, then find min among brands?
        // Actually, for each supermarket, we might have prices for Brand A and Brand B.
        // We want the current "Best Price" for this Generic Item at Supermarket X.

        // 1. Group by Supermarket + Brand -> Latest Observation
        const latestPerBrandAtSupermarket = new Map<string, { price: number, date: string, brandId: string }>();

        obs.forEach(o => {
            const key = `${o.supermarketId}:${o.brandProductId}`;
            if (!latestPerBrandAtSupermarket.has(key) || o.observedAt > latestPerBrandAtSupermarket.get(key)!.date) {
                if (o.unitPrice !== null) {
                    latestPerBrandAtSupermarket.set(key, { price: o.unitPrice, date: o.observedAt, brandId: o.brandProductId });
                }
            }
        });

        // 2. Group by Supermarket -> Find Min Price
        const minPricePerSupermarket = new Map<UUID, { price: number, date: string, brandId: string }>();

        latestPerBrandAtSupermarket.forEach((data, key) => {
            const [smId, _] = key.split(':');
            const existing = minPricePerSupermarket.get(smId);
            if (!existing || data.price < existing.price) {
                minPricePerSupermarket.set(smId, data);
            }
        });

        return Array.from(minPricePerSupermarket.entries()).map(([smId, data]) => ({
            supermarketId: smId,
            ...data
        }));
    }
}

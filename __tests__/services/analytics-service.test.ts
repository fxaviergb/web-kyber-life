
import { AnalyticsService } from "@/application/services/analytics-service";
import { Purchase, PurchaseLine, PriceObservation, GenericItem, BrandProduct, Category, Unit, Supermarket } from "@/domain/entities";
import { InMemoryRepository } from "@/infrastructure/repositories/in-memory-repository";
import { InMemoryGenericItemRepository, InMemoryBrandProductRepository } from "@/infrastructure/repositories/implementations";

// Mock Repos with specific mock data
class MockPurchaseRepo extends InMemoryRepository<Purchase> {
    async findByOwnerId(userId: string): Promise<Purchase[]> {
        return (await this.findAll()).filter(p => p.ownerUserId === userId);
    }
}
class MockLineRepo extends InMemoryRepository<PurchaseLine> {
    async findByPurchaseId(purchaseId: string): Promise<PurchaseLine[]> {
        return (await this.findAll()).filter(l => l.purchaseId === purchaseId);
    }
    async findByPurchaseIds(purchaseIds: string[]): Promise<PurchaseLine[]> {
        return (await this.findAll()).filter(l => purchaseIds.includes(l.purchaseId));
    }
}

class MockCategoryRepo extends InMemoryRepository<Category> {
    async findAllBaseAndUser(userId: string): Promise<Category[]> {
        return (await this.findAll()).filter(c => c.ownerUserId === userId || c.ownerUserId === 'system');
    }
}
class MockObservationRepo extends InMemoryRepository<PriceObservation> {
    async findByOwnerId(userId: string): Promise<PriceObservation[]> {
        return (await this.findAll()).filter(o => o.ownerUserId === userId);
    }
}

describe("AnalyticsService", () => {
    let service: AnalyticsService;
    let purchaseRepo: MockPurchaseRepo;
    let lineRepo: MockLineRepo;
    let observationRepo: MockObservationRepo;
    let genericItemRepo: InMemoryGenericItemRepository;
    let brandProductRepo: InMemoryBrandProductRepository;
    let categoryRepo: MockCategoryRepo;

    // Mock System Time to 2024-07-01
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2024-07-01T12:00:00Z"));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        purchaseRepo = new MockPurchaseRepo();
        lineRepo = new MockLineRepo();
        observationRepo = new MockObservationRepo();
        genericItemRepo = new InMemoryGenericItemRepository();
        brandProductRepo = new InMemoryBrandProductRepository();
        categoryRepo = new MockCategoryRepo();

        service = new AnalyticsService(
            purchaseRepo as any,
            lineRepo as any,
            observationRepo as any,
            genericItemRepo as any,
            brandProductRepo as any,
            categoryRepo as any,
            {} as any // UnitRepo not critical for logic
        );
    });

    const userId = "user-1";
    const baseDate = "2024-06-15T10:00:00Z";

    it("should calculate monthly expenses correctly", async () => {
        // Setup Purchases across different months
        // With system time July 2024, last 3 months = May, June, July.
        // It should catch May and June.
        await purchaseRepo.create({
            id: "p1", ownerUserId: userId, date: "2024-05-15", totalPaid: 100, status: 'completed',
            supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false
        });
        await purchaseRepo.create({
            id: "p2", ownerUserId: userId, date: "2024-05-20", totalPaid: 50, status: 'completed',
            supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false
        });
        await purchaseRepo.create({
            id: "p3", ownerUserId: userId, date: "2024-06-10", totalPaid: 200, status: 'completed',
            supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false
        });

        const result = await service.getMonthlyExpenses(userId, 3); // Check last 3 months
        console.log("Result:", JSON.stringify(result, null, 2));

        // Expect May: 150, June: 200
        const may = result.history.find(h => h.month === "2024-05");
        const june = result.history.find(h => h.month === "2024-06");

        expect(may?.total).toBe(150);
        expect(june?.total).toBe(200);
        expect(result.average).toBe(175);
    });

    it("should aggregate category spending", async () => {
        const catId = "cat-food";
        await categoryRepo.create({ id: catId, name: "Comida", ownerUserId: userId, isDeleted: false, createdAt: "", updatedAt: "" });
        await genericItemRepo.create({ id: "gen-milk", ownerUserId: userId, canonicalName: "Leche", primaryCategoryId: catId, secondaryCategoryIds: [], aliases: [], imageUrl: null, createdAt: "", updatedAt: "", isDeleted: false });
        await genericItemRepo.create({ id: "gen-water", ownerUserId: userId, canonicalName: "Agua", primaryCategoryId: null, secondaryCategoryIds: [], aliases: [], imageUrl: null, createdAt: "", updatedAt: "", isDeleted: false });

        await purchaseRepo.create({
            id: "p1", ownerUserId: userId, date: "2024-06-01", totalPaid: 50, status: 'completed',
            supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false
        });

        await lineRepo.create({
            id: "l1", purchaseId: "p1", genericItemId: "gen-milk", brandProductId: null,
            qty: 2, unitPrice: 10, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false
        }); // 2 * 10 = 20 for "Comida"
        await lineRepo.create({
            id: "l2", purchaseId: "p1", genericItemId: "gen-water", brandProductId: null,
            qty: 1, unitPrice: 5, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false
        }); // 5 for Uncategorized
        await lineRepo.create({
            id: "l3", purchaseId: "p1", genericItemId: "gen-water", brandProductId: null,
            qty: 1, unitPrice: null, checked: true, lineAmountOverride: 15, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false
        }); // 15 override for Uncategorized

        const result = await service.getCategorySpending(userId);
        expect(result).toHaveLength(2);
        
        // Sorting should place Uncategorized (20) first or tie with Comida (20)
        const comida = result.find(c => c.id === catId);
        const uncategorized = result.find(c => c.id === 'uncategorized');
        
        expect(comida?.value).toBe(20);
        expect(uncategorized?.value).toBe(20);
    });

    it("should retrieve daily expenses", async () => {
        await purchaseRepo.create({ id: "p1", ownerUserId: userId, date: "2024-06-01T12:00:00Z", totalPaid: 50, status: 'completed', supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false });
        await purchaseRepo.create({ id: "p2", ownerUserId: userId, date: "2024-06-01T15:00:00Z", totalPaid: 20, status: 'completed', supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false });
        await purchaseRepo.create({ id: "p3", ownerUserId: userId, date: "2024-06-05T08:00:00Z", totalPaid: 30, status: 'completed', supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false });
        
        const result = await service.getDailyExpenses(userId, new Date("2024-06-01"), new Date("2024-06-30"));
        expect(result).toHaveLength(2);
        expect(result[0].date).toBe("2024-06-01");
        expect(result[0].total).toBe(70);
        expect(result[1].date).toBe("2024-06-05");
        expect(result[1].total).toBe(30);
    });

    it("should identify top categories", async () => {
        const catId = "cat-food";
        await categoryRepo.create({ id: catId, name: "Comida", ownerUserId: userId, isDeleted: false, createdAt: "", updatedAt: "" });
        await genericItemRepo.create({ id: "gen-milk", ownerUserId: userId, canonicalName: "Leche", primaryCategoryId: catId, secondaryCategoryIds: [], aliases: [], imageUrl: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        await purchaseRepo.create({ id: "p1", ownerUserId: userId, date: "2024-06-01", totalPaid: 50, status: 'completed', supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false });
        await lineRepo.create({ id: "l1", purchaseId: "p1", genericItemId: "gen-milk", brandProductId: null, qty: 1, unitPrice: 10, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        const result = await service.getTopCategories(userId, 1);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Comida");
    });

    it("should identify frequent products with mode 'units'", async () => {
        await genericItemRepo.create({ id: "gen-bread", ownerUserId: userId, canonicalName: "Pan", primaryCategoryId: null, secondaryCategoryIds: [], aliases: [], imageUrl: null, createdAt: "", updatedAt: "", isDeleted: false });
        await brandProductRepo.create({ id: "bp-bread", brand: "Bimbo", presentation: "Blanco", ownerUserId: userId, genericItemId: "gen-bread", aliases: [], imageUrl: null, barcode: null, createdAt: "", updatedAt: "", isDeleted: false });

        await purchaseRepo.create({ id: "p1", ownerUserId: userId, date: "2024-06-01", totalPaid: 10, status: 'completed', supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false });

        // Bought Bread 5 units
        await lineRepo.create({ id: "l1", purchaseId: "p1", genericItemId: "gen-bread", brandProductId: "bp-bread", qty: 5, unitPrice: 2, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false });

        const result = await service.getFrequentProducts(userId, 'units');
        expect(result.generics[0].name).toBe("Pan");
        expect(result.generics[0].value).toBe(5);
        expect(result.brands[0].name).toBe("Bimbo Blanco");
        expect(result.brands[0].value).toBe(5);
    });

    it("should retrieve price trends", async () => {
        const bpId = "bp-coke";
        await observationRepo.create({
            id: "obs1", ownerUserId: userId, brandProductId: bpId, supermarketId: "s1", unitPrice: 1.5, observedAt: "2024-01-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false
        });
        await observationRepo.create({
            id: "obs2", ownerUserId: userId, brandProductId: bpId, supermarketId: "s1", unitPrice: 1.8, observedAt: "2024-02-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false
        });

        const history = await service.getPriceHistory(userId, bpId);
        expect(history).toHaveLength(2);
        expect(history[0].price).toBe(1.5);
        expect(history[1].price).toBe(1.8);
    });

    it("should identify top spending products", async () => {
        await genericItemRepo.create({ id: "gen-expensive", ownerUserId: userId, canonicalName: "Laptop", primaryCategoryId: null, secondaryCategoryIds: [], aliases: [], imageUrl: null, createdAt: "", updatedAt: "", isDeleted: false });
        await purchaseRepo.create({ id: "p1", ownerUserId: userId, date: "2024-06-01", totalPaid: 1500, status: 'completed', supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false });
        await lineRepo.create({ id: "l1", purchaseId: "p1", genericItemId: "gen-expensive", brandProductId: null, qty: 1, unitPrice: 1500, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        const result = await service.getTopSpendingProducts(userId, 5);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Laptop");
        expect(result[0].value).toBe(1500);
    });

    it("should retrieve latest prices for a brand product", async () => {
        const bpId = "bp-coke";
        await observationRepo.create({ id: "obs1", ownerUserId: userId, brandProductId: bpId, supermarketId: "s1", unitPrice: 1.5, observedAt: "2024-01-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false });
        await observationRepo.create({ id: "obs2", ownerUserId: userId, brandProductId: bpId, supermarketId: "s1", unitPrice: 1.8, observedAt: "2024-02-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false });
        await observationRepo.create({ id: "obs3", ownerUserId: userId, brandProductId: bpId, supermarketId: "s2", unitPrice: 1.4, observedAt: "2024-01-15", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false });

        const latestPrices = await service.getLatestPrices(userId, bpId);
        expect(latestPrices).toHaveLength(2); // One per supermarket
        
        const s1Price = latestPrices.find(l => l.supermarketId === "s1");
        expect(s1Price?.price).toBe(1.8);
        expect(s1Price?.date).toBe("2024-02-01");
    });

    it("should retrieve generic price history from observations and purchases", async () => {
        const genId = "gen-juice";
        const bpId = "bp-juice";
        await brandProductRepo.create({ id: bpId, genericItemId: genId, ownerUserId: userId, brand: "Tampico", presentation: "1L", aliases: [], imageUrl: null, barcode: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        // From observation
        await observationRepo.create({ id: "obs1", ownerUserId: userId, brandProductId: bpId, supermarketId: "s1", unitPrice: 1.0, observedAt: "2024-01-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        // From purchase
        await purchaseRepo.create({ id: "p1", ownerUserId: userId, date: "2024-02-01T10:00:00Z", totalPaid: 1.2, status: 'completed', supermarketId: "s2", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false });
        await lineRepo.create({ id: "l1", purchaseId: "p1", genericItemId: genId, brandProductId: bpId, qty: 1, unitPrice: 1.2, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        const history = await service.getGenericPriceHistory(userId, genId);
        expect(history).toHaveLength(2);
        expect(history[0].price).toBe(1.0);
        expect(history[1].price).toBe(1.2);
    });

    it("should retrieve all generic price histories", async () => {
        const genId = "gen-juice";
        const bpId = "bp-juice";
        await genericItemRepo.create({ id: genId, ownerUserId: userId, canonicalName: "Jugo", primaryCategoryId: null, secondaryCategoryIds: [], aliases: [], imageUrl: null, createdAt: "", updatedAt: "", isDeleted: false });
        await brandProductRepo.create({ id: bpId, genericItemId: genId, ownerUserId: userId, brand: "Tampico", presentation: "1L", aliases: [], imageUrl: null, barcode: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        await observationRepo.create({ id: "obs1", ownerUserId: userId, brandProductId: bpId, supermarketId: "s1", unitPrice: 1.0, observedAt: "2024-01-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        const allHistories = await service.getAllGenericPriceHistories(userId);
        expect(allHistories[genId]).toHaveLength(1);
        expect(allHistories[genId][0].price).toBe(1.0);
    });

    it("should retrieve generic latest prices by supermarket", async () => {
        const genId = "gen-juice";
        const bpId1 = "bp-juice-1";
        const bpId2 = "bp-juice-2";
        await brandProductRepo.create({ id: bpId1, genericItemId: genId, ownerUserId: userId, brand: "Brand1", presentation: "1L", aliases: [], imageUrl: null, barcode: null, createdAt: "", updatedAt: "", isDeleted: false });
        await brandProductRepo.create({ id: bpId2, genericItemId: genId, ownerUserId: userId, brand: "Brand2", presentation: "1L", aliases: [], imageUrl: null, barcode: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        // Supermarket s1 has Brand1 at 1.0 and Brand2 at 0.8
        await observationRepo.create({ id: "obs1", ownerUserId: userId, brandProductId: bpId1, supermarketId: "s1", unitPrice: 1.0, observedAt: "2024-01-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false });
        await observationRepo.create({ id: "obs2", ownerUserId: userId, brandProductId: bpId2, supermarketId: "s1", unitPrice: 0.8, observedAt: "2024-01-01", currencyCode: "USD", sourcePurchaseId: null, createdAt: "", updatedAt: "", isDeleted: false });
        
        const latestPrices = await service.getGenericLatestPrices(userId, genId);
        expect(latestPrices).toHaveLength(1); // Only for s1
        expect(latestPrices[0].price).toBe(0.8); // Min price at s1
    });
});


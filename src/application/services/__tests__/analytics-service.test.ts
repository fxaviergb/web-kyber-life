
import { AnalyticsService } from "../analytics-service";
import { Purchase, PurchaseLine, PriceObservation, GenericItem, BrandProduct, Category, Unit, Supermarket } from "@/domain/entities";
import { InMemoryRepository } from "@/infrastructure/repositories/in-memory-repository";

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
    let genericItemRepo: InMemoryRepository<GenericItem>;
    let brandProductRepo: InMemoryRepository<BrandProduct>;
    let categoryRepo: InMemoryRepository<Category>;

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
        genericItemRepo = new InMemoryRepository<GenericItem>();
        brandProductRepo = new InMemoryRepository<BrandProduct>();
        categoryRepo = new InMemoryRepository<Category>();

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

        await purchaseRepo.create({
            id: "p1", ownerUserId: userId, date: "2024-06-01", totalPaid: 50, status: 'completed',
            supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false
        });

        await lineRepo.create({
            id: "l1", purchaseId: "p1", genericItemId: "gen-milk", brandProductId: null,
            qty: 2, unitPrice: 10, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false
        }); // 2 * 10 = 20 for "Comida"

        const result = await service.getCategorySpending(userId);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Comida");
        expect(result[0].value).toBe(20);
        expect(result[0].percentage).toBe(100);
    });

    it("should identify frequent products", async () => {
        await genericItemRepo.create({ id: "gen-bread", ownerUserId: userId, canonicalName: "Pan", primaryCategoryId: null, secondaryCategoryIds: [], aliases: [], imageUrl: null, createdAt: "", updatedAt: "", isDeleted: false });

        await purchaseRepo.create({
            id: "p1", ownerUserId: userId, date: "2024-06-01", totalPaid: 10, status: 'completed',
            supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false
        });
        await purchaseRepo.create({
            id: "p2", ownerUserId: userId, date: "2024-06-02", totalPaid: 10, status: 'completed',
            supermarketId: "s1", currencyCode: "USD", selectedTemplateIds: [], createdAt: "", updatedAt: "", isDeleted: false
        });

        // Bought Bread twice
        await lineRepo.create({ id: "l1", purchaseId: "p1", genericItemId: "gen-bread", brandProductId: null, qty: 1, unitPrice: 5, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false });
        await lineRepo.create({ id: "l2", purchaseId: "p2", genericItemId: "gen-bread", brandProductId: null, qty: 1, unitPrice: 5, checked: true, lineAmountOverride: null, note: null, unitId: null, createdAt: "", updatedAt: "", isDeleted: false });

        const result = await service.getFrequentProducts(userId, 'count');
        expect(result.generics[0].name).toBe("Pan");
        expect(result.generics[0].value).toBe(2);
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
});

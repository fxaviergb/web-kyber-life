
import { v4 } from "uuid";

// Mock uuid to avoid import crash and provide unique IDs
jest.mock("uuid", () => {
    let count = 0;
    return {
        v4: () => `mock-uuid-${++count}`
    };
});

import { PurchaseService } from "../purchase-service";
import { Purchase, PurchaseLine, PriceObservation, GenericItem } from "@/domain/entities";
import { InMemoryRepository } from "@/infrastructure/repositories/in-memory-repository";

const defaultBase = {
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    isDeleted: false
};

class MockLineRepo extends InMemoryRepository<PurchaseLine> {
    async findByPurchaseId(purchaseId: string): Promise<PurchaseLine[]> {
        return (await this.findAll()).filter(l => l.purchaseId === purchaseId);
    }
}

describe("PurchaseService - Price History", () => {
    let service: PurchaseService;
    let purchaseRepo: InMemoryRepository<Purchase>;
    let lineRepo: MockLineRepo;
    let observationRepo: InMemoryRepository<PriceObservation>;
    let genericItemRepo: InMemoryRepository<GenericItem>;

    beforeEach(() => {
        purchaseRepo = new InMemoryRepository<Purchase>();
        lineRepo = new MockLineRepo();
        observationRepo = new InMemoryRepository<PriceObservation>();
        genericItemRepo = new InMemoryRepository<GenericItem>();

        service = new PurchaseService(
            purchaseRepo as any,
            lineRepo as any,
            {} as any, // templateRepo
            {} as any, // templateItemRepo
            genericItemRepo as any,
            observationRepo as any, // 6th argument
            {} as any // brandProductRepo
        );
    });

    it("should create price observations for checked items with brand options upon completion", async () => {
        const userId = "user-1";
        const purchaseId = "purchase-1";
        const supermarketId = "sup-1";
        const genericId = "gen-1";
        const brandId = "brand-1";

        // Setup Purchase
        await purchaseRepo.create({
            id: purchaseId,
            ownerUserId: userId,
            supermarketId: supermarketId,
            date: "2024-01-01",
            currencyCode: "USD",
            selectedTemplateIds: [],
            totalPaid: null, // Initial
            status: "draft",
            ...defaultBase
        });

        // Setup Line 1: Checked, Brand Selected, Price set (Should create obs)
        await lineRepo.create({
            id: "line-1",
            purchaseId,
            genericItemId: genericId,
            brandProductId: brandId,
            qty: 2,
            unitId: null,
            unitPrice: 10.50,
            checked: true,
            lineAmountOverride: null,
            note: null,
            ...defaultBase
        });

        // Setup Line 2: Checked, No Brand (Generic only), Price set (Should NOT create obs)
        await lineRepo.create({
            id: "line-2",
            purchaseId,
            genericItemId: "gen-2",
            brandProductId: null, // No brand
            qty: 1,
            unitId: null,
            unitPrice: 5.00,
            checked: true,
            lineAmountOverride: null,
            note: null,
            ...defaultBase
        });

        // Setup Line 3: Unchecked, Brand set (Should NOT create obs)
        await lineRepo.create({
            id: "line-3",
            purchaseId,
            genericItemId: genericId,
            brandProductId: brandId,
            qty: 1,
            unitId: null,
            unitPrice: 10.50,
            checked: false,
            lineAmountOverride: null,
            note: null,
            ...defaultBase
        });

        // Action: Finish Purchase
        await service.finishPurchase(userId, purchaseId, 26.00);

        // Verify
        const observations = await observationRepo.findAll();
        // Expect only 1 observation (from Line 1)
        expect(observations).toHaveLength(1);
        expect(observations[0]).toMatchObject({
            ownerUserId: userId,
            brandProductId: brandId,
            supermarketId: supermarketId,
            currencyCode: "USD",
            unitPrice: 10.50,
            observedAt: "2024-01-01",
            sourcePurchaseId: purchaseId
        });
    });
});

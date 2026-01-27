
import { v4 } from "uuid";

// Mock uuid
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
    // Mock deleteByPurchaseId to verify behavior
    async deleteByPurchaseId(purchaseId: string): Promise<void> {
        const lines = await this.findAll();
        for (const line of lines) {
            if (line.purchaseId === purchaseId) {
                await this.delete(line.id);
            }
        }
    }
}

describe("PurchaseService - Deletion", () => {
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
            {} as any,
            {} as any,
            genericItemRepo as any,
            observationRepo as any,
            {} as any
        );
    });

    it("should delete a purchase and its lines", async () => {
        const userId = "user-1";
        const purchaseId = "purchase-1";

        // Setup Purchase
        await purchaseRepo.create({
            id: purchaseId,
            ownerUserId: userId,
            supermarketId: "sup-1",
            date: "2024-01-01",
            currencyCode: "USD",
            selectedTemplateIds: [],
            totalPaid: 100,
            status: "completed",
            ...defaultBase
        });

        // Setup Lines
        await lineRepo.create({
            id: "line-1",
            purchaseId,
            genericItemId: "gen-1",
            brandProductId: null,
            qty: 1,
            unitId: null,
            unitPrice: 10,
            checked: true,
            lineAmountOverride: null,
            note: null,
            ...defaultBase
        });

        // Verify existence
        expect(await purchaseRepo.findById(purchaseId)).not.toBeNull();
        expect((await lineRepo.findByPurchaseId(purchaseId))).toHaveLength(1);

        // Action: Delete
        await service.deletePurchase(userId, purchaseId);

        // Verify: Purchase should be null (findById filters by isDeleted in InMemoryRepo?)
        // InMemoryRepository.findById returns item if !isDeleted.
        const p = await purchaseRepo.findById(purchaseId);
        expect(p).toBeNull();

        // Verify: Lines should be deleted
        const lines = await lineRepo.findByPurchaseId(purchaseId);
        // lines are fetched using findAll -> filter !isDeleted.
        expect(lines).toHaveLength(0);
    });

    it("should prevent deleting another user's purchase", async () => {
        const userId = "user-1";
        const otherUserId = "user-2";
        const purchaseId = "purchase-1";

        await purchaseRepo.create({
            id: purchaseId,
            ownerUserId: otherUserId, // Owned by OTHER
            supermarketId: "sup-1",
            date: "2024-01-01",
            currencyCode: "USD",
            selectedTemplateIds: [],
            totalPaid: 100,
            status: "completed",
            ...defaultBase
        });

        await expect(service.deletePurchase(userId, purchaseId))
            .rejects.toThrow("Purchase not found");
    });
});

import { PurchaseService } from "@/application/services/purchase-service";
import { v4 as uuidv4 } from "uuid";

const mockPurchaseRepo = {
    create: jest.fn().mockReturnValue(Promise.resolve({})),
    findByOwnerId: jest.fn()
};
const mockLineRepo = {
    createMany: jest.fn().mockReturnValue(Promise.resolve([])),
    findByPurchaseId: jest.fn()
};
const mockTemplateRepo = { findById: jest.fn() };
const mockTemplateItemRepo = { findByTemplateId: jest.fn() };
const mockGenericItemRepo = { findById: jest.fn() };
const mockObservationRepo = { findByOwnerId: jest.fn() };
const mockBrandProductRepo = { findByOwnerId: jest.fn() };

describe("Purchase Recommendation Logic", () => {
    let service: PurchaseService;
    const userId = uuidv4();
    const supermarketId = uuidv4();
    const genericItemId = uuidv4();
    const brandProductId1 = uuidv4();

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PurchaseService(
            mockPurchaseRepo as any,
            mockLineRepo as any,
            mockTemplateRepo as any,
            mockTemplateItemRepo as any,
            mockGenericItemRepo as any,
            mockObservationRepo as any,
            mockBrandProductRepo as any
        );

        // Common Setup
        mockTemplateItemRepo.findByTemplateId.mockResolvedValue([
            { id: uuidv4(), genericItemId, defaultQty: 1 }
        ]);
        mockGenericItemRepo.findById.mockResolvedValue({ id: genericItemId, canonicalName: "Milk", globalPrice: 1.0 });
        mockBrandProductRepo.findByOwnerId.mockResolvedValue([
            { id: brandProductId1, genericItemId, brand: "BrandA" }
        ]);
    });

    it("should prioritize 'Last Bought' product", async () => {
        const purchaseId1 = uuidv4();

        // 1. History: Recently bought BrandA
        mockPurchaseRepo.findByOwnerId.mockResolvedValue([
            { id: purchaseId1, supermarketId, status: 'completed', date: "2024-01-01" }
        ]);
        mockLineRepo.findByPurchaseId.mockResolvedValue([
            { genericItemId, brandProductId: brandProductId1, unitPrice: 2.0 }
        ]);

        // 2. Observations: BrandA observed recently at 2.5
        mockObservationRepo.findByOwnerId.mockResolvedValue([
            { brandProductId: brandProductId1, supermarketId, unitPrice: 2.5, observedAt: "2024-01-02" }
        ]);

        await service.createPurchase(userId, supermarketId, "2024-02-01", [uuidv4()]);

        const linesArg = mockLineRepo.createMany.mock.calls[0][0];
        const line = linesArg[0];

        // Should use BrandA
        expect(line.brandProductId).toBe(brandProductId1);
        // Price: It matched Last Purchase. 
        // Logic currently fetches latest observation for that brand product if available.
        expect(line.unitPrice).toBe(2.5);
    });

    it("should fallback to 'Generic Global Price' when no history or observation", async () => {
        mockPurchaseRepo.findByOwnerId.mockResolvedValue([]);
        mockObservationRepo.findByOwnerId.mockResolvedValue([]);

        await service.createPurchase(userId, supermarketId, "2024-02-01", [uuidv4()]);

        const linesArg = mockLineRepo.createMany.mock.calls[0][0];
        const line = linesArg[0];

        expect(line.brandProductId).toBeNull();
        expect(line.unitPrice).toBe(1.0); // Global Price
    });
});

import { PurchaseService } from "@/application/services/purchase-service";
import { v4 as uuidv4 } from "uuid";

// Mock interfaces by casting simple objects
const mockPurchaseRepo = {
    create: jest.fn().mockImplementation(p => Promise.resolve(p)),
    findById: jest.fn(),
    update: jest.fn(),
    findByOwnerId: jest.fn(),
    findRecent: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn()
};

const mockLineRepo = {
    createMany: jest.fn().mockImplementation(lines => Promise.resolve(lines)),
    findByPurchaseId: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteByPurchaseId: jest.fn(),
    findAll: jest.fn()
};

const mockTemplateRepo = { findById: jest.fn() };
const mockTemplateItemRepo = {
    findByTemplateId: jest.fn()
};
const mockGenericItemRepo = {
    findById: jest.fn()
};
const mockObservationRepo = {
    create: jest.fn()
};

const mockBrandProductRepo = {
    findByOwnerId: jest.fn()
};

describe("Create Purchase Flow (Mocked)", () => {
    let service: PurchaseService;
    const userId = uuidv4();

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
    });

    it("should consolidate items from templates and apply global price", async () => {
        // Setup Mocks
        const supermarketId = uuidv4();
        const t1Id = uuidv4();
        const gItem1Id = uuidv4();

        // 1. Template Items
        mockTemplateItemRepo.findByTemplateId.mockResolvedValue([
            { id: uuidv4(), templateId: t1Id, genericItemId: gItem1Id, defaultQty: 2, defaultUnitId: null, sortOrder: 0 }
        ]);

        // 2. Generic Item with Global Price
        mockGenericItemRepo.findById.mockResolvedValue({
            id: gItem1Id,
            canonicalName: "Milk",
            globalPrice: 1.50,
            currencyCode: "USD"
        });

        // Execute
        const p = await service.createPurchase(userId, supermarketId, "2024-02-01", [t1Id]);

        // Verify
        expect(p.supermarketId).toBe(supermarketId);
        expect(p.status).toBe('draft');

        // Check Repo Calls
        expect(mockPurchaseRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            ownerUserId: userId,
            supermarketId: supermarketId
        }));

        expect(mockLineRepo.createMany).toHaveBeenCalledTimes(1);
        const linesArg = mockLineRepo.createMany.mock.calls[0][0];
        expect(linesArg).toHaveLength(1);
        expect(linesArg[0].genericItemId).toBe(gItem1Id);
        expect(linesArg[0].qty).toBe(2);
        expect(linesArg[0].unitPrice).toBe(1.50); // Validating global price fallback
    });
});

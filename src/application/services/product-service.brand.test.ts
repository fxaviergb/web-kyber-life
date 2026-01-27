import { ProductService } from "./product-service";
import { IGenericItemRepository, IBrandProductRepository, IPriceObservationRepository } from "@/domain/repositories";
import { BrandProduct, PriceObservation } from "@/domain/entities";

jest.mock("uuid", () => ({
    v4: () => "mock-uuid"
}));

// Mocks
const mockGenericItemRepo = {} as unknown as IGenericItemRepository;
const mockBrandProductRepo = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findByGenericItemId: jest.fn(),
} as unknown as IBrandProductRepository;
const mockPriceObservationRepo = {
    create: jest.fn(),
    findByOwnerId: jest.fn(),
} as unknown as IPriceObservationRepository;

describe("ProductService - Brand Products", () => {
    let service: ProductService;
    const userId = "user-123";
    const itemId = "generic-1";

    beforeEach(() => {
        service = new ProductService(mockGenericItemRepo, mockBrandProductRepo, mockPriceObservationRepo);
        jest.clearAllMocks();
    });

    it("should create brand product with global price", async () => {
        (mockBrandProductRepo.create as jest.Mock).mockImplementation(async (i) => i);

        const result = await service.createBrandProduct(
            userId,
            itemId,
            "Bimbo",
            "Integral",
            "img",
            5.50,
            "USD"
        );

        expect(result.globalPrice).toBe(5.50);
        expect(result.brand).toBe("Bimbo");
        expect(mockBrandProductRepo.create).toHaveBeenCalled();
    });

    it("should add price observation", async () => {
        const brandProductId = "bp-1";
        const supermarketId = "super-1";
        const existingProduct = { id: brandProductId, ownerUserId: userId };

        (mockBrandProductRepo.findById as jest.Mock).mockResolvedValue(existingProduct);
        (mockPriceObservationRepo.create as jest.Mock).mockImplementation(async (i) => i);

        const result = await service.addPriceObservation(
            userId,
            brandProductId,
            supermarketId,
            4.99,
            "USD"
        );

        expect(result.unitPrice).toBe(4.99);
        expect(result.sourcePurchaseId).toBeNull();
        expect(mockPriceObservationRepo.create).toHaveBeenCalled();
    });

    it("should get latest prices distinct by supermarket", async () => {
        const brandProductId = "bp-1";
        const s1 = "super-1";
        const s2 = "super-2";

        const obs1 = { id: "1", brandProductId, supermarketId: s1, unitPrice: 10, observedAt: "2023-01-01" };
        const obs2 = { id: "2", brandProductId, supermarketId: s1, unitPrice: 12, observedAt: "2023-01-02" }; // Newer
        const obs3 = { id: "3", brandProductId, supermarketId: s2, unitPrice: 15, observedAt: "2023-01-01" };

        (mockPriceObservationRepo.findByOwnerId as jest.Mock).mockResolvedValue([obs1, obs2, obs3]);

        const latest = await service.getLatestPrices(userId, brandProductId);

        expect(latest).toHaveLength(2);
        // Should have obs2 (newer for s1) and obs3 (s2)
        expect(latest).toContainEqual(obs2);
        expect(latest).toContainEqual(obs3);
        expect(latest).not.toContainEqual(obs1);
    });
});

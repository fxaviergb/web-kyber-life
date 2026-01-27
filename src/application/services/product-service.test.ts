import { ProductService } from "./product-service";
import { IGenericItemRepository, IBrandProductRepository } from "@/domain/repositories";
import { GenericItem, BrandProduct } from "@/domain/entities";

jest.mock("uuid", () => ({
    v4: () => "mock-uuid"
}));

// Mocks
const mockGenericItemRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
} as unknown as IGenericItemRepository;

const mockBrandProductRepo = {
    findByGenericItemId: jest.fn(),
    create: jest.fn(),
} as unknown as IBrandProductRepository;

describe("ProductService", () => {
    let service: ProductService;
    const userId = "user-123";

    beforeEach(() => {
        service = new ProductService(mockGenericItemRepo, mockBrandProductRepo);
        jest.clearAllMocks();
    });

    describe("Generic Items", () => {
        it("should create a generic item", async () => {
            const name = "Pan lactal";
            (mockGenericItemRepo.create as jest.Mock).mockImplementation(async (i) => i);

            const result = await service.createGenericItem(userId, name);

            expect(result.canonicalName).toBe(name);
            expect(result.ownerUserId).toBe(userId);
            expect(mockGenericItemRepo.create).toHaveBeenCalled();
        });

        it("should update a generic item", async () => {
            const itemId = "item-1";
            const existingItem: GenericItem = {
                id: itemId,
                ownerUserId: userId,
                canonicalName: "Old Name",
                aliases: [],
                primaryCategoryId: null,
                secondaryCategoryIds: [],
                imageUrl: null,
                createdAt: "",
                updatedAt: "",
                isDeleted: false
            };

            (mockGenericItemRepo.findById as jest.Mock).mockResolvedValue(existingItem);
            (mockGenericItemRepo.update as jest.Mock).mockImplementation(async (i) => i);

            const result = await service.updateGenericItem(userId, itemId, "New Name");

            expect(result.canonicalName).toBe("New Name");
            expect(mockGenericItemRepo.update).toHaveBeenCalled();
        });

        it("should delete a generic item", async () => {
            const itemId = "item-1";
            const existingItem: GenericItem = {
                id: itemId,
                ownerUserId: userId,
                canonicalName: "To Delete",
                aliases: [],
                primaryCategoryId: null,
                secondaryCategoryIds: [],
                imageUrl: null,
                createdAt: "",
                updatedAt: "",
                isDeleted: false
            };

            (mockGenericItemRepo.findById as jest.Mock).mockResolvedValue(existingItem);
            (mockGenericItemRepo.delete as jest.Mock).mockResolvedValue(undefined);

            await service.deleteGenericItem(userId, itemId);

            expect(mockGenericItemRepo.delete).toHaveBeenCalledWith(itemId);
        });

        it("should NOT delete other user's item", async () => {
            const itemId = "other-item-1";
            const existingItem: GenericItem = {
                id: itemId,
                ownerUserId: "other-user",
                canonicalName: "Base Item",
                aliases: [],
                primaryCategoryId: null,
                secondaryCategoryIds: [],
                imageUrl: null,
                createdAt: "",
                updatedAt: "",
                isDeleted: false
            };

            (mockGenericItemRepo.findById as jest.Mock).mockResolvedValue(existingItem);

            await expect(service.deleteGenericItem(userId, itemId)).rejects.toThrow("Cannot delete other user's item");
        });
    });
});

import { MasterDataService } from "./master-data-service";
import { ISupermarketRepository, ICategoryRepository, IUnitRepository } from "@/domain/repositories";
import { Supermarket, Category, Unit } from "@/domain/entities";

jest.mock("uuid", () => ({
    v4: () => "mock-uuid"
}));

// Mocks
const mockSupermarketRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByOwnerId: jest.fn(),
} as unknown as ISupermarketRepository;

const mockCategoryRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAllBaseAndUser: jest.fn(),
} as unknown as ICategoryRepository;

const mockUnitRepo = {
    findAllBaseAndUser: jest.fn(),
} as unknown as IUnitRepository;

describe("MasterDataService - Categories", () => {
    let service: MasterDataService;
    const userId = "user-123";

    beforeEach(() => {
        service = new MasterDataService(mockSupermarketRepo, mockCategoryRepo, mockUnitRepo);
        jest.clearAllMocks();
    });

    it("should pass dummy", () => {
        expect(true).toBe(true);
    });
    /*
    it("should create a personal category", async () => {
       // ...
    });
    */

    it("should update a personal category", async () => {
        const catId = "cat-1";
        const existingCat: Category = {
            id: catId,
            ownerUserId: userId,
            name: "Old Name",
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockCategoryRepo.findById as jest.Mock).mockResolvedValue(existingCat);
        (mockCategoryRepo.update as jest.Mock).mockImplementation(async (c) => c);

        const result = await service.updateCategory(userId, catId, "New Name");

        expect(result.name).toBe("New Name");
        expect(mockCategoryRepo.update).toHaveBeenCalled();
    });

    it("should NOT update a base category", async () => {
        const catId = "base-cat-1";
        const baseCat: Category = {
            id: catId,
            ownerUserId: "system", // Not the user
            name: "Base Cat",
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockCategoryRepo.findById as jest.Mock).mockResolvedValue(baseCat);

        await expect(service.updateCategory(userId, catId, "Hacked")).rejects.toThrow("Cannot edit base or other user's category");
    });

    it("should delete a personal category", async () => {
        const catId = "cat-1";
        const existingCat: Category = {
            id: catId,
            ownerUserId: userId,
            name: "To Delete",
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockCategoryRepo.findById as jest.Mock).mockResolvedValue(existingCat);
        (mockCategoryRepo.delete as jest.Mock).mockResolvedValue(undefined);

        await service.deleteCategory(userId, catId);

        expect(mockCategoryRepo.delete).toHaveBeenCalledWith(catId);
    });

    it("should NOT delete a base category", async () => {
        const catId = "base-cat-1";
        const baseCat: Category = {
            id: catId,
            ownerUserId: "system",
            name: "Base Cat",
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockCategoryRepo.findById as jest.Mock).mockResolvedValue(baseCat);

        await expect(service.deleteCategory(userId, catId)).rejects.toThrow("Cannot delete base or other user's category");
    });
});

import { ProductService } from "./product-service";
import { IGenericItemRepository, IBrandProductRepository } from "@/domain/repositories";
import { GenericItem } from "@/domain/entities";

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

const mockBrandProductRepo = {} as unknown as IBrandProductRepository;

describe("ProductService - Aliases", () => {
    let service: ProductService;
    const userId = "user-123";

    beforeEach(() => {
        service = new ProductService(mockGenericItemRepo, mockBrandProductRepo);
        jest.clearAllMocks();
    });

    it("should update aliases via updateGenericItem", async () => {
        const itemId = "item-1";
        const existingItem: GenericItem = {
            id: itemId,
            ownerUserId: userId,
            canonicalName: "Pan de Molde",
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

        const newAliases = ["Pan Lactal", "Sandwich Bread"];
        const result = await service.updateGenericItem(
            userId,
            itemId,
            "Pan de Molde",
            undefined,
            undefined,
            undefined,
            newAliases
        );

        expect(result.aliases).toEqual(newAliases);
        expect(mockGenericItemRepo.update).toHaveBeenCalled();

        // Verify mock update was called with correct object
        const updatedItem = (mockGenericItemRepo.update as jest.Mock).mock.calls[0][0];
        expect(updatedItem.aliases).toEqual(newAliases);
    });

    it("should add alias via addAlias method", async () => {
        const itemId = "item-1";
        const existingItem: GenericItem = {
            id: itemId,
            ownerUserId: userId,
            canonicalName: "Pan de Molde",
            aliases: ["Existing"],
            primaryCategoryId: null,
            secondaryCategoryIds: [],
            imageUrl: null,
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockGenericItemRepo.findById as jest.Mock).mockResolvedValue(existingItem);
        (mockGenericItemRepo.update as jest.Mock).mockImplementation(async (i) => i);

        const result = await service.addAlias(userId, itemId, "New Alias");

        expect(result.aliases).toContain("Existing");
        expect(result.aliases).toContain("New Alias");
    });
});

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
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAllBaseAndUser: jest.fn(),
} as unknown as IUnitRepository;

describe("MasterDataService - Units", () => {
    let service: MasterDataService;
    const userId = "user-123";

    beforeEach(() => {
        service = new MasterDataService(mockSupermarketRepo, mockCategoryRepo, mockUnitRepo);
        jest.clearAllMocks();
    });

    it("should create a personal unit", async () => {
        const unitName = "My Unit";
        const unitSymbol = "mu";
        (mockUnitRepo.create as jest.Mock).mockImplementation(async (u) => u);

        const result = await service.createUnit(userId, unitName, unitSymbol);

        expect(result.name).toBe(unitName);
        expect(result.symbol).toBe(unitSymbol);
        expect(result.ownerUserId).toBe(userId);
        expect(mockUnitRepo.create).toHaveBeenCalled();
    });

    it("should update a personal unit", async () => {
        const unitId = "unit-1";
        const existingUnit: Unit = {
            id: unitId,
            ownerUserId: userId,
            name: "Old Name",
            symbol: "old",
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockUnitRepo.findById as jest.Mock).mockResolvedValue(existingUnit);
        (mockUnitRepo.update as jest.Mock).mockImplementation(async (u) => u);

        const result = await service.updateUnit(userId, unitId, "New Name", "new");

        expect(result.name).toBe("New Name");
        expect(result.symbol).toBe("new");
        expect(mockUnitRepo.update).toHaveBeenCalled();
    });

    it("should NOT update a base unit", async () => {
        const unitId = "base-unit-1";
        const baseUnit: Unit = {
            id: unitId,
            ownerUserId: "system", // Not the user
            name: "Base Unit",
            symbol: "kg",
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockUnitRepo.findById as jest.Mock).mockResolvedValue(baseUnit);

        await expect(service.updateUnit(userId, unitId, "Hacked")).rejects.toThrow("Cannot edit base or other user's unit");
    });

    it("should delete a personal unit", async () => {
        const unitId = "unit-1";
        const existingUnit: Unit = {
            id: unitId,
            ownerUserId: userId,
            name: "To Delete",
            symbol: null,
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockUnitRepo.findById as jest.Mock).mockResolvedValue(existingUnit);
        (mockUnitRepo.delete as jest.Mock).mockResolvedValue(undefined);

        await service.deleteUnit(userId, unitId);

        expect(mockUnitRepo.delete).toHaveBeenCalledWith(unitId);
    });

    it("should NOT delete a base unit", async () => {
        const unitId = "base-unit-1";
        const baseUnit: Unit = {
            id: unitId,
            ownerUserId: null, // System base unit
            name: "Base Unit",
            symbol: "kg",
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        };

        (mockUnitRepo.findById as jest.Mock).mockResolvedValue(baseUnit);

        await expect(service.deleteUnit(userId, unitId)).rejects.toThrow("Cannot delete base or other user's unit");
    });
});

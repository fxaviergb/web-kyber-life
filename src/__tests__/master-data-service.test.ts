import { MasterDataService } from "@/application/services/master-data-service";
import { InMemorySupermarketRepository, InMemoryCategoryRepository, InMemoryUnitRepository } from "@/infrastructure/repositories/implementations";
import { Supermarket } from "@/domain/entities";
import { v4 as uuidv4 } from "uuid";

describe("MasterDataService", () => {
    let service: MasterDataService;
    let supermarketRepo: InMemorySupermarketRepository;
    let categoryRepo: InMemoryCategoryRepository;
    let unitRepo: InMemoryUnitRepository;
    const userId = uuidv4();

    beforeEach(() => {
        supermarketRepo = new InMemorySupermarketRepository();
        categoryRepo = new InMemoryCategoryRepository();
        unitRepo = new InMemoryUnitRepository();
        service = new MasterDataService(supermarketRepo, categoryRepo, unitRepo);
    });

    // --- Supermarket CRUD Tests ---

    it("should create a supermarket", async () => {
        const s = await service.createSupermarket(userId, "Walmart", "123 Main St");
        expect(s).toBeDefined();
        expect(s.id).toBeDefined();
        expect(s.name).toBe("Walmart");
        expect(s.address).toBe("123 Main St");
        expect(s.ownerUserId).toBe(userId);
    });

    it("should list supermarkets only for user", async () => {
        await service.createSupermarket(userId, "My Store");
        const otherId = uuidv4();
        await service.createSupermarket(otherId, "Other Store");

        const list = await service.getSupermarkets(userId);
        expect(list).toHaveLength(1);
        expect(list[0].name).toBe("My Store");
    });

    it("should update a supermarket", async () => {
        const s = await service.createSupermarket(userId, "Old Name");
        const updated = await service.updateSupermarket(userId, s.id, { name: "New Name" });
        expect(updated.name).toBe("New Name");

        const fetched = (await service.getSupermarkets(userId)).find(i => i.id === s.id);
        expect(fetched?.name).toBe("New Name");
    });

    it("should soft delete a supermarket", async () => {
        const s = await service.createSupermarket(userId, "Delete Me");
        await service.deleteSupermarket(userId, s.id);

        const list = await service.getSupermarkets(userId);
        expect(list).toHaveLength(0); // Should be filtered out

        // Verify it still exists in repo if we check backend specifically, but filtered
        // In this implementation logic, it mimics hard delete for the service view.
    });

    it("should throw when updating other user supermarket", async () => {
        const otherId = uuidv4();
        const s = await service.createSupermarket(otherId, "Not Mine");

        await expect(service.updateSupermarket(userId, s.id, { name: "Hacked" }))
            .rejects.toThrow("Supermarket not found");
    });
});

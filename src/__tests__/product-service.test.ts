import { ProductService } from "@/application/services/product-service";
import { InMemoryGenericItemRepository, InMemoryBrandProductRepository } from "@/infrastructure/repositories/implementations";
import { v4 as uuidv4 } from "uuid";

describe("ProductService", () => {
    let service: ProductService;
    let genericRepo: InMemoryGenericItemRepository;
    let brandRepo: InMemoryBrandProductRepository;
    const userId = uuidv4();

    beforeEach(() => {
        genericRepo = new InMemoryGenericItemRepository();
        brandRepo = new InMemoryBrandProductRepository();
        service = new ProductService(genericRepo, brandRepo);
    });

    it("should create and find generic items", async () => {
        await service.createGenericItem(userId, "Milk");
        const items = await service.searchGenericItems(userId, "Mil");
        expect(items).toHaveLength(1);
        expect(items[0].canonicalName).toBe("Milk");
    });

    it("should create brand products", async () => {
        const item = await service.createGenericItem(userId, "Cheese");
        const brand = await service.createBrandProduct(userId, item.id, "Kraft", "200g");

        expect(brand.brand).toBe("Kraft");
        expect(brand.genericItemId).toBe(item.id);

        const list = await service.getBrandProducts(userId, item.id);
        expect(list).toHaveLength(1);
    });
});

import { ProductService } from "@/application/services/product-service";
import { PurchaseService } from "@/application/services/purchase-service";
import { TemplateService } from "@/application/services/template-service";
import {
    InMemoryGenericItemRepository,
    InMemoryBrandProductRepository,
    InMemoryPriceObservationRepository,
    InMemoryPurchaseRepository,
    InMemoryPurchaseLineRepository,
    InMemoryTemplateRepository,
    InMemoryTemplateItemRepository
} from "@/infrastructure/repositories/implementations";
import { v4 as uuidv4 } from "uuid";

describe("Global Price Feature (Manual Instantiation)", () => {
    let productService: ProductService;
    let purchaseService: PurchaseService;
    let templateService: TemplateService;

    const userId = uuidv4();

    beforeEach(() => {
        const genericItemRepo = new InMemoryGenericItemRepository();
        const brandProductRepo = new InMemoryBrandProductRepository();
        const priceObservationRepo = new InMemoryPriceObservationRepository();
        const purchaseRepo = new InMemoryPurchaseRepository();
        const lineRepo = new InMemoryPurchaseLineRepository();
        const templateRepo = new InMemoryTemplateRepository();
        const templateItemRepo = new InMemoryTemplateItemRepository();

        productService = new ProductService(genericItemRepo, brandProductRepo, priceObservationRepo);
        templateService = new TemplateService(templateRepo, templateItemRepo);

        purchaseService = new PurchaseService(
            purchaseRepo,
            lineRepo,
            templateRepo,
            templateItemRepo,
            genericItemRepo,
            priceObservationRepo
        );
    });

    it("should set global price on generic item and use it in purchase", async () => {
        // 1. Create Generic Item
        const item = await productService.createGenericItem(userId, "Milk", undefined, undefined);
        expect(item.globalPrice).toBeNull();

        // 2. Set Global Price
        await productService.updateGenericItem(
            userId, item.id, "Milk", undefined, undefined, undefined, undefined,
            1.50, "USD"
        );
        const updatedItem = await productService.getGenericItem(userId, item.id);
        expect(updatedItem?.globalPrice).toBe(1.50);

        // 3. Create Template
        const template = await templateService.createTemplate(userId, "Weekly");
        await templateService.addTemplateItem(userId, template.id, item.id, 2, undefined);

        // 4. Create Purchase using Template
        const purchase = await purchaseService.createPurchase(userId, uuidv4(), "2024-01-01", [template.id]);

        // 5. Verify Line Price inherited Global Price
        const result = await purchaseService.getPurchase(userId, purchase.id);
        expect(result).not.toBeNull();
        const { lines } = result!;
        expect(lines).toHaveLength(1);
        expect(lines[0].genericItemId).toBe(item.id);
        expect(lines[0].unitPrice).toBe(1.50);
    });

    it("should reflect new global price in subsequent purchases", async () => {
        const item = await productService.createGenericItem(userId, "Bread", undefined, undefined);

        // 1. Set initial price 2.00
        await productService.updateGenericItem(userId, item.id, "Bread", undefined, undefined, undefined, undefined, 2.00, "USD");

        // 2. Purchase 1
        const t1 = await templateService.createTemplate(userId, "T1");
        await templateService.addTemplateItem(userId, t1.id, item.id);

        const p1 = await purchaseService.createPurchase(userId, uuidv4(), "2024-01-01", [t1.id]);
        const lines1 = (await purchaseService.getPurchase(userId, p1.id))!.lines;
        expect(lines1[0].unitPrice).toBe(2.00);

        // 3. Update Global Price to 2.50
        await productService.updateGenericItem(userId, item.id, "Bread", undefined, undefined, undefined, undefined, 2.50, "USD");

        // 4. Purchase 2
        const p2 = await purchaseService.createPurchase(userId, uuidv4(), "2024-01-02", [t1.id]);
        const lines2 = (await purchaseService.getPurchase(userId, p2.id))!.lines;
        expect(lines2[0].unitPrice).toBe(2.50);
    });
});

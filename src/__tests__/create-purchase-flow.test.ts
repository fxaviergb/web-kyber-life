import { PurchaseService } from "@/application/services/purchase-service";
import { TemplateService } from "@/application/services/template-service";
import { ProductService } from "@/application/services/product-service";
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

describe("Create Purchase Flow", () => {
    let purchaseService: PurchaseService;
    let templateService: TemplateService;
    let productService: ProductService;

    // Repos
    let purchaseRepo: InMemoryPurchaseRepository;
    let lineRepo: InMemoryPurchaseLineRepository;
    let genericItemRepo: InMemoryGenericItemRepository;
    let templateRepo: InMemoryTemplateRepository;
    let templateItemRepo: InMemoryTemplateItemRepository;

    const userId = uuidv4();

    beforeEach(() => {
        purchaseRepo = new InMemoryPurchaseRepository();
        lineRepo = new InMemoryPurchaseLineRepository();
        genericItemRepo = new InMemoryGenericItemRepository();
        templateRepo = new InMemoryTemplateRepository();
        templateItemRepo = new InMemoryTemplateItemRepository();

        productService = new ProductService(
            genericItemRepo,
            new InMemoryBrandProductRepository(),
            new InMemoryPriceObservationRepository()
        );

        templateService = new TemplateService(templateRepo, templateItemRepo);

        purchaseService = new PurchaseService(
            purchaseRepo,
            lineRepo,
            templateRepo,
            templateItemRepo,
            genericItemRepo,
            new InMemoryPriceObservationRepository(),
            new InMemoryBrandProductRepository()
        );
    });

    it("should create purchase with consolidated items from multiple templates", async () => {
        // 1. Setup Data
        // Create 2 Generic Items
        const item1 = await productService.createGenericItem(userId, "Milk", undefined, undefined);
        await productService.updateGenericItem(userId, item1.id, "Milk", undefined, undefined, undefined, undefined, 1.50, "USD");

        const item2 = await productService.createGenericItem(userId, "Bread", undefined, undefined);
        // Item 2 has NO global price

        // Create Template A: Milk (2)
        const t1 = await templateService.createTemplate(userId, "Breakfast");
        await templateService.addTemplateItem(userId, t1.id, item1.id, 2);

        // Create Template B: Bread (1) + Milk (1) (Overlap)
        const t2 = await templateService.createTemplate(userId, "Snack");
        await templateService.addTemplateItem(userId, t2.id, item2.id, 1);
        await templateService.addTemplateItem(userId, t2.id, item1.id, 1);

        // 2. Execute Action Logic (Service Call)
        const supermarketId = uuidv4();
        const purchase = await purchaseService.createPurchase(userId, supermarketId, "2024-02-01", [t1.id, t2.id]);

        // 3. Verify Header
        expect(purchase.status).toBe('draft');
        expect(purchase.supermarketId).toBe(supermarketId);

        // 4. Verify Lines
        const lines = (await purchaseService.getPurchase(userId, purchase.id))!.lines;

        // Should have 2 lines (Milk, Bread) - Consolidated by GenericItem
        expect(lines).toHaveLength(2);

        const milkLine = lines.find(l => l.genericItemId === item1.id);
        const breadLine = lines.find(l => l.genericItemId === item2.id);

        expect(milkLine).toBeDefined();
        expect(breadLine).toBeDefined();

        // Verify Price Fallback
        expect(milkLine?.unitPrice).toBe(1.50); // From Global Price
        expect(breadLine?.unitPrice).toBeNull(); // No global price

        // Note: Qty logic in simple consolidation might just take first found or overwrite.
        // My implementation takes "first encountered" if I recall. 
        // T1 processed first -> Milk Qty 2. 
        // T2 processed second -> Milk skipped (already in map).
        // Let's verify this behavior.
        expect(milkLine?.qty).toBe(2);
        it("should apply recommendation from history", async () => {
            // 1. Setup Data
            const item = await productService.createGenericItem(userId, "Coffee", undefined, undefined);
            const brandA = await productService.createBrandProduct(userId, item.id, "Brand A", "500g", undefined, undefined, "USD");
            const supermarketId = uuidv4();

            // 2. Create history: A completed purchase with Brand A
            const pastPurchase = await purchaseService.createPurchase(userId, supermarketId, "2024-01-01", []);
            // Manually add line
            const line = await lineRepo.create({
                id: uuidv4(),
                purchaseId: pastPurchase.id,
                genericItemId: item.id,
                brandProductId: brandA.id,
                qty: 1,
                unitId: null,
                unitPrice: 10,
                checked: true,
                lineAmountOverride: null,
                note: null
            });
            await purchaseService.finishPurchase(userId, pastPurchase.id, 10);

            // 3. Create New Purchase with Template containing "Coffee"
            const t1 = await templateService.createTemplate(userId, "Morning");
            await templateService.addTemplateItem(userId, t1.id, item.id, 1);

            const newPurchase = await purchaseService.createPurchase(userId, supermarketId, "2024-02-01", [t1.id]);

            // 4. Verify Recommendation
            const newLines = (await purchaseService.getPurchase(userId, newPurchase.id))!.lines;
            const coffeeLine = newLines.find(l => l.genericItemId === item.id);

            expect(coffeeLine).toBeDefined();
            // Should recommend Brand A
            expect(coffeeLine?.brandProductId).toBe(brandA.id);
        });
    });
});

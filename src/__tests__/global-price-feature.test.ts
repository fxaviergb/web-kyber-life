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

describe("Global Price Feature (Fresh File)", () => {
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
        const item = await productService.createGenericItem(userId, "Milk", undefined, undefined);
        await productService.updateGenericItem(userId, item.id, "Milk", undefined, undefined, undefined, undefined, 1.50, "USD");

        const template = await templateService.createTemplate(userId, "Weekly");
        await templateService.addTemplateItem(userId, template.id, item.id, 2, undefined);

        const purchase = await purchaseService.createPurchase(userId, uuidv4(), "2024-01-01", [template.id]);

        const { lines } = (await purchaseService.getPurchase(userId, purchase.id))!;
        expect(lines[0].unitPrice).toBe(1.50);
    });
});

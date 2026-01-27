
import { PurchaseService } from "@/application/services/purchase-service";
import {
    InMemoryPurchaseRepository,
    InMemoryPurchaseLineRepository,
    InMemoryTemplateRepository,
    InMemoryTemplateItemRepository,
    InMemoryGenericItemRepository,
    InMemoryPriceObservationRepository,
    InMemoryBrandProductRepository
} from "@/infrastructure/repositories/implementations";
import { v4 as uuidv4 } from "uuid";

describe("PurchaseService", () => {
    let purchaseService: PurchaseService;
    let purchaseRepo: InMemoryPurchaseRepository;
    let lineRepo: InMemoryPurchaseLineRepository;
    let templateRepo: InMemoryTemplateRepository;
    let templateItemRepo: InMemoryTemplateItemRepository;
    let genericItemRepo: InMemoryGenericItemRepository;
    let obsRepo: InMemoryPriceObservationRepository;
    let brandRepo: InMemoryBrandProductRepository;

    const userId = uuidv4();
    const supermarketId = uuidv4();

    beforeEach(() => {
        purchaseRepo = new InMemoryPurchaseRepository();
        lineRepo = new InMemoryPurchaseLineRepository();
        templateRepo = new InMemoryTemplateRepository();
        templateItemRepo = new InMemoryTemplateItemRepository();
        genericItemRepo = new InMemoryGenericItemRepository();
        obsRepo = new InMemoryPriceObservationRepository();
        brandRepo = new InMemoryBrandProductRepository();

        purchaseService = new PurchaseService(purchaseRepo, lineRepo, templateRepo, templateItemRepo, genericItemRepo, obsRepo, brandRepo);
    });

    it("should create a purchase from templates consolidating items", async () => {
        // Setup Template & Items
        const templateId = uuidv4();
        const itemId1 = uuidv4();
        const itemId2 = uuidv4();

        await templateItemRepo.create({ id: uuidv4(), templateId, genericItemId: itemId1, defaultQty: 1, defaultUnitId: null, sortOrder: 0 });
        await templateItemRepo.create({ id: uuidv4(), templateId, genericItemId: itemId2, defaultQty: 2, defaultUnitId: null, sortOrder: 0 });

        const purchase = await purchaseService.createPurchase(userId, supermarketId, "2024-01-01", [templateId]);

        expect(purchase).toBeDefined();
        expect(purchase.status).toBe('draft');

        const lines = await lineRepo.findByPurchaseId(purchase.id);
        expect(lines).toHaveLength(2);
        expect(lines.find(l => l.genericItemId === itemId1)?.qty).toBe(1);
        expect(lines.find(l => l.genericItemId === itemId2)?.qty).toBe(2);
    });

    it("should finish purchase and create price observations", async () => {
        // Manually setup a purchase
        const purchase = await purchaseService.createPurchase(userId, supermarketId, "2024-01-01", []);

        // Create a checked line with price
        const brandProductId = uuidv4();
        const lineId = uuidv4();
        await lineRepo.create({
            id: lineId,
            purchaseId: purchase.id,
            genericItemId: uuidv4(),
            brandProductId: brandProductId,
            qty: 1,
            unitId: null,
            unitPrice: 10.50,
            checked: true,
            lineAmountOverride: null,
            note: null
        });

        // Finish
        await purchaseService.finishPurchase(userId, purchase.id, 10.50);

        const updated = await purchaseRepo.findById(purchase.id);
        expect(updated?.status).toBe('completed');
        expect(updated?.totalPaid).toBe(10.50);

        // Verify observation
        const obs = await obsRepo.findAll();
        expect(obs).toHaveLength(1);
        expect(obs[0].brandProductId).toBe(brandProductId);
        expect(obs[0].unitPrice).toBe(10.50);
    });

    it("should fail to finish if checked item has no price", async () => {
        const purchase = await purchaseService.createPurchase(userId, supermarketId, "2024-01-01", []);
        const lineId = uuidv4();
        await lineRepo.create({
            id: lineId,
            purchaseId: purchase.id,
            genericItemId: uuidv4(),
            brandProductId: null,
            qty: 1,
            unitId: null,
            unitPrice: null, // No Price
            checked: true,   // Checked!
            lineAmountOverride: null,
            note: null
        });

        await expect(purchaseService.finishPurchase(userId, purchase.id, 10))
            .rejects.toThrow(/missing price/);
    });
});

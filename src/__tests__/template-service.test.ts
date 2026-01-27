import { TemplateService } from "@/application/services/template-service";
import { InMemoryTemplateRepository, InMemoryTemplateItemRepository } from "@/infrastructure/repositories/implementations";
import { v4 as uuidv4 } from "uuid";

describe("TemplateService", () => {
    let service: TemplateService;
    let templateRepo: InMemoryTemplateRepository;
    let itemRepo: InMemoryTemplateItemRepository;
    const userId = uuidv4();

    beforeEach(() => {
        templateRepo = new InMemoryTemplateRepository();
        itemRepo = new InMemoryTemplateItemRepository();
        service = new TemplateService(templateRepo, itemRepo);
    });

    it("should create template", async () => {
        const t = await service.createTemplate(userId, "Weekly", []);
        expect(t.name).toBe("Weekly");
        expect(t.id).toBeDefined();
    });

    it("should add items to template", async () => {
        const t = await service.createTemplate(userId, "Weekly", []);
        const genericItemId = uuidv4();

        await service.addTemplateItem(userId, t.id, genericItemId);

        const items = await service.getTemplateItems(userId, t.id);
        expect(items).toHaveLength(1);
        expect(items[0].genericItemId).toBe(genericItemId);
    });

    it("should update template item defaults", async () => {
        const t = await service.createTemplate(userId, "Weekly", []);
        const genericItemId = uuidv4();
        const item = await service.addTemplateItem(userId, t.id, genericItemId);

        await service.updateTemplateItem(userId, t.id, item.id, {
            defaultQty: 5
        });

        const items = await service.getTemplateItems(userId, t.id);
        expect(items[0].defaultQty).toBe(5);
    });

    it("should remove items from template", async () => {
        const t = await service.createTemplate(userId, "Weekly", []);
        const genericItemId = uuidv4();
        const item = await service.addTemplateItem(userId, t.id, genericItemId);

        await service.removeTemplateItem(userId, t.id, item.id);

        const items = await service.getTemplateItems(userId, t.id);
        expect(items).toHaveLength(0);
    });

    it("should delete template and its items", async () => {
        const t = await service.createTemplate(userId, "To Delete", []);
        const item = await service.addTemplateItem(userId, t.id, uuidv4());

        await service.deleteTemplate(userId, t.id);

        const found = await service.getTemplate(userId, t.id);
        expect(found).toBeNull();
    });
});

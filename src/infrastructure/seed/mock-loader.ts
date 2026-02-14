import fs from "fs";
import path from "path";
import {
    IUserRepository,
    ISupermarketRepository,
    IGenericItemRepository,
    IPurchaseRepository,
    ICategoryRepository,
    ITemplateRepository,
    ITemplateItemRepository
} from "@/domain/repositories";

export async function loadMockData(
    userRepo: IUserRepository,
    supermarketRepo: ISupermarketRepository,
    genericItemRepo: IGenericItemRepository,
    purchaseRepo: IPurchaseRepository,
    categoryRepo: ICategoryRepository,
    templateRepo: ITemplateRepository,
    templateItemRepo: ITemplateItemRepository,
    userId: string = "00000000-0000-0000-0000-000000000000"
) {
    try {
        const mockDir = path.join(process.cwd(), "src/infrastructure/data/mock");

        // 1. Supermarkets
        // If file exists load it, else create defaults
        const supermarketsPath = path.join(mockDir, "supermarkets.json");
        let supermarkets: any[] = [];
        if (fs.existsSync(supermarketsPath)) {
            supermarkets = JSON.parse(fs.readFileSync(supermarketsPath, "utf-8"));
        } else {
            // Default seeding if no file
            supermarkets = [
                { id: "s1", ownerUserId: userId, name: "Supermaxi", address: "Av. 12 de Octubre", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false },
                { id: "s2", ownerUserId: userId, name: "Mi Comisariato", address: "Centro Comercial", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false }
            ];
        }

        for (const sm of supermarkets) {
            // Override owner if it's the default test user logic
            if (!sm.ownerUserId) sm.ownerUserId = userId;
            await supermarketRepo.create(sm);
        }
        console.log(`[MOCK] Loaded ${supermarkets.length} supermarkets.`);

        // 2. Generic Items (Products)
        const itemsPath = path.join(mockDir, "generic-items.json");
        let items: any[] = [];
        if (fs.existsSync(itemsPath)) {
            items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
        } else {
            // Create some default items linked to existing base categories (assuming IDs or Names)
            // For simplicity in V1 Memory, we might need to lookup category IDs or just allow null if strict FK not enforced in memory
            items = [
                { id: "i1", ownerUserId: userId, canonicalName: "Leche Entera", aliases: ["Leche", "Vita"], primaryCategoryId: null, secondaryCategoryIds: [], imageUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false },
                { id: "i2", ownerUserId: userId, canonicalName: "Arroz Flor", aliases: ["Arroz"], primaryCategoryId: null, secondaryCategoryIds: [], imageUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false },
                { id: "i3", ownerUserId: userId, canonicalName: "Atún Van Camps", aliases: ["Atun"], primaryCategoryId: null, secondaryCategoryIds: [], imageUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false }
            ];
        }

        for (const item of items) {
            if (!item.ownerUserId) item.ownerUserId = userId;
            await genericItemRepo.create(item);
        }
        console.log(`[MOCK] Loaded ${items.length} generic items.`);

        // 3. Templates (Shopping Lists)
        const templatesPath = path.join(mockDir, "templates.json");
        let templates: any[] = [];
        if (fs.existsSync(templatesPath)) {
            templates = JSON.parse(fs.readFileSync(templatesPath, "utf-8"));
        } else {
            templates = [
                { id: "t1", ownerUserId: userId, name: "Compras Mensuales", tags: ["casa", "mensual"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false },
                { id: "t2", ownerUserId: userId, name: "Asado Fin de Semana", tags: ["social"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false }
            ];
        }

        for (const t of templates) {
            if (!t.ownerUserId) t.ownerUserId = userId;
            await templateRepo.create(t);
        }
        console.log(`[MOCK] Loaded ${templates.length} templates.`);

        // 4. Template Items
        // If we generated defaults, we should populate them too.
        // Check if template items exist for this template, simple check
        const tItems = await templateItemRepo.findByTemplateId("t1");
        if (tItems.length === 0 && !fs.existsSync(templatesPath)) {
            // Add items to "Compras Mensuales"
            await templateItemRepo.create({ id: "ti1", templateId: "t1", genericItemId: "i1", defaultQty: 6, defaultUnitId: null, sortOrder: 1 }); // Leche
            await templateItemRepo.create({ id: "ti2", templateId: "t1", genericItemId: "i2", defaultQty: 2, defaultUnitId: null, sortOrder: 2 }); // Arroz
            await templateItemRepo.create({ id: "ti3", templateId: "t1", genericItemId: "i3", defaultQty: 5, defaultUnitId: null, sortOrder: 3 }); // Atun
            console.log(`[MOCK] Generated default template items.`);
        }

        console.log("Mock data loading complete.");

    } catch (error) {
        console.error("Failed to load mock data:", error);
    }
}

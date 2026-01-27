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
    templateItemRepo: ITemplateItemRepository
) {
    try {
        const mockDir = path.join(process.cwd(), "src/infrastructure/data/mock");

        // Load Users
        const usersPath = path.join(mockDir, "users.json");
        if (fs.existsSync(usersPath)) {
            const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
            for (const user of users) {
                // Ensure plain text password for simplified auth
                await userRepo.create(user);
            }
            console.log(`[MOCK] Loaded ${users.length} users.`);
        }

        // Load Supermarkets
        const supermarketsPath = path.join(mockDir, "supermarkets.json");
        if (fs.existsSync(supermarketsPath)) {
            const supermarkets = JSON.parse(fs.readFileSync(supermarketsPath, "utf-8"));
            for (const sm of supermarkets) {
                await supermarketRepo.create(sm);
            }
            console.log(`[MOCK] Loaded ${supermarkets.length} supermarkets.`);
        }

        // Load Categories (Fix FK issues)
        const categoriesPath = path.join(mockDir, "categories.json");
        if (fs.existsSync(categoriesPath)) {
            const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
            for (const cat of categories) {
                await categoryRepo.create(cat);
            }
            console.log(`[MOCK] Loaded ${categories.length} categories.`);
        }

        // Load Generic Items
        const itemsPath = path.join(mockDir, "generic-items.json");
        if (fs.existsSync(itemsPath)) {
            const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
            for (const item of items) {
                await genericItemRepo.create(item);
            }
            console.log(`[MOCK] Loaded ${items.length} generic items.`);
        }

        // Load Templates
        const templatesPath = path.join(mockDir, "templates.json");
        if (fs.existsSync(templatesPath)) {
            const templates = JSON.parse(fs.readFileSync(templatesPath, "utf-8"));
            for (const t of templates) {
                await templateRepo.create(t);
            }
            console.log(`[MOCK] Loaded ${templates.length} templates.`);
        }

        // Load Template Items
        const templateItemsPath = path.join(mockDir, "template-items.json");
        if (fs.existsSync(templateItemsPath)) {
            const tItems = JSON.parse(fs.readFileSync(templateItemsPath, "utf-8"));
            for (const ti of tItems) {
                await templateItemRepo.create(ti);
            }
            console.log(`[MOCK] Loaded ${tItems.length} template items.`);
        }

        // Load Purchases
        const purchasesPath = path.join(mockDir, "purchases.json");
        if (fs.existsSync(purchasesPath)) {
            const purchases = JSON.parse(fs.readFileSync(purchasesPath, "utf-8"));
            for (const p of purchases) {
                await purchaseRepo.create(p);
            }
            console.log(`[MOCK] Loaded ${purchases.length} purchases.`);
        }

        console.log("Mock data loading complete.");

    } catch (error) {
        console.error("Failed to load mock data:", error);
    }
}

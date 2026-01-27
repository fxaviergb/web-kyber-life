import {
    InMemoryUserRepository,
    InMemorySupermarketRepository,
    InMemoryCategoryRepository,
    InMemoryUnitRepository,
    InMemoryGenericItemRepository,
    InMemoryBrandProductRepository,
    InMemoryTemplateRepository,
    InMemoryTemplateItemRepository,
    InMemoryPurchaseRepository,
    InMemoryPurchaseLineRepository,
    InMemoryPriceObservationRepository,
    InMemoryPasswordResetTokenRepository
} from "./repositories/implementations";
import { seedRepositories } from "./seed/seed-data";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Generic Global Singleton Helper
function singleton<T>(name: string, value: () => T): T {
    // @ts-ignore
    const globalStore = global as any;
    if (!globalStore.__kyber_container) {
        globalStore.__kyber_container = {};
    }
    if (!globalStore.__kyber_container[name]) {
        globalStore.__kyber_container[name] = value();
    }
    return globalStore.__kyber_container[name];
}

// Singleton instances (Persisted across Hot Reloads in Dev)
export const userRepository = singleton("userRepo", () => new InMemoryUserRepository());
export const passwordResetTokenRepository = singleton("tokenRepo", () => new InMemoryPasswordResetTokenRepository());
export const supermarketRepository = singleton("supermarketRepo", () => new InMemorySupermarketRepository());
export const categoryRepository = singleton("categoryRepo", () => new InMemoryCategoryRepository());
export const unitRepository = singleton("unitRepo", () => new InMemoryUnitRepository());
export const genericItemRepository = singleton("genericItemRepo", () => new InMemoryGenericItemRepository());
export const brandProductRepository = singleton("brandProductRepo", () => new InMemoryBrandProductRepository());
export const templateRepository = singleton("templateRepo", () => new InMemoryTemplateRepository());
export const templateItemRepository = singleton("templateItemRepo_v2", () => new InMemoryTemplateItemRepository());
export const purchaseRepository = singleton("purchaseRepo", () => new InMemoryPurchaseRepository());
export const purchaseLineRepository = singleton("purchaseLineRepo_v2", () => new InMemoryPurchaseLineRepository());
export const priceObservationRepository = singleton("priceObservationRepo", () => new InMemoryPriceObservationRepository());

// Services
import { AuthService } from "@/application/services/auth-service";
import { MasterDataService } from "@/application/services/master-data-service";
import { ProductService } from "@/application/services/product-service";
import { TemplateService } from "@/application/services/template-service";
import { PurchaseService } from "@/application/services/purchase-service";
import { AnalyticsService } from "@/application/services/analytics-service";
import { UserService } from "@/application/services/user-service";

export const authService = new AuthService(userRepository, passwordResetTokenRepository);
export const userService = new UserService(userRepository);
export const masterDataService = new MasterDataService(supermarketRepository, categoryRepository, unitRepository);
export const productService = new ProductService(genericItemRepository, brandProductRepository, priceObservationRepository);
export const templateService = new TemplateService(templateRepository, templateItemRepository);
export const purchaseService = new PurchaseService(purchaseRepository, purchaseLineRepository, templateRepository, templateItemRepository, genericItemRepository, priceObservationRepository, brandProductRepository);
export const analyticsService = new AnalyticsService(
    purchaseRepository,
    purchaseLineRepository,
    priceObservationRepository,
    genericItemRepository,
    brandProductRepository,
    categoryRepository,
    unitRepository
);


// Initializer function (to be called at app bootstrap)
export async function initializeContainer() {
    // Check if specifically SEEDED flag exists to avoid re-seeding repeatedly on hot reload if not desired, 
    // OR just rely on repo check logic.
    // @ts-ignore
    if (global.__kyber_initialized) return;

    await seedRepositories(categoryRepository, unitRepository);

    // Seed default test user
    const defaultUserEmail = "test@test.com"; // using format to satisfy validation
    const existingUser = await userRepository.findByEmail(defaultUserEmail);
    if (!existingUser) {
        // Validation bypass: Creating user directly in repo to allow weak password "test"
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("test", salt); // Hash "test"

        await userRepository.create({
            id: randomUUID(),
            email: defaultUserEmail,
            passwordHash: hash,
            defaultCurrencyCode: "USD",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        });
        console.log(`Default test user seeded: ${defaultUserEmail} / test`);
    }

    // @ts-ignore
    global.__kyber_initialized = true;
    console.log("Container initialized and seeded (Global).");
}

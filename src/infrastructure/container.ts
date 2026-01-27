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
// Initializer function (Singleton Promise Pattern)
let initializationPromise: Promise<void> | null = null;

export async function initializeContainer() {
    // If already initialized (global check for dev hot reload), return immediately
    // @ts-ignore
    if (global.__kyber_initialized) return;

    // If a promise is already running, return it to wait for the same result
    if (initializationPromise) return initializationPromise;

    // Create the cleanup/initialization promise
    initializationPromise = (async () => {
        try {
            // ALWAYS seed basic master data (Category, Unit)
            await seedRepositories(categoryRepository, unitRepository);

            // DATA SOURCE STRATEGY
            const dataSource = process.env.DATA_SOURCE || "MEMORY"; // Default to MEMORY

            if (dataSource === "MOCK") {
                console.log("Initializing in MOCK mode...");
                const { loadMockData } = await import("./seed/mock-loader");
                await loadMockData(
                    userRepository,
                    supermarketRepository,
                    genericItemRepository,
                    purchaseRepository,
                    categoryRepository,
                    templateRepository,
                    templateItemRepository
                );
            } else {
                // MEMORY MODE (Default)
                console.log("Initializing in MEMORY mode...");

                // Seed default test user if not exists
                const defaultUserEmail = "test@test.com";
                const existingUser = await userRepository.findByEmail(defaultUserEmail);
                if (!existingUser) {
                    const hash = "test"; // PLAIN TEXT for V1
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
            }

            // @ts-ignore
            global.__kyber_initialized = true;
            console.log(`Container initialized (Source: ${dataSource}).`);
        } catch (error) {
            console.error("Failed to initialize container:", error);
            initializationPromise = null;
            throw error;
        }
    })();

    return initializationPromise;
}

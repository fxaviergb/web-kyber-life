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

// Supabase Repositories
import {
    SupabaseUserRepository,
    SupabaseSupermarketRepository,
    SupabaseCategoryRepository,
    SupabaseUnitRepository,
    SupabaseGenericItemRepository,
    SupabaseBrandProductRepository,
    SupabaseTemplateRepository,
    SupabaseTemplateItemRepository,
    SupabasePurchaseRepository,
    SupabasePurchaseLineRepository,
    SupabasePriceObservationRepository
} from "./repositories/supabase"; // Need to create this index or import individually

// ... Previous imports ...

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

const isSupabase = process.env.DATA_SOURCE === 'SUPABASE';

// Singleton instances (Persisted across Hot Reloads in Dev via global)
export const userRepository = singleton("userRepo", () => isSupabase ? new SupabaseUserRepository() : new InMemoryUserRepository());
// For PasswordResetToken, Supabase handles it, but AuthService needs an instance. 
// If Supabase, we can use InMemory as a placeholder since it won't be used by our modified actions, 
// OR simpler: just keep InMemory for now as it's harmless.
export const passwordResetTokenRepository = singleton("tokenRepo", () => new InMemoryPasswordResetTokenRepository());

export const supermarketRepository = singleton("supermarketRepo", () => isSupabase ? new SupabaseSupermarketRepository() : new InMemorySupermarketRepository());
export const categoryRepository = singleton("categoryRepo", () => isSupabase ? new SupabaseCategoryRepository() : new InMemoryCategoryRepository());
export const unitRepository = singleton("unitRepo", () => isSupabase ? new SupabaseUnitRepository() : new InMemoryUnitRepository());
export const genericItemRepository = singleton("genericItemRepo", () => isSupabase ? new SupabaseGenericItemRepository() : new InMemoryGenericItemRepository());
export const brandProductRepository = singleton("brandProductRepo", () => isSupabase ? new SupabaseBrandProductRepository() : new InMemoryBrandProductRepository());
export const templateRepository = singleton("templateRepo", () => isSupabase ? new SupabaseTemplateRepository() : new InMemoryTemplateRepository());
export const templateItemRepository = singleton("templateItemRepo_v2", () => isSupabase ? new SupabaseTemplateItemRepository() : new InMemoryTemplateItemRepository());
export const purchaseRepository = singleton("purchaseRepo", () => isSupabase ? new SupabasePurchaseRepository() : new InMemoryPurchaseRepository());
export const purchaseLineRepository = singleton("purchaseLineRepo_v3", () => isSupabase ? new SupabasePurchaseLineRepository() : new InMemoryPurchaseLineRepository());
export const priceObservationRepository = singleton("priceObservationRepo", () => isSupabase ? new SupabasePriceObservationRepository() : new InMemoryPriceObservationRepository());

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
    // Global check for dev hot reload
    // @ts-ignore
    if (global.__kyber_initialized) {
        // Even if initialized, check if repositories are empty (rare case of partial reset)? 
        // No, with singleton repos, they should be fine.
        // Uncomment logging if debugging needed
        // console.log("Container already initialized (Global Check). Skipping seed.");
        return;
    }
    // @ts-ignore
    global.__kyber_initialized = true;

    // If a promise is already running, return it to wait for the same result
    if (initializationPromise) return initializationPromise;

    // Create the cleanup/initialization promise
    initializationPromise = (async () => {
        console.log(`Initializing container... Source: ${process.env.DATA_SOURCE || 'MEMORY'}`);
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
                    templateItemRepository,
                    "00000000-0000-0000-0000-000000000000"
                );
            } else {
                // MEMORY MODE (Default)
                console.log("Initializing in MEMORY mode...");

                // Seed default test user if not exists
                // SKIP for Supabase to avoid "cookies() outside request" error during container init
                if (dataSource !== 'SUPABASE') {
                    const defaultUserEmail = "test@test.com";
                    const constantUserId = "00000000-0000-0000-0000-000000000000";
                    let existingUser = await userRepository.findByEmail(defaultUserEmail);

                    // If user exists but has wrong ID (from earlier random seeding), delete it
                    if (existingUser && existingUser.id !== constantUserId) {
                        console.log(`[SEED] User ${defaultUserEmail} exists with wrong ID ${existingUser.id}. Deleting to enforce constant ID.`);
                        await userRepository.delete(existingUser.id);
                        existingUser = null; // Force recreation
                    }

                    if (!existingUser) {
                        const hash = "test"; // PLAIN TEXT for V1
                        await userRepository.create({
                            id: constantUserId, // CONSTANT ID for dev persistence across resets
                            email: defaultUserEmail,
                            passwordHash: hash,
                            defaultCurrencyCode: "USD",
                            image: null,
                            firstName: null,
                            lastName: null,
                            phone: null,
                            isDeleted: false,
                            bio: null,
                            country: null,
                            province: null,
                            city: null,
                            parish: null,
                            neighborhood: null,
                            primaryStreet: null,
                            secondaryStreet: null,
                            addressReference: null,
                            postalCode: null,
                            socials: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                        console.log(`Default test user seeded: ${defaultUserEmail} / test with ID ${constantUserId}`);
                    }

                    // Seed Mock Data consistently for MEMORY mode
                    // Since mock items have static IDs ("s1", "i1"), this is safe/idempotent to run
                    // even if the user already exists (e.g. persisted or restarted)
                    console.log("Seeding comprehensive mock data for MEMORY mode...");
                    const { loadMockData } = await import("./seed/mock-loader");
                    await loadMockData(
                        userRepository,
                        supermarketRepository,
                        genericItemRepository,
                        purchaseRepository,
                        categoryRepository,
                        templateRepository,
                        templateItemRepository,
                        "00000000-0000-0000-0000-000000000000" // Persistent Test User ID
                    );
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

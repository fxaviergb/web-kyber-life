import { ICategoryRepository, IUnitRepository } from "@/domain/repositories";
import { Category, Unit } from "@/domain/entities";
import { v4 as uuidv4 } from "uuid";

// We need a UUID generator. Since we are in infrastructure, we can use 'uuid' package.
// We need to install 'uuid' and '@types/uuid'.
// I will assume I will install them next.

export const BASE_CATEGORIES = [
    "Carnes",
    "Lácteos",
    "Bebidas",
    "Panadería",
    "Abarrotes",
    "Limpieza",
    "Higiene personal",
    "Mascotas",
    "Congelados",
    "Snacks",
    "Vegetales",
    "Frutas",
    "Pescados y Mariscos",
    "Bebidas Alcohólicas",
    "Farmacia",
    "Bebé",
    "Sin categoría"
];

export const BASE_UNITS = [
    { name: "unidad", symbol: "und" },
    { name: "pack", symbol: "pk" },
    { name: "kilogramo", symbol: "kg" },
    { name: "gramo", symbol: "g" },
    { name: "litro", symbol: "L" },
    { name: "mililitro", symbol: "ml" }
];

export async function seedRepositories(
    categoryRepo: ICategoryRepository,
    unitRepo: IUnitRepository
): Promise<void> {
    // Check if already seeded to avoid duplication (though in-memory is fresh on restart)
    const existingCategories = await categoryRepo.findAllBaseAndUser("system"); // "system" or null check. 
    // Actually findAllBaseAndUser takes a userId. If we pass a dummy UUID, we get base + that dummy's. 
    // Base items have ownerUserId = null.
    // We can just rely on the fact that if it's in-memory, it's empty at start.

    // Seed Categories
    const categories = await categoryRepo.findAll();
    if (categories.length === 0) {
        for (const name of BASE_CATEGORIES) {
            const cat: Category = {
                id: uuidv4(),
                ownerUserId: null,
                name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false
            };
            await categoryRepo.create(cat);
        }
    }

    // Seed Units
    const units = await unitRepo.findAll();
    if (units.length === 0) {
        for (const u of BASE_UNITS) {
            const unit: Unit = {
                id: uuidv4(),
                ownerUserId: null,
                name: u.name,
                symbol: u.symbol,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false
            };
            await unitRepo.create(unit);
        }
    }
}

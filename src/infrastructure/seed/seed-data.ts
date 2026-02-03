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
    "Embutidos",
    "Tecnología",
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
    // For SUPABASE, we handle system data via SQL Migrations, not runtime seeding.
    // Runtime seeding with RLS would require Service Role, which we want to avoid in client container.
    if (process.env.DATA_SOURCE === 'SUPABASE') {
        return;
    }

    // Check if already seeded to avoid duplication (though in-memory is fresh on restart)
    // Note: findAllBaseAndUser('system') caused invalid UUID error. Removed.


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

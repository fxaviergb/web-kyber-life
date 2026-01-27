import { ISupermarketRepository, ICategoryRepository, IUnitRepository } from "@/domain/repositories";
import { Supermarket, Category, Unit } from "@/domain/entities";
import { UUID } from "@/domain/core";
import { v4 as uuidv4 } from "uuid";

export class MasterDataService {
    constructor(
        private supermarketRepo: ISupermarketRepository,
        private categoryRepo: ICategoryRepository,
        private unitRepo: IUnitRepository
    ) { }

    // --- Supermarkets ---
    async getSupermarkets(userId: UUID): Promise<Supermarket[]> {
        return this.supermarketRepo.findByOwnerId(userId);
    }

    async createSupermarket(userId: UUID, name: string, address?: string): Promise<Supermarket> {
        const s: Supermarket = {
            id: uuidv4(),
            ownerUserId: userId,
            name,
            address: address || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.supermarketRepo.create(s);
    }

    async updateSupermarket(userId: UUID, id: UUID, data: Partial<Pick<Supermarket, 'name' | 'address'>>): Promise<Supermarket> {
        const s = await this.supermarketRepo.findById(id);
        if (!s || s.ownerUserId !== userId) throw new Error("Supermarket not found");

        if (data.name !== undefined) s.name = data.name;
        if (data.address !== undefined) s.address = data.address || null;
        s.updatedAt = new Date().toISOString();

        return this.supermarketRepo.update(s);
    }

    async deleteSupermarket(userId: UUID, id: UUID): Promise<void> {
        const s = await this.supermarketRepo.findById(id);
        if (!s || s.ownerUserId !== userId) throw new Error("Supermarket not found");

        // Logical delete implemented in repo for V1, but repo delete sets isDeleted=true.
        await this.supermarketRepo.delete(id);
    }

    // --- Categories ---
    async getCategories(userId: UUID): Promise<Category[]> {
        return this.categoryRepo.findAllBaseAndUser(userId);
    }

    async createCategory(userId: UUID, name: string): Promise<Category> {
        const cat: Category = {
            id: uuidv4(),
            ownerUserId: userId,
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.categoryRepo.create(cat);
    }

    async updateCategory(userId: UUID, id: UUID, name: string): Promise<Category> {
        const cat = await this.categoryRepo.findById(id);
        if (!cat) throw new Error("Category not found");
        if (cat.ownerUserId !== userId) throw new Error("Cannot edit base or other user's category");

        cat.name = name;
        cat.updatedAt = new Date().toISOString();
        return this.categoryRepo.update(cat);
    }

    async deleteCategory(userId: UUID, id: UUID): Promise<void> {
        const cat = await this.categoryRepo.findById(id);
        if (!cat) throw new Error("Category not found");
        if (cat.ownerUserId !== userId) throw new Error("Cannot delete base or other user's category");

        await this.categoryRepo.delete(id);
    }

    // --- Units ---
    async getUnits(userId: UUID): Promise<Unit[]> {
        return this.unitRepo.findAllBaseAndUser(userId);
    }

    async createUnit(userId: UUID, name: string, symbol?: string): Promise<Unit> {
        const unit: Unit = {
            id: uuidv4(),
            ownerUserId: userId,
            name,
            symbol: symbol || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.unitRepo.create(unit);
    }

    async updateUnit(userId: UUID, id: UUID, name: string, symbol?: string): Promise<Unit> {
        const unit = await this.unitRepo.findById(id);
        if (!unit) throw new Error("Unit not found");
        if (unit.ownerUserId !== userId) throw new Error("Cannot edit base or other user's unit");

        unit.name = name;
        if (symbol !== undefined) unit.symbol = symbol || null;
        unit.updatedAt = new Date().toISOString();
        return this.unitRepo.update(unit);
    }

    async deleteUnit(userId: UUID, id: UUID): Promise<void> {
        const unit = await this.unitRepo.findById(id);
        if (!unit) throw new Error("Unit not found");
        if (unit.ownerUserId !== userId) throw new Error("Cannot delete base or other user's unit");

        await this.unitRepo.delete(id);
    }
}

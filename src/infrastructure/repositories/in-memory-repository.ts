import { BaseEntity, UUID } from "@/domain/core";
import { IRepository } from "@/domain/repositories";

export class InMemoryRepository<T extends BaseEntity> implements IRepository<T> {
    protected items: Map<UUID, T> = new Map();

    async create(entity: T): Promise<T> {
        if (this.items.has(entity.id)) {
            throw new Error(`Entity with id ${entity.id} already exists`);
        }
        this.items.set(entity.id, entity);
        return entity; // Cloning not strictly needed for in-memory V1 but good practice. Returning ref for now.
    }

    async findById(id: UUID): Promise<T | null> {
        const item = this.items.get(id);
        return item && !item.isDeleted ? item : null;
    }

    async findAll(): Promise<T[]> {
        return Array.from(this.items.values()).filter(item => !item.isDeleted);
    }

    async update(entity: T): Promise<T> {
        if (!this.items.has(entity.id)) {
            throw new Error(`Entity with id ${entity.id} not found`);
        }
        this.items.set(entity.id, entity);
        return entity;
    }

    async delete(id: UUID): Promise<void> {
        const item = this.items.get(id);
        if (item) {
            item.isDeleted = true;
            this.items.set(id, item);
        }
    }
}

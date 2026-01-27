import { ITemplateRepository, ITemplateItemRepository } from "@/domain/repositories";
import { Template, TemplateItem } from "@/domain/entities";
import { UUID } from "@/domain/core";
import { v4 as uuidv4 } from "uuid";

export class TemplateService {
    constructor(
        private templateRepo: ITemplateRepository,
        private templateItemRepo: ITemplateItemRepository
    ) { }

    async createTemplate(userId: UUID, name: string, tags: string[] = []): Promise<Template> {
        const t: Template = {
            id: uuidv4(),
            ownerUserId: userId,
            name,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.templateRepo.create(t);
    }

    async updateTemplate(userId: UUID, id: UUID, data: Partial<Pick<Template, 'name' | 'tags'>>): Promise<Template> {
        const t = await this.getTemplate(userId, id);
        if (!t) throw new Error("Template not found");

        const updated = {
            ...t,
            ...data,
            updatedAt: new Date().toISOString()
        };
        return this.templateRepo.update(updated);
    }

    async deleteTemplate(userId: UUID, id: UUID): Promise<void> {
        const t = await this.getTemplate(userId, id);
        if (!t) throw new Error("Template not found");

        // First clean items
        await this.templateItemRepo.deleteByTemplateId(id);
        // Logical delete
        t.isDeleted = true;
        t.updatedAt = new Date().toISOString();
        await this.templateRepo.update(t);
    }

    async getTemplates(userId: UUID): Promise<Template[]> {
        return this.templateRepo.findByOwnerId(userId);
    }

    async getTemplate(userId: UUID, id: UUID): Promise<Template | null> {
        const t = await this.templateRepo.findById(id);
        if (!t || t.ownerUserId !== userId || t.isDeleted) return null;
        return t;
    }

    async addTemplateItem(
        userId: UUID,
        templateId: UUID,
        genericItemId: UUID,
        defaultQty?: number | null,
        defaultUnitId?: UUID | null
    ): Promise<TemplateItem> {
        const t = await this.getTemplate(userId, templateId);
        if (!t) throw new Error("Template not found");

        // Check if item already in template? 
        const existing = await this.getTemplateItems(userId, templateId);
        if (existing.some(i => i.genericItemId === genericItemId)) {
            throw new Error("El item ya está en la plantilla");
        }

        const item: TemplateItem = {
            id: uuidv4(),
            templateId,
            genericItemId,
            defaultQty: defaultQty ?? null,
            defaultUnitId: defaultUnitId ?? null,
            sortOrder: existing.length
        };

        return this.templateItemRepo.create(item);
    }

    async updateTemplateItem(
        userId: UUID,
        templateId: UUID,
        itemId: UUID,
        data: Partial<Pick<TemplateItem, 'defaultQty' | 'defaultUnitId' | 'sortOrder'>>
    ): Promise<TemplateItem> {
        const t = await this.getTemplate(userId, templateId);
        if (!t) throw new Error("Template not found");

        const item = await this.templateItemRepo.findById(itemId);
        if (!item || item.templateId !== templateId) throw new Error("Item not found in template");

        const updated = {
            ...item,
            ...data
        };

        return this.templateItemRepo.update(updated);
    }

    async removeTemplateItem(userId: UUID, templateId: UUID, itemId: UUID): Promise<void> {
        const t = await this.getTemplate(userId, templateId);
        if (!t) throw new Error("Template not found");

        await this.templateItemRepo.delete(itemId);
    }

    async getTemplateItems(userId: UUID, templateId: UUID): Promise<TemplateItem[]> {
        const t = await this.getTemplate(userId, templateId);
        if (!t) throw new Error("Template not found");
        return this.templateItemRepo.findByTemplateId(templateId);
    }
}

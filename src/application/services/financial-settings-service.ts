import { UUID } from "@/domain/core";
import { FinancialInstitution, FinancialAccount, FinancialCategory } from "@/domain/entities/financial";
import { 
    IFinancialInstitutionRepository, 
    IFinancialAccountRepository, 
    IFinancialCategoryRepository 
} from "@/domain/repositories/financial";
import { randomUUID } from "crypto";

export class FinancialSettingsService {
    constructor(
        private institutionRepo: IFinancialInstitutionRepository,
        private accountRepo: IFinancialAccountRepository,
        private categoryRepo: IFinancialCategoryRepository
    ) {}

    // --- Institutions ---

    async getInstitutions(userId: UUID): Promise<FinancialInstitution[]> {
        return this.institutionRepo.findByOwnerId(userId);
    }

    async createInstitution(userId: UUID, data: Partial<FinancialInstitution>): Promise<FinancialInstitution> {
        const institution: FinancialInstitution = {
            id: randomUUID(),
            ownerUserId: userId,
            name: data.name!,
            logoUrl: data.logoUrl || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.institutionRepo.create(institution);
    }

    async updateInstitution(userId: UUID, institutionId: UUID, data: Partial<FinancialInstitution>): Promise<FinancialInstitution> {
        const existing = await this.institutionRepo.findById(institutionId);
        if (!existing || existing.ownerUserId !== userId || existing.isDeleted) {
            throw new Error("Institution not found or access denied");
        }
        
        const updated: FinancialInstitution = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        return this.institutionRepo.update(institutionId, updated);
    }

    async deleteInstitution(userId: UUID, institutionId: UUID): Promise<void> {
        const existing = await this.institutionRepo.findById(institutionId);
        if (!existing || existing.ownerUserId !== userId) {
            throw new Error("Institution not found or access denied");
        }
        
        // Soft delete
        const updated: FinancialInstitution = {
            ...existing,
            isDeleted: true,
            updatedAt: new Date().toISOString()
        };
        await this.institutionRepo.update(institutionId, updated);
    }

    // --- Accounts ---

    async getAccounts(userId: UUID): Promise<FinancialAccount[]> {
        return this.accountRepo.findByOwnerId(userId);
    }

    async createAccount(userId: UUID, data: Partial<FinancialAccount>): Promise<FinancialAccount> {
        // Validate institution exists and belongs to user
        if (data.institutionId) {
            const institution = await this.institutionRepo.findById(data.institutionId);
            if (!institution || institution.ownerUserId !== userId || institution.isDeleted) {
                 throw new Error("Invalid institution");
            }
        }

        const account: FinancialAccount = {
            id: randomUUID(),
            ownerUserId: userId,
            institutionId: data.institutionId || null,
            name: data.name!,
            accountType: data.accountType || 'CHECKING',
            lastFour: data.lastFour || null,
            currency: data.currency || 'USD',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.accountRepo.create(account);
    }

    async updateAccount(userId: UUID, accountId: UUID, data: Partial<FinancialAccount>): Promise<FinancialAccount> {
        const existing = await this.accountRepo.findById(accountId);
        if (!existing || existing.ownerUserId !== userId || existing.isDeleted) {
            throw new Error("Account not found or access denied");
        }

        if (data.institutionId && data.institutionId !== existing.institutionId) {
            const institution = await this.institutionRepo.findById(data.institutionId);
            if (!institution || institution.ownerUserId !== userId || institution.isDeleted) {
                 throw new Error("Invalid institution");
            }
        }
        
        const updated: FinancialAccount = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        return this.accountRepo.update(accountId, updated);
    }

    async deleteAccount(userId: UUID, accountId: UUID): Promise<void> {
        const existing = await this.accountRepo.findById(accountId);
        if (!existing || existing.ownerUserId !== userId) {
            throw new Error("Account not found or access denied");
        }
        
        // Soft delete
        const updated: FinancialAccount = {
            ...existing,
            isDeleted: true,
            updatedAt: new Date().toISOString()
        };
        await this.accountRepo.update(accountId, updated);
    }

    // --- Categories ---

    async getCategories(userId: UUID): Promise<FinancialCategory[]> {
        return this.categoryRepo.findAllBaseAndUser(userId);
    }

    async createCategory(userId: UUID, data: Partial<FinancialCategory>): Promise<FinancialCategory> {
        const category: FinancialCategory = {
            id: randomUUID(),
            ownerUserId: userId,
            name: data.name!,
            color: data.color || null,
            icon: data.icon || null,
            parentId: data.parentId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        return this.categoryRepo.create(category);
    }

    async updateCategory(userId: UUID, categoryId: UUID, data: Partial<FinancialCategory>): Promise<FinancialCategory> {
        const existing = await this.categoryRepo.findById(categoryId);
        if (!existing || existing.ownerUserId !== userId || existing.isDeleted) {
            throw new Error("Category not found or access denied");
        }
        
        // Cannot modify base categories (ownerUserId === null means system category)
        if (existing.ownerUserId === null) {
             throw new Error("Cannot modify system base categories");
        }
        
        const updated: FinancialCategory = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        return this.categoryRepo.update(categoryId, updated);
    }

    async deleteCategory(userId: UUID, categoryId: UUID): Promise<void> {
        const existing = await this.categoryRepo.findById(categoryId);
        if (!existing || existing.ownerUserId !== userId) {
            throw new Error("Category not found or access denied");
        }

        // Cannot delete base categories
        if (existing.ownerUserId === null) {
             throw new Error("Cannot delete system base categories");
        }
        
        // Soft delete
        const updated: FinancialCategory = {
            ...existing,
            isDeleted: true,
            updatedAt: new Date().toISOString()
        };
        await this.categoryRepo.update(categoryId, updated);
    }
}

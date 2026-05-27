"use server";

import { financialSettingsService } from "@/infrastructure/container";
import { FinancialInstitution, FinancialAccount, FinancialCategory } from "@/domain/entities/financial";
import { requireUser } from "./auth";
import { revalidatePath } from "next/cache";
import { UUID } from "@/domain/core";

export async function getInstitutionsAction() {
    const user = await requireUser();
    return financialSettingsService.getInstitutions(user.id);
}

export async function createInstitutionAction(data: Partial<FinancialInstitution>) {
    const user = await requireUser();
    const result = await financialSettingsService.createInstitution(user.id, data);
    revalidatePath("/financial/settings");
    return result;
}

export async function updateInstitutionAction(id: UUID, data: Partial<FinancialInstitution>) {
    const user = await requireUser();
    const result = await financialSettingsService.updateInstitution(user.id, id, data);
    revalidatePath("/financial/settings");
    return result;
}

export async function deleteInstitutionAction(id: UUID) {
    const user = await requireUser();
    await financialSettingsService.deleteInstitution(user.id, id);
    revalidatePath("/financial/settings");
}

export async function getAccountsAction() {
    const user = await requireUser();
    return financialSettingsService.getAccounts(user.id);
}

export async function createAccountAction(data: Partial<FinancialAccount>) {
    const user = await requireUser();
    const result = await financialSettingsService.createAccount(user.id, data);
    revalidatePath("/financial/settings");
    return result;
}

export async function updateAccountAction(id: UUID, data: Partial<FinancialAccount>) {
    const user = await requireUser();
    const result = await financialSettingsService.updateAccount(user.id, id, data);
    revalidatePath("/financial/settings");
    return result;
}

export async function deleteAccountAction(id: UUID) {
    const user = await requireUser();
    await financialSettingsService.deleteAccount(user.id, id);
    revalidatePath("/financial/settings");
}

export async function getCategoriesAction() {
    const user = await requireUser();
    return financialSettingsService.getCategories(user.id);
}

export async function createCategoryAction(data: Partial<FinancialCategory>) {
    const user = await requireUser();
    const result = await financialSettingsService.createCategory(user.id, data);
    revalidatePath("/financial/settings");
    return result;
}

export async function updateCategoryAction(id: UUID, data: Partial<FinancialCategory>) {
    const user = await requireUser();
    const result = await financialSettingsService.updateCategory(user.id, id, data);
    revalidatePath("/financial/settings");
    return result;
}

export async function deleteCategoryAction(id: UUID) {
    const user = await requireUser();
    await financialSettingsService.deleteCategory(user.id, id);
    revalidatePath("/financial/settings");
}

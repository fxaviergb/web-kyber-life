"use server";

import { masterDataService, templateService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

initializeContainer();

async function getUserId() {
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");
    if (!session || !session.value) throw new Error("Unauthorized");
    return session.value;
}

// --- Supermarkets ---
export async function createSupermarketAction(prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        if (!name) throw new Error("Name is required");

        const supermarket = await masterDataService.createSupermarket(userId, name);
        revalidatePath("/market/purchases/new");
        revalidatePath("/market/supermarkets");
        return { success: true, data: supermarket };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteSupermarketAction(id: string) {
    try {
        const userId = await getUserId();
        await masterDataService.deleteSupermarket(userId, id);
        revalidatePath("/market/supermarkets");
        revalidatePath("/market/purchases/new");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateSupermarketAction(id: string, formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        const address = formData.get("address") as string;
        await masterDataService.updateSupermarket(userId, id, { name, address });
        revalidatePath("/market/supermarkets");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- Categories ---
export async function createCategoryAction(prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        if (!name) throw new Error("Name is required");

        await masterDataService.createCategory(userId, name);
        revalidatePath("/market/categories");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateCategoryAction(prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        if (!id || !name) throw new Error("ID and Name are required");

        await masterDataService.updateCategory(userId, id, name);
        revalidatePath("/market/categories");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteCategoryAction(id: string) {
    try {
        const userId = await getUserId();
        await masterDataService.deleteCategory(userId, id);
        revalidatePath("/market/categories");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- Units ---
export async function createUnitAction(prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        const symbol = formData.get("symbol") as string;
        if (!name) throw new Error("Name is required");

        await masterDataService.createUnit(userId, name, symbol);
        revalidatePath("/market/units");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateUnitAction(prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const symbol = formData.get("symbol") as string;
        if (!id || !name) throw new Error("ID and Name are required");

        await masterDataService.updateUnit(userId, id, name, symbol);
        revalidatePath("/market/units");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteUnitAction(id: string) {
    try {
        const userId = await getUserId();
        await masterDataService.deleteUnit(userId, id);
        revalidatePath("/market/units");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- Templates ---
export async function createTemplateAction(prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        if (!name) throw new Error("Name is required");

        const template = await templateService.createTemplate(userId, name);
        revalidatePath("/market/purchases/new");
        revalidatePath("/market/templates");
        return { success: true, data: template };
    } catch (e: any) {
        return { error: e.message };
    }
}

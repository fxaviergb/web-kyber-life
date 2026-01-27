"use server";

import { masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

initializeContainer();

async function getUserId() {
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");
    if (!session || !session.value) throw new Error("Unauthorized");
    return session.value;
}

export async function createSupermarketAction(formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        const address = formData.get("address") as string;

        if (!name) return { error: "Name required" };

        await masterDataService.createSupermarket(userId, name, address);
        revalidatePath("/market/supermarkets");
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

        if (!name) return { error: "Name required" };

        await masterDataService.updateSupermarket(userId, id, { name, address });
        revalidatePath("/market/supermarkets");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteSupermarketAction(id: string) {
    try {
        const userId = await getUserId();
        await masterDataService.deleteSupermarket(userId, id);
        revalidatePath("/market/supermarkets");
        return { success: true };
    } catch (e: any) {
        // If referenced, maybe logical delete is handled but returns error if strict?
        // V1 Repo allows logical delete.
        return { error: e.message };
    }
}

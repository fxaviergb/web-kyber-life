"use server";

import { productService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    createGenericItemSchema,
    updateGenericItemSchema,
    deleteGenericItemSchema,
    createBrandProductSchema,
    updateBrandProductSchema,
    addPriceObservationSchema
} from "@/lib/validators/product-schemas";

initializeContainer();

async function getUserId() {
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");
    if (!session || !session.value) throw new Error("Unauthorized");
    return session.value;
}

// --- Generic Items ---

export async function searchGenericItemsAction(query: string) {
    try {
        const userId = await getUserId();
        if (!query || query.trim().length < 2) return [];
        const items = await productService.searchGenericItems(userId, query);
        return items;
    } catch (e) {
        console.error("Search error", e);
        return [];
    }
}

export async function getGenericItemsAction() {
    try {
        const userId = await getUserId();
        return await productService.getGenericItems(userId);
    } catch (e) {
        console.error("Get items error", e);
        return [];
    }
}

export async function createGenericItemAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    // Handle array for secondaryCategoryIds (if multiple)
    const secondaryCategoryIds = formData.getAll("secondaryCategoryIds") as string[];

    const parseData = {
        ...rawData,
        primaryCategoryId: rawData.primaryCategoryId === "null" ? null : rawData.primaryCategoryId,
        secondaryCategoryIds: secondaryCategoryIds.length > 0 ? secondaryCategoryIds : undefined,
        globalPrice: rawData.globalPrice ? Number(rawData.globalPrice) : undefined,
    };

    const result = createGenericItemSchema.safeParse(parseData);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const userId = await getUserId();
        const newItem = await productService.createGenericItem(
            userId,
            result.data.name,
            result.data.primaryCategoryId || undefined,
            result.data.imageUrl || undefined,
            result.data.globalPrice,
            result.data.currencyCode
        );
        // Note: secondaryCategories support requires service update if not present.
        // Assuming createGenericItem handles basic creation.

        revalidatePath("/market/items");
        return { success: true, message: "Producto creado", id: newItem.id };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateGenericItemAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const secondaryCategoryIds = formData.getAll("secondaryCategoryIds") as string[];
    const aliases = formData.getAll("aliases") as string[];
    const cleanAliases = aliases.filter(a => a.trim() !== "");

    const parseData = {
        ...rawData,
        primaryCategoryId: rawData.primaryCategoryId === "null" ? null : rawData.primaryCategoryId,
        secondaryCategoryIds: secondaryCategoryIds.length > 0 ? secondaryCategoryIds : undefined,
        aliases: cleanAliases,
        globalPrice: rawData.globalPrice ? Number(rawData.globalPrice) : undefined,
    };

    const result = updateGenericItemSchema.safeParse(parseData);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const userId = await getUserId();
        await productService.updateGenericItem(
            userId,
            result.data.id,
            result.data.name,
            result.data.primaryCategoryId,
            result.data.secondaryCategoryIds,
            result.data.imageUrl,
            result.data.aliases,
            result.data.globalPrice,
            result.data.currencyCode
        );
        revalidatePath("/market/items");
        return { success: true, message: "Producto actualizado" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteGenericItemAction(id: string) {
    try {
        const userId = await getUserId();
        await productService.deleteGenericItem(userId, id);
        revalidatePath("/market/items");
        return { success: true, message: "Producto eliminado" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function addAliasAction(itemId: string, formData: FormData) {
    try {
        const userId = await getUserId();
        const alias = formData.get("alias") as string;
        if (!alias) return { error: "Alias required" };

        await productService.addAlias(userId, itemId, alias);
        revalidatePath(`/market/items`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- Brand Products ---

export async function getBrandProductsAction(genericItemId: string) {
    try {
        const userId = await getUserId();
        return await productService.getBrandProducts(userId, genericItemId);
    } catch (e) {
        console.error("Get brands error", e);
        return [];
    }
}

export async function createBrandProductAction(genericItemId: string, prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseData = {
        ...rawData,
        genericItemId,
        globalPrice: rawData.globalPrice ? Number(rawData.globalPrice) : undefined
    };

    const result = createBrandProductSchema.safeParse(parseData);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const userId = await getUserId();
        const newBrandProduct = await productService.createBrandProduct(
            userId,
            result.data.genericItemId,
            result.data.brand,
            result.data.presentation,
            result.data.imageUrl,
            result.data.globalPrice,
            result.data.currencyCode
        );
        revalidatePath(`/market/items/${genericItemId}`);
        return { success: true, message: "Opción creada", data: newBrandProduct };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateBrandProductAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseData = {
        ...rawData,
        globalPrice: rawData.globalPrice ? Number(rawData.globalPrice) : undefined
    };

    const result = updateBrandProductSchema.safeParse(parseData);
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const userId = await getUserId();
        await productService.updateBrandProduct(
            userId,
            result.data.id,
            result.data.brand,
            result.data.presentation,
            result.data.imageUrl,
            result.data.globalPrice,
            result.data.currencyCode
        );
        revalidatePath("/market/items");
        return { success: true, message: "Opción actualizada" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteBrandProductAction(id: string) {
    try {
        const userId = await getUserId();
        await productService.deleteBrandProduct(userId, id);
        revalidatePath("/market/items");
        return { success: true, message: "Opción eliminada" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function addPriceObservationAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseData = {
        ...rawData,
        // Handle empty price as null/undefined. Schema allows null.
        unitPrice: rawData.unitPrice && rawData.unitPrice.toString().trim() !== ""
            ? Number(rawData.unitPrice)
            : null
    };

    const result = addPriceObservationSchema.safeParse(parseData);
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const userId = await getUserId();
        await productService.addPriceObservation(
            userId,
            result.data.brandProductId,
            result.data.supermarketId,
            result.data.unitPrice ?? null,
            result.data.currencyCode as any
        );
        revalidatePath("/market/items");
        return { success: true, message: "Precio registrado" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateGenericGlobalPriceAction(itemId: string, price: number, currencyCode: string) {
    try {
        const userId = await getUserId();

        const item = await productService.getGenericItem(userId, itemId);
        if (!item) throw new Error("Item not found");

        await productService.updateGenericItem(
            userId,
            item.id,
            item.canonicalName,
            item.primaryCategoryId,
            item.secondaryCategoryIds,
            item.imageUrl || undefined,
            item.aliases,
            price,
            currencyCode
        );

        revalidatePath("/market/items");
        revalidatePath("/market/purchases/[id]");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

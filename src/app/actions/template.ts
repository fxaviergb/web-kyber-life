"use server";

import { templateService, productService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createTemplateSchema, addTemplateItemSchema, updateTemplateItemSchema } from "@/lib/validators/template-schemas";

initializeContainer();

async function getUserId() {
    if (process.env.DATA_SOURCE === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error("Unauthorized");
        return user.id;
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");
    if (!session || !session.value) throw new Error("Unauthorized");
    return session.value;
}

export async function createTemplateAction(prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        const tagsRaw = formData.get("tags") as string;
        const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(t => t !== "") : [];

        const result = createTemplateSchema.safeParse({ name, tags });
        if (!result.success) return { error: result.error.issues[0].message };

        await templateService.createTemplate(userId, result.data.name, result.data.tags);
        revalidatePath("/market/templates");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteTemplateAction(id: string) {
    try {
        const userId = await getUserId();
        await templateService.deleteTemplate(userId, id);
        revalidatePath("/market/templates");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateTemplateAction(id: string, prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const name = formData.get("name") as string;
        const tagsRaw = formData.get("tags") as string;
        const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(t => t !== "") : [];

        const result = createTemplateSchema.safeParse({ name, tags });
        if (!result.success) return { error: result.error.issues[0].message };

        await templateService.updateTemplate(userId, id, {
            name: result.data.name,
            tags: result.data.tags
        });
        revalidatePath("/market/templates");
        revalidatePath(`/market/templates/${id}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function addTemplateItemAction(templateId: string, prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const genericItemId = formData.get("genericItemId") as string;
        const defaultQty = formData.get("defaultQty") ? Number(formData.get("defaultQty")) : null;
        const defaultUnitId = formData.get("defaultUnitId") as string || null;
        const globalPrice = formData.get("globalPrice") ? Number(formData.get("globalPrice")) : undefined;

        const result = addTemplateItemSchema.safeParse({ templateId, genericItemId, defaultQty, defaultUnitId, globalPrice });
        if (!result.success) return { error: result.error.issues[0].message };

        // Update Global Price if provided
        if (globalPrice !== undefined) {
            const item = await productService.getGenericItem(userId, genericItemId);
            if (item) {
                await productService.updateGenericItem(
                    userId,
                    item.id,
                    item.canonicalName,
                    item.primaryCategoryId,
                    item.secondaryCategoryIds,
                    item.imageUrl,
                    item.aliases,
                    globalPrice,
                    item.currencyCode
                );
            }
        }

        await templateService.addTemplateItem(userId, templateId, genericItemId, defaultQty, defaultUnitId);
        revalidatePath(`/market/templates/${templateId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function addMultipleTemplateItemsAction(templateId: string, genericItemIds: string[]) {
    try {
        const userId = await getUserId();

        await Promise.all(genericItemIds.map(id =>
            templateService.addTemplateItem(userId, templateId, id, 1, null)
        ));

        revalidatePath(`/market/templates/${templateId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function removeTemplateItemAction(templateId: string, itemId: string) {
    try {
        const userId = await getUserId();
        await templateService.removeTemplateItem(userId, templateId, itemId);
        revalidatePath(`/market/templates/${templateId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateTemplateItemAction(templateId: string, itemId: string, prevState: any, formData: FormData) {
    try {
        const userId = await getUserId();
        const defaultQty = formData.get("defaultQty") ? Number(formData.get("defaultQty")) : null;
        const defaultUnitId = formData.get("defaultUnitId") as string || null;
        const globalPrice = formData.get("globalPrice") ? Number(formData.get("globalPrice")) : undefined;
        const currencyCode = formData.get("currencyCode") as string | undefined;
        const genericItemId = formData.get("genericItemId") as string | undefined;

        // Extended editing fields
        const name = formData.get("name") as string | undefined;
        const categoryId = formData.get("categoryId") as string | undefined;
        const imageUrl = formData.get("imageUrl") as string | undefined;

        const result = updateTemplateItemSchema.safeParse({
            id: itemId,
            defaultQty,
            defaultUnitId,
            globalPrice,
            currencyCode,
            genericItemId,
            name,
            categoryId,
            imageUrl
        });
        if (!result.success) return { error: result.error.issues[0].message };

        // Handle generic item update (Price, Name, Category, Image)
        if (result.data.genericItemId && (
            result.data.globalPrice !== undefined ||
            result.data.name !== undefined ||
            result.data.categoryId !== undefined ||
            result.data.imageUrl !== undefined
        )) {
            const item = await productService.getGenericItem(userId, result.data.genericItemId);
            if (item) {
                await productService.updateGenericItem(
                    userId,
                    item.id,
                    result.data.name || item.canonicalName,
                    result.data.categoryId,
                    item.secondaryCategoryIds,
                    result.data.imageUrl,
                    item.aliases,
                    result.data.globalPrice,
                    result.data.currencyCode
                );
            }
        }

        await templateService.updateTemplateItem(userId, templateId, itemId, {
            defaultQty: result.data.defaultQty as any,
            defaultUnitId: result.data.defaultUnitId as any
        });
        revalidatePath(`/market/templates/${templateId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

"use server";

import { purchaseService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

import { createPurchaseSchema } from "@/lib/validators/purchase-schemas";

export async function createPurchaseAction(prevState: any, formData: FormData) {
    let id: string;
    try {
        const userId = await getUserId();

        const rawData = {
            supermarketId: formData.get("supermarketId"),
            date: formData.get("date"),
            templateIds: formData.getAll("templateIds")
        };

        const result = createPurchaseSchema.safeParse(rawData);
        if (!result.success) {
            return { error: result.error.issues[0].message };
        }

        const p = await purchaseService.createPurchase(
            userId,
            result.data.supermarketId,
            result.data.date,
            result.data.templateIds
        );
        id = p.id;
    } catch (e: any) {
        return { error: e.message };
    }
    redirect(`/market/purchases/${id}`);
}

export async function updateLineAction(lineId: string, data: any) { // data: Partial<PurchaseLine> passed as JSON? or FormData specific fields.
    // For checklist interactions, simpler to pass JSON via bind or hidden fields? 
    // Actually, handling interactive "save as you type" or "on change" via actions is chatty.
    // Better: use JSON body in actions or optimistic updates with Action.

    // Simplification for V1:
    // We receive FormData.
    try {
        const userId = await getUserId();
        // Extract fields
        const checked = data.checked;
        const unitPrice = data.unitPrice ? parseFloat(data.unitPrice) : null;
        const qty = data.qty ? parseFloat(data.qty) : null;
        const brandProductId = data.brandProductId || null;

        await purchaseService.updateLine(userId, lineId, {
            checked,
            unitPrice,
            qty,
            brandProductId
        });

        revalidatePath("/market/purchases/[id]");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// Wrapper for client component easier usage
export async function updateLineJsonAction(lineId: string, updates: any) {
    try {
        const userId = await getUserId();
        await purchaseService.updateLine(userId, lineId, updates);
        revalidatePath("/market/purchases/[id]"); // wildcard invalid? needs exact path.
        // We don't know exact path here easily without passing purchaseId.
        // If we don't revalidate, client state must be optimistic.
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function finishPurchaseAction(purchaseId: string, formData: FormData) {
    try {
        const userId = await getUserId();
        const totalPaidStr = formData.get("totalPaid") as string;
        if (!totalPaidStr) throw new Error("Total Paid required to finish");

        const totalPaid = parseFloat(totalPaidStr);
        const subtotal = formData.get("subtotal") ? parseFloat(formData.get("subtotal") as string) : undefined;
        const discount = formData.get("discount") ? parseFloat(formData.get("discount") as string) : undefined;
        const tax = formData.get("tax") ? parseFloat(formData.get("tax") as string) : undefined;
        const finishedAt = formData.get("finishedAt") as string | undefined;

        await purchaseService.finishPurchase(userId, purchaseId, totalPaid, subtotal, discount, tax, finishedAt);
    } catch (e: any) {
        return { error: e.message };
    }
    redirect(`/dashboard`);
}

export async function addPurchaseLineAction(purchaseId: string, genericItemId: string, unitPrice?: number) {
    try {
        const userId = await getUserId();
        await purchaseService.addPurchaseLine(userId, purchaseId, genericItemId, unitPrice);
        revalidatePath(`/market/purchases/${purchaseId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteLineAction(lineId: string) {
    try {
        const userId = await getUserId();
        await purchaseService.removeLine(userId, lineId);
        revalidatePath("/market/purchases/[id]");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deletePurchaseAction(purchaseId: string) {
    try {
        const userId = await getUserId();
        await purchaseService.deletePurchase(userId, purchaseId);
        revalidatePath("/market/purchases");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

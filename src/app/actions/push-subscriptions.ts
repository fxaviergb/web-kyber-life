"use server";

import { pushSubscriptionService } from "@/infrastructure/container";
import { requireUserId } from "@/infrastructure/supabase/auth-user";
import { subscribeToPushSchema, unsubscribeFromPushSchema } from "@/lib/validators/notification-schemas";
import { z } from "zod";

function formatZodError(error: z.ZodError): string {
    return error.issues.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join("; ");
}

export async function subscribeToPushAction(input: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
}) {
    try {
        const validated = subscribeToPushSchema.parse(input);
        const userId = await requireUserId();
        const data = await pushSubscriptionService.subscribe({ ownerUserId: userId, ...validated });
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error subscribing to push notifications:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function unsubscribeFromPushAction(endpoint: string) {
    try {
        const validated = unsubscribeFromPushSchema.parse({ endpoint });
        const userId = await requireUserId();
        await pushSubscriptionService.unsubscribe(userId, validated.endpoint);
        return { success: true, data: null };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${formatZodError(error)}` };
        }
        console.error("Error unsubscribing from push notifications:", error);
        return { success: false, error: (error as Error).message };
    }
}

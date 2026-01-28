"use server";

import { analyticsService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";

export async function getProductPriceHistory(genericId: string) {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value!;

    // Using genericId method
    const history = await analyticsService.getGenericPriceHistory(userId, genericId);
    return history;
}

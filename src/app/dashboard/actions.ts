"use server";

import { analyticsService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";

export async function getProductPriceHistory(genericId: string) {
    await initializeContainer();

    // Debug: Force Supabase
    let userId: string | undefined;
    if (true /* process.env.DATA_SOURCE === 'SUPABASE' */) {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
    } else {
        const cookieStore = await cookies();
        userId = cookieStore.get("kyber_session")?.value;
    }

    if (!userId) throw new Error("Unauthorized");

    // Using genericId method
    const history = await analyticsService.getGenericPriceHistory(userId, genericId);
    return history;
}

"use client";

import { useRouter } from "next/navigation";
import type { ISessionStrategy } from "./types";
import { MockSessionStrategy } from "./mock-session-strategy";
import { SupabaseSessionStrategy } from "./supabase-session-strategy";
import { createClient } from "@/infrastructure/supabase/client";

/**
 * Factory function: returns the correct ISessionStrategy implementation
 * based on NEXT_PUBLIC_DATA_SOURCE environment variable.
 *
 * Both strategies are imported statically (good for tree-shaking / bundler),
 * but only the relevant one is instantiated at runtime.
 */
export function createSessionStrategy(router: ReturnType<typeof useRouter>): ISessionStrategy {
    const dataSource = process.env.NEXT_PUBLIC_AUTH_STRATEGY;

    if (dataSource === "SUPABASE") {
        const supabase = createClient();
        return new SupabaseSessionStrategy(supabase, router);
    }

    // Default: MEMORY or MOCK
    return new MockSessionStrategy(router);
}

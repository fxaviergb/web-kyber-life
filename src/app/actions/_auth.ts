import { cookies } from "next/headers";

/**
 * Resolve the authenticated user id consistently with layouts/pages, honoring
 * the configured DATA_SOURCE (Supabase auth vs the `kyber_session` cookie).
 *
 * Use this in server actions that must work across every data source (unlike
 * the financial actions, which assume Supabase, or the legacy market actions,
 * which assume the cookie).
 *
 * @throws Error("Unauthorized") when there is no authenticated user.
 */
export async function resolveUserId(): Promise<string> {
    if (process.env.DATA_SOURCE === "SUPABASE") {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user?.id) throw new Error("Unauthorized");
        return user.id;
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");
    if (!session?.value) throw new Error("Unauthorized");
    return session.value;
}

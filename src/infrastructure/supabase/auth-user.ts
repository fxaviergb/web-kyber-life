import { cache } from "react";
import { createClient } from "./server";

/**
 * Resolve the authenticated Supabase user, memoized per request via React.cache.
 *
 * Why this matters: a single server render (layout + a page's `Promise.all` of
 * several server actions) can trigger many `supabase.auth.getUser()` calls. When
 * the access token has expired, each call attempts a token refresh — but Supabase
 * rotates (one-time-uses) the refresh token, so the first refresh succeeds and
 * the concurrent ones fail with "Unauthorized". Sharing a single cached call
 * means the refresh happens exactly once and every consumer reuses the result.
 */
export const getAuthUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
});

/** Same as {@link getAuthUser} but throws "Unauthorized" when there is no user. */
export async function requireUserId(): Promise<string> {
    const user = await getAuthUser();
    if (!user?.id) throw new Error("Unauthorized");
    return user.id;
}

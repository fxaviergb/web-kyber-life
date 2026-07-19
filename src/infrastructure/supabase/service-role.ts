import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS. Only for trusted
 * server-to-server contexts with no user session, such as the
 * notifications webhook route, which needs to read another user's
 * push_subscriptions on their behalf when relaying a DB-triggered event.
 * Never expose this client (or the key) to the browser.
 */
export function createServiceRoleClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }
    return createSupabaseClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

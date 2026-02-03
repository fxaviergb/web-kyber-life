
/**
 * Verification Script for Supabase Integration
 * 
 * Usage:
 * 1. Ensure .env has valid Supabase Credentials
 * 2. Run with ts-node: npx ts-node --project tsconfig.json scripts/verify-supabase.ts
 * 
 * Note: You might need to adjust tsconfig or use a separate one for scripts if path aliases (@/...) are not resolved.
 * A simpler node script without aliases might be easier if this fails.
 * 
 * Alternative: Paste this code into a temporary API route (src/app/api/verify/route.ts) and call it from browser.
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("❌ Missing Supabase credentials in .env");
        process.exit(1);
    }

    console.log("Connecting to Supabase at:", url);

    // 1. Test Anon Connection (Public)
    const supabase = createClient(url, key);

    // Check connection by listing categories (usually readable if RLS allows public or own)
    // Actually we implemented strict RLS (own data only).
    // So usually this returns empty array for anon, but shouldn't error.
    const { data: categories, error: catError } = await supabase
        .from('market_categories')
        .select('*')
        .limit(1);

    if (catError) {
        console.error("❌ Connection Failed (Anon Client):", catError.message);
    } else {
        console.log("✅ Anon Client Connected. Read result:", categories ? categories.length : 0, "rows (Expected 0 if not logged in)");
    }

    // 2. Test Admin Connection (Service Role) - Optional check
    if (serviceKey) {
        const adminClient = createClient(url, serviceKey);
        const { data: users, error: userError } = await adminClient.auth.admin.listUsers();

        if (userError) {
            console.error("❌ Admin Client Failed:", userError.message);
        } else {
            console.log("✅ Admin Client Connected. Users found:", users.users.length);
        }
    } else {
        console.log("⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Skipping admin verification.");
    }
}

main().catch(console.error);

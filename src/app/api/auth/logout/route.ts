import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/** GET /api/auth/logout — clears cookie and redirects (legacy) */
export async function GET() {
    const cookieStore = await cookies();
    cookieStore.delete("kyber_session");
    redirect("/auth/login");
}

/**
 * POST /api/auth/logout
 * Used by MockSessionStrategy (client-side) to clear the kyber_session cookie
 * without triggering a server-side redirect.
 */
export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete("kyber_session");
    return NextResponse.json({ success: true });
}

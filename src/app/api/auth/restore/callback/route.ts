import { NextResponse } from "next/server";

import { createClient } from "@/infrastructure/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const errorDescription = requestUrl.searchParams.get("error_description");

    if (errorDescription) {
        const redirectUrl = new URL("/auth/recover", requestUrl.origin);
        redirectUrl.searchParams.set("error", errorDescription);
        return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
        return NextResponse.redirect(new URL("/auth/recover", requestUrl.origin));
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        const redirectUrl = new URL("/auth/recover", requestUrl.origin);
        redirectUrl.searchParams.set("error", error.message);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(new URL("/auth/restore", requestUrl.origin));
}

"use server";

import { authService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Ensure container is initialized (seeding)
initializeContainer();

// Schemas
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validators/auth-schemas";

export async function loginAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const result = loginSchema.safeParse(rawData);

    // Ensure container is initialized before proceeding
    try {
        await initializeContainer();
    } catch (error: any) {
        console.error("Initialization failed:", error);
        // Continue anyway for the simplistic V1, maybe lazy create will save us
    }

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { email, password } = result.data;

    // Strict Login: User must exist (in Mock or DB)
    const dataSource = process.env.DATA_SOURCE;

    if (dataSource === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();

        console.log("Attempting Supabase Login for:", email);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Supabase Login Error:", error.message);
            return { error: error.message };
        }

        console.log("Supabase Login Success. Session should be set.");
        // Session is handled by Supabase middleware/cookie
        return { success: true };
    }

    try {
        const user = await authService.login({ email, password });

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set("kyber_session", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function registerAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const result = registerSchema.safeParse(rawData);

    try {
        await initializeContainer();
    } catch (error: any) {
        return { error: "Error de sistema: Fallo al inicializar servicios." };
    }

    if (!result.success) {
        // Return the first error message for simplicity in V1
        return { error: result.error.issues[0].message };
    }

    const { email, password } = result.data;

    const dataSource = process.env.DATA_SOURCE;

    if (dataSource === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();

        // Sign up
        // Note: Profile creation is handled by Postgres Trigger (handle_new_user)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Pass metadata if needed for profile
                data: {
                    // first_name, last_name if available in form
                }
            }
        });

        if (error) {
            return { error: error.message };
        }

        return { success: true };
    }

    try {
        const user = await authService.register({ email, password });

        // Auto login
        const cookieStore = await cookies();
        cookieStore.set("kyber_session", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const result = forgotPasswordSchema.safeParse(rawData);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { email } = result.data;

    const dataSource = process.env.DATA_SOURCE;

    if (dataSource === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();

        // Standard Supabase Reset Flow
        // This will send an email. For localhost, use InBucket if configured, or check console if using local Supabase.
        // KyberLife redirect path: /auth/reset-password (need to build this page logic to handle hash fragment if pure client, or code exchange)
        // For simplicity:
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset-password/callback`,
        });

        if (error) return { error: error.message };
        return { success: true, message: "If registered, you will receive an email." };
    }

    try {
        const message = await authService.requestPasswordReset(email);
        return { success: true, message };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const result = resetPasswordSchema.safeParse(rawData);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { token, password } = result.data;

    try {
        await authService.resetPassword(token, password);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function logoutAction() {
    const dataSource = process.env.DATA_SOURCE;

    if (dataSource === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/auth/login");
        return; // Unreachable
    }

    const cookieStore = await cookies();
    cookieStore.delete("kyber_session");
    redirect("/auth/login");
}

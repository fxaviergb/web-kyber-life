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

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { email, password } = result.data;

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

    if (!result.success) {
        // Return the first error message for simplicity in V1
        return { error: result.error.issues[0].message };
    }

    const { email, password } = result.data;

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
    const cookieStore = await cookies();
    cookieStore.delete("kyber_session");
    redirect("/auth/login");
}

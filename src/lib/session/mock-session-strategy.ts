"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ISessionStrategy } from "./types";
import { LOGOUT_BROADCAST_KEY, MOCK_TOKEN_EXPIRY_KEY } from "./types";

/**
 * Session strategy for DATA_SOURCE === 'MEMORY' or 'MOCK'.
 * Simulates token expiry via localStorage and delegates cookie cleanup
 * to the existing `logoutAction` server action.
 */
export class MockSessionStrategy implements ISessionStrategy {
    constructor(private readonly router: AppRouterInstance) { }

    async logout(): Promise<void> {
        // Broadcast logout to other tabs
        try {
            localStorage.setItem(LOGOUT_BROADCAST_KEY, Date.now().toString());
            localStorage.removeItem(MOCK_TOKEN_EXPIRY_KEY);
        } catch {
            // Safe to ignore if localStorage is unavailable
        }

        // Call the server action to delete the `kyber_session` cookie.
        // We use fetch instead of importing the action directly to avoid
        // server-action module import issues in Client Components at runtime.
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch {
            // Fallback: redirect anyway; the middleware will re-protect the route
        }

        this.router.replace("/auth/login");
    }

    async checkAndRefreshSession(): Promise<{ shouldLogout: boolean }> {
        try {
            const expiryStr = localStorage.getItem(MOCK_TOKEN_EXPIRY_KEY);
            if (!expiryStr) {
                // No expiry record set → session is considered valid (infinite, cookie-based)
                return { shouldLogout: false };
            }

            const expiryMs = parseInt(expiryStr, 10);
            if (isNaN(expiryMs)) return { shouldLogout: false };

            if (Date.now() > expiryMs) {
                console.warn("[KyberLife] Mock token has expired. Triggering logout.");
                return { shouldLogout: true };
            }

            return { shouldLogout: false };
        } catch {
            return { shouldLogout: false };
        }
    }
}

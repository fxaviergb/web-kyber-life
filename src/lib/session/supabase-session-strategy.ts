"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ISessionStrategy } from "./types";
import { LOGOUT_BROADCAST_KEY } from "./types";

/** Proactive refresh threshold: refresh the JWT if it expires within 5 minutes. */
const PROACTIVE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Session strategy for DATA_SOURCE === 'SUPABASE'.
 * Uses the Supabase JS SDK client directly in the browser.
 */
export class SupabaseSessionStrategy implements ISessionStrategy {
    constructor(
        private readonly supabase: SupabaseClient,
        private readonly router: AppRouterInstance
    ) { }

    async logout(): Promise<void> {
        // Broadcast logout to all other tabs BEFORE signing out
        try {
            localStorage.setItem(LOGOUT_BROADCAST_KEY, Date.now().toString());
        } catch {
            // localStorage may be unavailable in some contexts; safe to ignore
        }

        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                console.error("[KyberLife] Supabase signOut error:", error.message);
            }
        } catch (err) {
            console.error("[KyberLife] Exception during signOut:", err);
        } finally {
            // Always navigate — regardless of SignOut success/failure
            try {
                this.router.replace("/auth/login");
            } catch {
                // Hard fallback: force a full page navigation
                window.location.replace("/auth/login");
            }
        }
    }

    async checkAndRefreshSession(): Promise<{ shouldLogout: boolean }> {
        try {
            const { data, error } = await this.supabase.auth.getSession();

            if (error) {
                console.warn("[KyberLife] Error fetching Supabase session:", error.message);
                return { shouldLogout: false }; // Don't force logout on transient errors
            }

            if (!data.session) {
                // Session is genuinely absent; middleware will handle redirect on next nav
                return { shouldLogout: false };
            }

            const expiresAt = data.session.expires_at; // Unix timestamp (seconds)
            if (!expiresAt) return { shouldLogout: false };

            const msUntilExpiry = expiresAt * 1000 - Date.now();

            if (msUntilExpiry < PROACTIVE_REFRESH_THRESHOLD_MS) {
                console.info("[KyberLife] Proactively refreshing Supabase session...");
                const { error: refreshError } = await this.supabase.auth.refreshSession();
                if (refreshError) {
                    console.error("[KyberLife] Session refresh failed:", refreshError.message);
                    return { shouldLogout: true };
                }
                console.info("[KyberLife] Supabase session refreshed successfully.");
            }

            return { shouldLogout: false };
        } catch (err) {
            console.error("[KyberLife] Error checking Supabase session:", err);
            return { shouldLogout: false }; // Non-critical; don't force logout on network error
        }
    }
}

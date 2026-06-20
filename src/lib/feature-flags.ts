/**
 * System-wide Feature Flags for KyberLife
 *
 * Designed to be statically analysable by the Next.js compiler (tree-shakable).
 * Ensure each environment variable starts with NEXT_PUBLIC_ to be securely
 * shared with client-side code.
 */
export const FINANCIAL_FLAGS = {
    /**
     * Toggles Supabase Realtime websocket subscriptions for transaction updates.
     * Default: false (Forced polling fallback for Sprint 7 testing/stability)
     */
    REALTIME_ENABLED: process.env.NEXT_PUBLIC_FF_FINANCIAL_REALTIME === "true",

    /**
     * Toggles fallback HTTP polling when realtime is disabled or disconnected.
     * Default: true
     */
    POLLING_ENABLED: process.env.NEXT_PUBLIC_FF_FINANCIAL_POLLING !== "false",

    /**
     * Toggles AI-driven transaction categorization and financial insights dashboard.
     * Default: false (Under development)
     */
    AI_ENABLED: process.env.NEXT_PUBLIC_FF_FINANCIAL_AI === "true",

    /**
     * Toggles IndexedDB client-side local caching for offline usability.
     * Default: true
     */
    OFFLINE_ENABLED: process.env.NEXT_PUBLIC_FF_FINANCIAL_OFFLINE !== "false",

    /**
     * Toggles recurring transactions pattern matching and predictive reminders.
     * Default: false (Experimental)
     */
    RECURRING_DETECTION: process.env.NEXT_PUBLIC_FF_FINANCIAL_RECURRING === "true",

    /**
     * Toggles voice-to-transaction capture via n8n + OpenAI.
     * Requires VOICE_N8N_WEBHOOK_URL on the server and NEXT_PUBLIC_FF_FINANCIAL_VOICE=true.
     * Default: false
     */
    VOICE_ENABLED: process.env.NEXT_PUBLIC_FF_FINANCIAL_VOICE === "true",
} as const;

export type FinancialFeatureFlags = typeof FINANCIAL_FLAGS;

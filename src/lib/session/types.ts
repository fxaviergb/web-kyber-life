/**
 * Session Management System — KyberLife
 * Strategy Pattern interfaces for multi-source compatibility (SUPABASE / MEMORY / MOCK)
 */

/**
 * Contract that every session strategy must implement.
 * This keeps the React layer completely decoupled from the data source.
 */
export interface ISessionStrategy {
    /**
     * Sign the user out and redirect to /auth/login.
     * Broadcasts a logout event so other tabs can follow.
     */
    logout(): Promise<void>;

    /**
     * Called periodically (every ~4 min) to proactively refresh the session.
     * In SUPABASE mode: checks JWT expiry and refreshes if < 5 min remaining.
     * In MEMORY/MOCK mode: checks mock token expiry in localStorage.
     */
    checkAndRefreshSession(): Promise<{ shouldLogout: boolean }>;
}

/**
 * Configuration for the session guard behaviour.
 * Values can be overridden via environment variables for testing.
 */
export interface SessionGuardConfig {
    /** Total inactivity period before logout. Default: 15 minutes. */
    inactivityLimitMs: number;
    /** Warning period shown before the session expires. Default: 30 seconds. */
    gracePeriodMs: number;
}

/**
 * State returned by the useSessionGuard hook.
 */
export interface SessionGuardState {
    /** Whether the warning modal should be shown. */
    showWarning: boolean;
    /** Seconds remaining in the grace period countdown. */
    secondsRemaining: number;
    /** Resets all inactivity timers; call when user clicks "Extender". */
    extendSession: () => void;
    /** Forces an immediate logout; call when user explicitly confirms logout from the modal. */
    forceLogout: () => void;
}

/** localStorage / storage-event key used to broadcast logout across tabs. */
export const LOGOUT_BROADCAST_KEY = "kyber_logout_broadcast";

/** localStorage key used by the mock strategy to store token expiry timestamp. */
export const MOCK_TOKEN_EXPIRY_KEY = "kyber_mock_token_expiry";

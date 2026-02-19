"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ISessionStrategy, SessionGuardConfig, SessionGuardState } from "@/lib/session/types";
import { LOGOUT_BROADCAST_KEY } from "@/lib/session/types";

/** Default: warn 30s before the 30-min limit */
const DEFAULT_CONFIG: SessionGuardConfig = {
    inactivityLimitMs:
        parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS ?? "", 10) ||
        30 * 60 * 1000, // 30 minutes
    gracePeriodMs: 30 * 1000, // 30 seconds
};

/** user activity events that reset the inactivity timer */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
    "mousemove",
    "keydown",
    "click",
    "touchstart",
    "scroll",
];

/** Proactive session-refresh interval (every 4 minutes) */
const PROACTIVE_CHECK_INTERVAL_MS = 4 * 60 * 1000;

/**
 * useSessionGuard
 *
 * Core hook for KyberLife session management.
 * - Tracks user activity to reset the inactivity timer
 * - Shows a warning modal when the session is about to expire
 * - Logs the user out (via the provided strategy) after inactivity
 * - Syncs logout across browser tabs via the Storage API
 * - Proactively refreshes the session every 4 minutes
 */
export function useSessionGuard(
    strategy: ISessionStrategy,
    config: SessionGuardConfig = DEFAULT_CONFIG
): SessionGuardState {
    const { inactivityLimitMs, gracePeriodMs } = config;

    const [showWarning, setShowWarning] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(
        Math.floor(gracePeriodMs / 1000)
    );

    // Refs to hold timer IDs — avoids stale closures in callbacks
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const proactiveCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isLoggingOutRef = useRef(false);
    // When true, activity events do NOT reset timers (modal is visible)
    const isInGracePeriodRef = useRef(false);

    // --------------------------------------------------------------------------
    // Internal helpers
    // --------------------------------------------------------------------------

    const clearAllTimers = useCallback(() => {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        warningTimerRef.current = null;
        logoutTimerRef.current = null;
        countdownIntervalRef.current = null;
    }, []);

    const startCountdown = useCallback(() => {
        setSecondsRemaining(Math.floor(gracePeriodMs / 1000));
        countdownIntervalRef.current = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    if (countdownIntervalRef.current)
                        clearInterval(countdownIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [gracePeriodMs]);

    const handleLogout = useCallback(async () => {
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;
        clearAllTimers();
        setShowWarning(false);
        await strategy.logout();
    }, [strategy, clearAllTimers]);

    const resetTimers = useCallback(() => {
        clearAllTimers();
        isInGracePeriodRef.current = false;
        setShowWarning(false);

        // Warning fires (inactivityLimit - gracePeriod) after last activity
        warningTimerRef.current = setTimeout(() => {
            isInGracePeriodRef.current = true;
            setShowWarning(true);
            startCountdown();
        }, inactivityLimitMs - gracePeriodMs);

        // Hard logout fires at inactivityLimit
        logoutTimerRef.current = setTimeout(() => {
            handleLogout();
        }, inactivityLimitMs);
    }, [
        clearAllTimers,
        startCountdown,
        handleLogout,
        inactivityLimitMs,
        gracePeriodMs,
    ]);

    // --------------------------------------------------------------------------
    // Public API
    // --------------------------------------------------------------------------

    /** Called when the user clicks "Extender sesión" in the modal */
    const extendSession = useCallback(() => {
        resetTimers();
    }, [resetTimers]);

    /** Called when the user clicks "Cerrar sesión" in the warning modal */
    const forceLogout = useCallback(() => {
        handleLogout();
    }, [handleLogout]);

    // --------------------------------------------------------------------------
    // Effects
    // --------------------------------------------------------------------------

    useEffect(() => {
        // 1. Start the inactivity timers on mount
        resetTimers();

        // 2. Bind activity listeners — ignored while modal is visible
        const handleActivity = () => {
            if (!isLoggingOutRef.current && !isInGracePeriodRef.current) {
                resetTimers();
            }
        };

        ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // 3. Cross-tab logout synchronization
        const handleStorageEvent = (event: StorageEvent) => {
            if (event.key === LOGOUT_BROADCAST_KEY && !isLoggingOutRef.current) {
                isLoggingOutRef.current = true;
                clearAllTimers();
                // Navigate directly without calling strategy.logout() again
                // (the other tab already cleared the session)
                window.location.replace("/auth/login");
            }
        };
        window.addEventListener("storage", handleStorageEvent);

        // 4. Proactive session refresh
        proactiveCheckRef.current = setInterval(async () => {
            const { shouldLogout } = await strategy.checkAndRefreshSession();
            if (shouldLogout) {
                handleLogout();
            }
        }, PROACTIVE_CHECK_INTERVAL_MS);

        // Cleanup on unmount
        return () => {
            clearAllTimers();
            if (proactiveCheckRef.current) clearInterval(proactiveCheckRef.current);
            ACTIVITY_EVENTS.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            window.removeEventListener("storage", handleStorageEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount; strategy and config are stable references

    return { showWarning, secondsRemaining, extendSession, forceLogout };
}

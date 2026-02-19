"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSessionStrategy } from "@/lib/session/session-strategy-factory";
import { useSessionGuard } from "@/hooks/use-session-guard";
import { SessionExpiryModal } from "./SessionExpiryModal";

interface SessionGuardProviderProps {
    children: React.ReactNode;
}

/**
 * SessionGuardProvider
 *
 * Thin Client Component that:
 * 1. Selects the correct session strategy (Supabase or Mock) via the factory
 * 2. Runs the useSessionGuard hook
 * 3. Renders the SessionExpiryModal during the grace period
 *
 * Mount this inside authenticated layouts (e.g. AppLayout) only.
 */
export function SessionGuardProvider({ children }: SessionGuardProviderProps) {
    const router = useRouter();

    // Strategy is stable for the lifetime of this provider
    const strategy = useMemo(() => createSessionStrategy(router), [router]);

    const { showWarning, secondsRemaining, extendSession, forceLogout } =
        useSessionGuard(strategy);

    return (
        <>
            {children}
            {showWarning && (
                <SessionExpiryModal
                    secondsRemaining={secondsRemaining}
                    onExtend={extendSession}
                    onLogout={forceLogout}
                />
            )}
        </>
    );
}

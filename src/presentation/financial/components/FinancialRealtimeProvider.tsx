"use client";

import { FinancialNotificationCenter } from "@/presentation/financial/components/FinancialNotificationCenter";

/**
 * Client-side wrapper that provides Realtime notifications for the financial module.
 * Mount this in the financial layout alongside children.
 */
export function FinancialRealtimeProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            <FinancialNotificationCenter />
            {children}
        </>
    );
}

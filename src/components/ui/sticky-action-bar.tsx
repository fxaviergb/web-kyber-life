"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
    children: ReactNode;
    className?: string;
}

/**
 * Floating action-button bar pinned to the bottom of the viewport, styled as
 * a detached rounded card (border + shadow + blurred backdrop) rather than a
 * flush bar, so primary actions (save, edit, cancel) stay reachable without
 * scrolling — shared by the transaction create and edit/detail screens.
 */
export function StickyActionBar({ children, className }: StickyActionBarProps) {
    return (
        <div className="sticky bottom-3 z-10 -mx-1 px-1 pt-3">
            <div className={cn(
                "rounded-3xl border border-border/50 bg-bg-secondary/90 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-lg",
                className,
            )}>
                {children}
            </div>
        </div>
    );
}

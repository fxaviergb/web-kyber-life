"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
    children: ReactNode;
    className?: string;
}

/**
 * Floating action-button bar pinned to the bottom of the viewport (with a
 * blurred backdrop), so primary actions (save, edit, cancel) stay reachable
 * without scrolling — shared by the transaction create and edit/detail screens.
 */
export function StickyActionBar({ children, className }: StickyActionBarProps) {
    return (
        <div className={cn(
            "sticky bottom-0 z-10 -mx-1 border-t border-border/40 bg-bg-primary/85 px-1 pb-4 pt-3 backdrop-blur-md",
            className,
        )}>
            {children}
        </div>
    );
}

"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldCardProps {
    icon: ReactNode;
    iconClass: string;
    label: string;
    children: ReactNode;
    className?: string;
}

/**
 * Always-visible labeled field card: icon + label + content. The static
 * sibling of AccordionField — same visual language, but without a collapse
 * toggle, for screens that should show every field at once (e.g. a detail /
 * edit view) instead of progressively disclosing them.
 */
export function FieldCard({ icon, iconClass, label, children, className }: FieldCardProps) {
    return (
        <div className={cn("rounded-2xl border border-border/40 bg-bg-secondary/50 p-4", className)}>
            <div className="flex items-center gap-3">
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", iconClass)}>{icon}</div>
                <p className="text-sm font-semibold text-text-primary">{label}</p>
            </div>
            <div className="mt-3">{children}</div>
        </div>
    );
}

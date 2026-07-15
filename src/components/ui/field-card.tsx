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
 * Always-visible labeled field card: a small caption (icon + label) over the
 * actual content, which is what the user came to read — so the value always
 * outweighs its label, the same way the amount hero card already reads.
 * The static sibling of AccordionField — same visual language, but without a
 * collapse toggle, for screens that should show every field at once (e.g. a
 * detail / edit view) instead of progressively disclosing them.
 */
export function FieldCard({ icon, iconClass, label, children, className }: FieldCardProps) {
    return (
        <div className={cn("rounded-2xl border border-border/40 bg-bg-secondary/50 p-4", className)}>
            <div className="flex items-center gap-1.5">
                <div className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md [&_svg]:h-3 [&_svg]:w-3", iconClass)}>{icon}</div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
            </div>
            <div className="mt-1.5">{children}</div>
        </div>
    );
}

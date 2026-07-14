"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionFieldProps {
    icon: ReactNode;
    iconClass: string;
    label: string;
    preview: string;
    hasValue: boolean;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
}

/**
 * A single collapsible field: icon + label + one-line preview when collapsed,
 * arbitrary editor content when expanded. Used to build long forms as a stack
 * of accordion rows instead of always-visible fields.
 */
export function AccordionField({ icon, iconClass, label, preview, hasValue, expanded, onToggle, children }: AccordionFieldProps) {
    return (
        <div className={cn("rounded-2xl border bg-bg-secondary/50 transition-colors", expanded ? "border-accent-primary/40" : "border-border/40")}>
            <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", iconClass)}>{icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{label}</p>
                    {!expanded && (
                        <p className={cn("truncate text-xs", hasValue ? "text-text-secondary" : "text-text-tertiary")}>{preview}</p>
                    )}
                </div>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-text-tertiary transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}

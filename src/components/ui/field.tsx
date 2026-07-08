"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FieldProps {
    /** Field label. Omit for controls that render their own label. */
    label?: React.ReactNode;
    /** id of the control this label points to. */
    htmlFor?: string;
    /** Helper text shown below the control (hidden when `error` is set). */
    hint?: React.ReactNode;
    /** Error message shown below the control (replaces the hint). */
    error?: React.ReactNode;
    /** Renders a red "*" after the label. */
    required?: boolean;
    /** Renders a muted "(Opcional)" after the label. */
    optional?: boolean;
    className?: string;
    labelClassName?: string;
    /** Extra element rendered on the right side of the label row (e.g. a note). */
    labelAside?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Atomic form field: a consistent label + control + hint/error stack used across
 * every modal so spacing, typography and error styling are standardized.
 */
export function Field({
    label,
    htmlFor,
    hint,
    error,
    required,
    optional,
    className,
    labelClassName,
    labelAside,
    children,
}: FieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {(label || labelAside) && (
                <div className="flex items-center justify-between gap-2">
                    {label ? (
                        <Label htmlFor={htmlFor} className={cn("text-text-secondary", labelClassName)}>
                            <span>{label}</span>
                            {required && (
                                <span className="text-accent-danger" aria-hidden="true">
                                    *
                                </span>
                            )}
                            {optional && (
                                <span className="text-xs font-normal text-text-tertiary">(Opcional)</span>
                            )}
                        </Label>
                    ) : (
                        <span />
                    )}
                    {labelAside ? <span className="text-xs text-text-tertiary">{labelAside}</span> : null}
                </div>
            )}
            {children}
            {error ? (
                <p className="text-xs font-medium text-accent-danger">{error}</p>
            ) : hint ? (
                <p className="text-xs text-text-tertiary">{hint}</p>
            ) : null}
        </div>
    );
}

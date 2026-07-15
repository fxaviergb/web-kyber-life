"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogDescription,
    ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog";

export type BreakdownTone = "positive" | "negative" | "pending" | "neutral";

export interface BreakdownRow {
    label: string;
    /** Small muted line under the label (e.g. why this row exists). */
    hint?: string;
    amount: number;
    tone: BreakdownTone;
}

const TONE_CLASS: Record<BreakdownTone, string> = {
    positive: "text-emerald-500",
    negative: "text-accent-danger",
    pending: "text-amber-500",
    neutral: "text-text-primary",
};

const TONE_SIGN: Record<BreakdownTone, string> = {
    positive: "+",
    negative: "−",
    pending: "−",
    neutral: "",
};

function formatCurrency(n: number): string {
    return `$${Math.abs(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface KpiBreakdownModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    icon: LucideIcon;
    iconClassName: string;
    rows: BreakdownRow[];
    /** `showSign` prints a leading +/− (e.g. for a balance); omit it for plain informational sums like a total spent. */
    total: { label: string; amount: number; tone: BreakdownTone; showSign?: boolean };
    /** Extra explanatory note shown under the total (e.g. what's excluded and why). */
    note?: string;
}

/**
 * Reusable "how was this number calculated" modal: a plain list of the
 * signed amounts that add up to a KPI's total, shown when the user taps the
 * corresponding dashboard tile — reused across Balance / Ingresos / Gastos.
 */
export function KpiBreakdownModal({ open, onOpenChange, title, description, icon: Icon, iconClassName, rows, total, note }: KpiBreakdownModalProps) {
    return (
        <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                    <div className="flex items-center gap-2.5">
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconClassName)}>
                            <Icon className="h-4 w-4" />
                        </span>
                        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
                    </div>
                    {description && <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>}
                </ResponsiveDialogHeader>
                <ResponsiveDialogBody className="pb-6">
                    <div className="divide-y divide-border/50">
                        {rows.map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-text-primary">{row.label}</p>
                                    {row.hint && <p className="mt-0.5 text-xs text-text-tertiary">{row.hint}</p>}
                                </div>
                                <p className={cn("shrink-0 text-sm font-bold tabular-nums", TONE_CLASS[row.tone])}>
                                    {TONE_SIGN[row.tone]}{formatCurrency(row.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <p className="text-sm font-semibold text-text-primary">{total.label}</p>
                        <p className={cn("shrink-0 text-lg font-bold tabular-nums", TONE_CLASS[total.tone])}>
                            {total.showSign ? TONE_SIGN[total.tone] : ""}{formatCurrency(total.amount)}
                        </p>
                    </div>
                    {note && <p className="mt-4 text-xs leading-relaxed text-text-tertiary">{note}</p>}
                </ResponsiveDialogBody>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}

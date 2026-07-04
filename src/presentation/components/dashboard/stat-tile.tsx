import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    /** Tailwind gradient/text classes for the accent (icon halo, top hairline). */
    accentClassName?: string;
    trend?: { value: number; positive: boolean };
    /** Renders the value in the danger color (e.g. a negative balance). */
    negative?: boolean;
}

/**
 * Compact summary tile used in the dashboard "RESUMEN" rows. Mobile-first:
 * shrinks its type and padding on small screens so three fit in a row.
 */
export function StatTile({ label, value, icon: Icon, accentClassName, trend, negative }: StatTileProps) {
    return (
        <div className={cn("relative flex flex-col justify-between gap-1.5 sm:gap-2 overflow-hidden rounded-2xl border border-border-base bg-bg-primary p-2.5 sm:p-3 shadow-[0_2px_10px_-6px_rgba(0,0,0,0.15)] transition-colors hover:border-accent-primary/20 h-full min-h-[76px] sm:min-h-[82px]", accentClassName)}>
            {/* Subtle full-card gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-current/5 to-transparent dark:from-current/10" />
            
            {/* Glowing blob effect */}
            <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full blur-2xl opacity-40 bg-current" />
            <div className="relative flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-text-tertiary leading-tight">
                    {label}
                </p>
                {Icon && (
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-secondary", accentClassName)}>
                        <Icon className="h-3.5 w-3.5" />
                    </span>
                )}
            </div>
            <div className="relative flex flex-wrap items-end justify-between gap-1.5">
                <h3 className={cn(
                    "text-base sm:text-xl lg:text-lg 2xl:text-2xl font-bold tracking-tight tabular-nums truncate min-w-0",
                    negative ? "text-accent-danger" : "text-text-primary",
                )}>
                    {value}
                </h3>
                {trend && (
                    <span className={cn(
                        "hidden sm:flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0",
                        trend.positive
                            ? "bg-accent-success/10 text-accent-success"
                            : "bg-accent-danger/10 text-accent-danger",
                    )}>
                        {trend.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
        </div>
    );
}

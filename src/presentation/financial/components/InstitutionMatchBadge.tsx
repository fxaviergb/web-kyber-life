"use client";

import { BadgeCheck, BadgeAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { InstitutionMatchInfo } from "@/lib/institution-match";

const LEVEL_CONFIG = {
    verified: {
        Icon: BadgeCheck,
        iconClass: "text-sky-400",
        title: "Institución identificada",
        titleClass: "text-sky-400",
    },
    warning: {
        Icon: BadgeCheck,
        iconClass: "text-[#FFB020]",
        title: "Coincidencia parcial",
        titleClass: "text-[#FFB020]",
    },
    none: {
        Icon: BadgeAlert,
        iconClass: "text-zinc-500",
        title: "Sin coincidencia",
        titleClass: "text-zinc-400",
    },
} as const;

interface InstitutionMatchBadgeProps {
    info: InstitutionMatchInfo;
    /** Icon size in px. */
    size?: number;
    className?: string;
}

/**
 * A "verified"-style badge next to an institution name. Tap to reveal the match
 * confidence (percentage) and the institution it was compared against. The color
 * encodes the confidence level: verified (high), warning (partial), none.
 */
export function InstitutionMatchBadge({ info, size = 14, className }: InstitutionMatchBadgeProps) {
    const cfg = LEVEL_CONFIG[info.level];
    const Icon = cfg.Icon;
    const pct = Math.round(info.score * 100);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    // Don't let the tap bubble to the card (which toggles expand).
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "inline-flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none",
                        cfg.iconClass,
                        className,
                    )}
                    aria-label={cfg.title}
                    title={cfg.title}
                >
                    <Icon style={{ width: size, height: size }} />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                onClick={(e) => e.stopPropagation()}
                className="w-64 rounded-xl border border-border/50 bg-bg-secondary p-3 text-sm shadow-xl shadow-black/40"
            >
                <div className="flex items-start gap-2">
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.iconClass)} />
                    <div className="space-y-1">
                        <p className={cn("font-semibold leading-tight", cfg.titleClass)}>{cfg.title}</p>
                        {info.level === "none" ? (
                            <p className="leading-snug text-muted-foreground">
                                No se identificó coincidencia con instituciones existentes.
                            </p>
                        ) : (
                            <p className="leading-snug text-muted-foreground">
                                Coincidencia del{" "}
                                <span className="font-medium text-foreground">{pct}%</span> con{" "}
                                <span className="font-medium text-foreground">«{info.matchedName}»</span>.
                            </p>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

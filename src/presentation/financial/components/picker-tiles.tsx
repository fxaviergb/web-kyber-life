"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PickerGridTileProps {
    label: string;
    Icon: LucideIcon;
    iconClassName?: string;
    iconStyle?: React.CSSProperties;
    selected: boolean;
    onClick: () => void;
}

/**
 * One selectable tile in a picker grid (institution, category, etc.). The
 * label wraps onto up to 3 lines instead of overflowing its tile — grid rows
 * stretch every tile to match, so a row stays visually aligned regardless of
 * how long an individual label is.
 */
export function PickerGridTile({ label, Icon, iconClassName, iconStyle, selected, onClick }: PickerGridTileProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex h-full w-full flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                selected ? "border-accent-primary bg-accent-primary/10" : "border-border/40 bg-bg-secondary/40 hover:border-border",
            )}
        >
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", iconClassName)} style={iconStyle}>
                <Icon className="h-4 w-4" />
            </span>
            <span className="line-clamp-3 w-full break-words text-center text-[11px] leading-tight text-text-secondary">{label}</span>
        </button>
    );
}

interface PickerMoreTileProps {
    expanded: boolean;
    onClick: () => void;
}

/** Trailing grid tile that expands/collapses the picker's suggestion list. */
export function PickerMoreTile({ expanded, onClick }: PickerMoreTileProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-full w-full flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-bg-secondary/40 p-2 transition-all hover:border-border"
        >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bg-primary text-text-tertiary">
                <MoreHorizontal className="h-4 w-4" />
            </span>
            <span className="text-center text-[11px] leading-tight text-text-secondary">{expanded ? "Menos" : "Más"}</span>
        </button>
    );
}

interface PickerCreateButtonProps {
    name: string;
    creating: boolean;
    onClick: () => void;
}

/** Dashed "+ Crear "X"" action for adding a new item straight from the search query. */
export function PickerCreateButton({ name, creating, onClick }: PickerCreateButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={creating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent-primary/40 bg-accent-primary/5 px-3 py-2.5 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/10 disabled:opacity-60"
        >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Crear &quot;{name}&quot;
        </button>
    );
}

interface PickerEmptyHintProps {
    text: string;
}

/** Guidance shown instead of a blank grid when the user has no items yet. */
export function PickerEmptyHint({ text }: PickerEmptyHintProps) {
    return <p className="mt-3 text-xs text-text-tertiary">{text}</p>;
}

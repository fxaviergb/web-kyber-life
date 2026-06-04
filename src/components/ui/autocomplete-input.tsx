"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    id?: string;
    className?: string;
}

export function AutocompleteInput({ value, onChange, options, placeholder, id, className }: AutocompleteInputProps) {
    const fallbackId = React.useId();
    const resolvedId = id || fallbackId;
    const dataListId = `${resolvedId}-datalist`;

    return (
        <div className="relative w-full">
            <Input
                id={resolvedId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn("w-full bg-background border-border/50", className)}
                list={dataListId}
                autoComplete="off"
            />
            <datalist id={dataListId}>
                {options.map((opt, idx) => (
                    <option key={idx} value={opt} />
                ))}
            </datalist>
        </div>
    )
}

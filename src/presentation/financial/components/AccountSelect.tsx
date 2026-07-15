"use client";

import { ChevronDown } from "lucide-react";

export interface AccountSelectProps {
    accounts: string[];
    value: string;
    onChange: (value: string) => void;
    id?: string;
}

/** Native `<select>` for choosing a saved account, styled to match the rest of the form's inputs. */
export function AccountSelect({ accounts, value, onChange, id }: AccountSelectProps) {
    return (
        <div className="relative">
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-border-base bg-bg-primary px-3 pr-9 text-sm text-text-primary outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            >
                <option value="">Selecciona una cuenta</option>
                {accounts.map((a) => (
                    <option key={a} value={a}>{a}</option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        </div>
    );
}

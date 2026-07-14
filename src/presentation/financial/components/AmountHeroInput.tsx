"use client";

import { DollarSign, Lock } from "lucide-react";

export interface AmountHeroInputProps {
    amount: string;
    onChange: (value: string) => void;
    /** Currently locked/display-only; USD is the only supported currency for now. */
    currency: string;
}

/** Large, prominent amount input used at the top of transaction forms. */
export function AmountHeroInput({ amount, onChange, currency }: AmountHeroInputProps) {
    return (
        <div className="rounded-2xl border border-border/40 bg-bg-secondary/50 p-4">
            <p className="text-xs font-medium text-text-tertiary">Monto ({currency})</p>
            <div className="mt-2 flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-primary/15 text-accent-primary">
                    <DollarSign className="h-5 w-5" />
                </div>
                <input
                    id="amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-3xl font-bold text-text-primary outline-none placeholder:text-text-tertiary/60"
                />
                <div
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border-base bg-bg-primary px-3 text-sm font-semibold text-text-primary"
                    title="Por ahora solo se admite dólar estadounidense (USD)"
                >
                    <Lock className="h-3.5 w-3.5 text-text-tertiary" />
                    {currency}
                </div>
            </div>
        </div>
    );
}

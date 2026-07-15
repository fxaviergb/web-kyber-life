"use client";

import { CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface CreditToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

/**
 * "Incluir gastos con tarjeta" toggle shared by every financial dashboard —
 * off by default, so amounts and charts show only real (cash) spending
 * until the user opts into seeing credit-card-paid transactions too.
 */
export function CreditToggle({ checked, onChange, className }: CreditToggleProps) {
    return (
        <div className={cn("flex shrink-0 items-center gap-2 rounded-xl border border-border/40 bg-bg-secondary/40 px-3 py-2", className)}>
            <CreditCard className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span className="whitespace-nowrap text-xs font-medium text-text-secondary">Incluir TC</span>
            <Switch checked={checked} onChange={onChange} label="Incluir gastos pagados con tarjeta de crédito en los montos" />
        </div>
    );
}

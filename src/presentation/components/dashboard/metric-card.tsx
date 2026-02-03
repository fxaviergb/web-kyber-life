import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        positive: boolean;
    };
    iconClassName?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, iconClassName }: MetricCardProps) {
    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl bg-bg-secondary text-text-primary", iconClassName)}>
                        <Icon size={20} />
                    </div>
                    <p className="text-text-tertiary text-sm font-medium">{title}</p>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-bold text-text-primary tracking-tight">{value}</h3>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                            trend.positive ? "text-accent-success bg-accent-success/10" : "text-accent-danger bg-accent-danger/10"
                        )}>
                            {trend.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

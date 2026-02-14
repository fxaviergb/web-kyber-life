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
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col justify-between relative overflow-hidden group hover:border-accent-primary/20 transition-all duration-300">
            {/* Header: Icon + Title */}
            <div className="flex items-center gap-3 z-10">
                <div className={cn("p-2 rounded-xl bg-bg-secondary text-text-primary", iconClassName)}>
                    <Icon size={20} />
                </div>
                <p className="text-text-tertiary text-sm font-medium">{title}</p>
            </div>

            {/* Body: Value + Trend */}
            <div className="mt-6 flex justify-between items-end z-10">
                <h3 className="text-3xl font-bold text-text-primary tracking-tight">{value}</h3>

                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mb-1",
                        trend.positive ? "text-accent-success bg-accent-success/10" : "text-accent-danger bg-accent-danger/10"
                    )}>
                        {trend.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
        </div>
    );
}

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: string;
        positive: boolean;
    };
    className?: string;
    iconClassName?: string;
    valueClassName?: string;
    tooltipText?: string;
    compact?: boolean;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconClassName,
    valueClassName,
    tooltipText,
    compact,
}: StatCardProps) {
    return (
        <Card className={cn("hover:shadow-xl transition-all duration-200 flex flex-col h-full", className)}>
            <CardHeader className={cn("flex flex-row items-center justify-between space-y-0", compact ? "p-3 pb-1" : "pb-2")}>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-text-secondary">
                        {title}
                    </CardTitle>
                    {tooltipText && (
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" className="text-text-tertiary hover:text-text-primary transition-colors focus:outline-none">
                                        <Info className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="max-w-[250px]">
                                    <p>{tooltipText}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", "text-text-tertiary", iconClassName)} />
            </CardHeader>
            <CardContent className={cn("flex-1 flex flex-col", compact ? "p-3 pt-0" : "")}>
                <div className={cn("font-bold text-text-primary tabular-nums tracking-tight", compact ? "text-lg" : "text-2xl", valueClassName)}>{value}</div>
                {(description || trend) && (
                    <p className={cn("text-text-tertiary mt-auto pt-1", compact ? "text-[10px]" : "text-xs")}>
                        {trend && (
                            <span
                                className={cn(
                                    "font-medium mr-1",
                                    trend.positive ? "text-accent-success" : "text-accent-danger"
                                )}
                            >
                                {trend.positive ? "↑" : "↓"} {trend.value}
                            </span>
                        )}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

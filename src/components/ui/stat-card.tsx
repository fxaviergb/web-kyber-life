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
    tooltipText?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconClassName,
    tooltipText,
}: StatCardProps) {
    return (
        <Card className={cn("hover:shadow-xl transition-all duration-200", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                <Icon className={cn("h-4 w-4 text-text-tertiary", iconClassName)} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-text-primary">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-text-tertiary mt-1">
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

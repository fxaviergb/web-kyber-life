import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-center",
                className
            )}
        >
            {Icon && (
                <div className="rounded-full bg-bg-tertiary p-3 mb-4">
                    <Icon className="h-6 w-6 text-text-tertiary" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-text-tertiary max-w-sm mb-4">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

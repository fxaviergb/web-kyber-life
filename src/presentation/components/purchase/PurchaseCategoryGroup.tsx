"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseLine } from "@/domain/entities";

interface PurchaseCategoryGroupProps {
    categoryName: string;
    lines: PurchaseLine[];
    renderLine: (line: PurchaseLine) => React.ReactNode;
}

export function PurchaseCategoryGroup({
    categoryName,
    lines,
    renderLine
}: PurchaseCategoryGroupProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="space-y-4">
            <div
                className="flex items-center gap-2 cursor-pointer group select-none py-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-text-3 group-hover:text-text-1 transition-colors"
                >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <h2 className="text-sm font-bold text-text-2 uppercase tracking-wider group-hover:text-text-1 transition-colors flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {categoryName}
                    <Badge variant="default" className="bg-bg-2 text-text-3 font-normal text-xs border-border ml-2">
                        {lines.length}
                    </Badge>
                </h2>

                <div className="flex-1 h-px bg-border/50 ml-4 hidden sm:block" />
            </div>

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {lines.map((line) => renderLine(line))}
                </div>
            )}
        </div>
    );
}

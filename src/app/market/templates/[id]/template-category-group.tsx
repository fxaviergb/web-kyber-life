"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Unit, Category } from "@/domain/entities";
import { TemplateItemCard } from "./template-item-card";

interface TemplateItemWithDetails {
    id: string;
    genericName: string;
    defaultQty: number | null;
    defaultUnitId: string | null;
    genericItemId: string;
    globalPrice: number | null;
    currencyCode: string;
    categoryId: string | null;
    imageUrl: string | null;
    unit: Unit | null | undefined;
}

interface TemplateCategoryGroupProps {
    categoryName: string;
    items: TemplateItemWithDetails[];
    templateId: string;
    units: Unit[];
    categories: Category[];
}

export function TemplateCategoryGroup({ categoryName, items, templateId, units, categories }: TemplateCategoryGroupProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="space-y-4">
            <div
                className="flex items-center gap-2 cursor-pointer group select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-text-tertiary group-hover:text-text-primary transition-colors"
                >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <h2 className="text-xl font-bold text-text-primary group-hover:text-accent-primary transition-colors flex items-center gap-3">
                    {categoryName}
                    <Badge variant="outline" className="bg-bg-secondary text-text-secondary font-normal text-xs hover:bg-bg-secondary border-border/50">
                        {items.length}
                    </Badge>
                </h2>

                <div className="flex-1 h-px bg-border-base/50 ml-4 hidden sm:block" />
            </div>

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {items.map((item) => (
                        <TemplateItemCard
                            key={item.id}
                            templateId={templateId}
                            item={{
                                id: item.id,
                                genericName: item.genericName,
                                defaultQty: item.defaultQty,
                                defaultUnitId: item.defaultUnitId,
                                genericItemId: item.genericItemId,
                                globalPrice: item.globalPrice,
                                currencyCode: item.currencyCode,
                                categoryId: item.categoryId,
                                imageUrl: item.imageUrl
                            }}
                            unit={item.unit}
                            units={units}
                            categories={categories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, Tag } from "lucide-react";
import { ItemDetailDialog } from "./item-detail-dialog";
import { RemoveTemplateItemButton } from "./remove-item-button";
import { Unit, Category } from "@/domain/entities";

interface TemplateItemCardProps {
    templateId: string;
    item: {
        id: string;
        genericName: string;
        defaultQty: number | null;
        defaultUnitId: string | null;
        genericItemId?: string;
        globalPrice?: number | null;
        currencyCode?: string;
        categoryId?: string | null;
        imageUrl?: string | null;
    };
    unit: Unit | null | undefined;
    units: Unit[];
    categories: Category[];
}

export function TemplateItemCard({ templateId, item, unit, units, categories }: TemplateItemCardProps) {
    const lineTotal = (item.globalPrice && item.defaultQty)
        ? item.globalPrice * item.defaultQty
        : null;

    const itemCategoryName = item.categoryId
        ? categories.find(c => c.id === item.categoryId)?.name
        : null;

    return (
        <ItemDetailDialog
            templateId={templateId}
            item={item}
            units={units}
            categories={categories}
            trigger={
                <div className="cursor-pointer group relative">
                    <Card className="bg-bg-1 border-border hover:bg-bg-2/30 transition-all duration-300 hover:border-accent-violet/30 hover:shadow-lg hover:shadow-accent-violet/5 overflow-hidden">
                        <div className="flex items-center gap-3 px-3 py-2">
                            {/* Image/Icon */}
                            <div className="w-16 h-16 shrink-0 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.genericName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ShoppingBasket className="w-6 h-6 text-text-3/30" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                {/* Left: Name and Category */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-text-1 group-hover:text-accent-violet transition-colors truncate text-sm">
                                        {item.genericName}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {itemCategoryName && (
                                            <Badge variant="outline" className="text-[10px] border-border/50 text-text-3 px-1.5 py-0 h-4">
                                                <Tag className="w-2.5 h-2.5 mr-1" />
                                                {itemCategoryName}
                                            </Badge>
                                        )}
                                        {item.defaultQty && (
                                            <span className="text-[10px] text-text-3">
                                                {item.defaultQty} {unit?.symbol || "unid."}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Price and Total */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Price Info */}
                                    {lineTotal !== null ? (
                                        <div className="text-right">
                                            <div className="font-bold text-accent-mint text-base">
                                                ${lineTotal.toFixed(2)}
                                            </div>
                                            <div className="text-[10px] text-text-3">
                                                Est. Total
                                            </div>
                                        </div>
                                    ) : item.globalPrice ? (
                                        <div className="text-right">
                                            <div className="font-bold text-accent-mint text-base">
                                                ${item.globalPrice.toFixed(2)}
                                            </div>
                                            <div className="text-[10px] text-text-3">
                                                {item.currencyCode}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-right w-16">
                                            <div className="text-[10px] text-text-3 italic">
                                                Sin precio
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete Button */}
                                    <div
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <RemoveTemplateItemButton templateId={templateId} itemId={item.id} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            }
        />
    );
}

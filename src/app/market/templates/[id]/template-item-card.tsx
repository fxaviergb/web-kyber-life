"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket } from "lucide-react";
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
                <div className="cursor-pointer group relative h-full">
                    <Card className="bg-bg-1 border-border hover:bg-bg-2/30 transition-all duration-300 hover:border-accent-violet/30 hover:shadow-lg hover:shadow-accent-violet/5 h-full flex flex-col">
                        <div className="aspect-video w-full bg-bg-2 relative overflow-hidden">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.genericName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-3/30">
                                    <ShoppingBasket className="w-8 h-8" />
                                </div>
                            )}
                            {itemCategoryName && (
                                <Badge className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-text-2 text-[10px] px-1.5 py-0 h-5 border-none">
                                    {itemCategoryName}
                                </Badge>
                            )}
                            {item.globalPrice && (
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-accent-mint">
                                    ${item.globalPrice.toFixed(2)}
                                </div>
                            )}
                        </div>
                        <CardContent className="p-1.5 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-text-1 group-hover:text-accent-violet transition-colors line-clamp-2 text-xs leading-tight">
                                    {item.genericName}
                                </h3>
                                <p className="text-[10px] text-text-3 mt-0.5 opacity-80">
                                    {item.defaultQty ? `${item.defaultQty} ${unit?.symbol || "unid."}` : "Sin cantidad"}
                                </p>
                            </div>

                            {lineTotal !== null && (
                                <div className="mt-1 pt-1 border-t border-border/50 flex justify-between items-center text-[10px]">
                                    <span className="text-text-3">Est:</span>
                                    <span className="font-bold text-text-1">${lineTotal.toFixed(2)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <div
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            // The actual button click is handled by the button itself, 
                            // but we need to stop propagation here so the dialog doesn't open
                        }}
                    >
                        <RemoveTemplateItemButton templateId={templateId} itemId={item.id} />
                    </div>
                </div>
            }
        />
    );
}

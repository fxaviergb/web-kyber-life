"use client";

import { GenericItem, PurchaseLine, BrandProduct } from "@/domain/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, Edit, Eye, Package, Trash2 } from "lucide-react";
import { useState } from "react";

interface PurchaseItemCardProps {
    line: PurchaseLine;
    genericItem: GenericItem;
    brandOptions: BrandProduct[];
    isChecked: boolean;
    isReadOnly: boolean;
    onCheckChange: (checked: boolean) => void;
    onPriceChange: (price: number) => void;
    onOpenDetails: () => void;
    onOpenEdit: () => void;
    onDelete?: () => void;
}

export function PurchaseItemCard({
    line,
    genericItem,
    brandOptions,
    isChecked,
    isReadOnly,
    onCheckChange,
    onPriceChange,
    onOpenDetails,
    onOpenEdit,
    onDelete
}: PurchaseItemCardProps) {
    const [priceInput, setPriceInput] = useState(line.unitPrice?.toString() || "");

    const selectedBrand = brandOptions.find(b => b.id === line.brandProductId);
    const displayImage = selectedBrand?.imageUrl || genericItem?.imageUrl;
    const displayName = genericItem?.canonicalName || "Producto";
    const displayPrice = line.unitPrice || genericItem?.globalPrice || 0;

    const lineTotal = displayPrice * (line.qty || 1);

    return (
        <Card
            className={`bg-bg-1 border-border hover:bg-bg-2/30 transition-all duration-300 overflow-hidden cursor-pointer ${isChecked ? 'opacity-60 border-accent-success/50' : 'hover:border-accent-violet/30 hover:shadow-lg hover:shadow-accent-violet/5'}`}
            onClick={() => !isReadOnly && onCheckChange(!isChecked)}
        >
            <div className="flex items-center gap-2 px-2 py-1">
                {/* Image */}
                <div
                    className="w-20 h-20 shrink-0 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center"
                >
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt={displayName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ShoppingBasket className="w-8 h-8 text-text-3/30" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    {/* Left: Name and Quantity */}
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold transition-colors line-clamp-2 leading-tight text-base ${isChecked ? 'line-through text-text-3' : 'text-text-1 group-hover:text-accent-violet'}`}>
                            {displayName}
                        </h3>
                        <div className="flex flex-col items-start gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] border-border/50 text-text-3 px-1.5 py-0 h-4 whitespace-nowrap">
                                <Package className="w-2.5 h-2.5 mr-1" />
                                {line.qty || 1} unid
                            </Badge>
                            {selectedBrand && (
                                <span className="text-[10px] text-accent-violet">
                                    • {selectedBrand.brand}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Price and Actions */}
                    <div className="flex flex-col gap-1 shrink-0 self-center">
                        {/* Price as Button - Opens Line Edit */}
                        {!isReadOnly ? (
                            <Button
                                variant="ghost"
                                className="h-auto min-h-[40px] px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 bg-bg-2 border border-border hover:bg-bg-3 hover:border-accent-violet/50 rounded-md group/price w-[75px]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEdit();
                                }}
                            >
                                <div className="font-bold text-accent-mint text-sm">
                                    ${lineTotal.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-text-3 font-medium">
                                    ${displayPrice.toFixed(2)} c/u
                                </div>
                            </Button>
                        ) : (
                            <div className="h-auto min-h-[40px] px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 bg-bg-2/50 border border-transparent rounded-md w-[75px]">
                                <div className="font-bold text-accent-mint text-sm">
                                    ${lineTotal.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-text-3 font-medium">
                                    ${displayPrice.toFixed(2)} c/u
                                </div>
                            </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-1 w-[75px]">
                            {/* Eye Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-[30px] bg-bg-2 border border-border hover:bg-bg-3 hover:border-accent-turquoise/50 text-text-3 hover:text-accent-turquoise rounded-md ${!isChecked && onDelete ? 'flex-1' : 'w-full'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDetails();
                                }}
                            >
                                <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {/* Delete Button - Only shows if not checked and deletion enabled */}
                            {!isChecked && onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-[30px] flex-1 bg-bg-2 border border-border hover:bg-bg-3 hover:border-red-500/30 text-text-3 hover:text-red-500 rounded-md transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

"use client";

import { GenericItem, PurchaseLine, BrandProduct } from "@/domain/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Edit, Eye } from "lucide-react";
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
    onOpenEdit
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
            <div className="flex items-center gap-3 px-3 py-2">
                {/* Image */}
                <div
                    className="w-16 h-16 shrink-0 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center"
                >
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt={displayName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ShoppingBasket className="w-6 h-6 text-text-3/30" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                    {/* Left: Name and Quantity */}
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold transition-colors truncate text-sm ${isChecked ? 'line-through text-text-3' : 'text-text-1 group-hover:text-accent-violet'}`}>
                            {displayName}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-3">
                                {line.qty || 1} unid
                            </span>
                            {selectedBrand && (
                                <span className="text-[10px] text-accent-violet">
                                    • {selectedBrand.brand}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Price and Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Price */}
                        <div className="text-right">
                            <div className="font-bold text-accent-mint text-base">
                                ${lineTotal.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-text-3">
                                ${displayPrice.toFixed(2)} c/u
                            </div>
                        </div>

                        {/* Action Buttons - Always visible, stacked vertically */}
                        {!isReadOnly && (
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-bg-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenEdit();
                                    }}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-bg-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenDetails();
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

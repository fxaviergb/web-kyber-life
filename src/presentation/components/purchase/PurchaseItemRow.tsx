"use client";

import { useState } from "react";
import { PurchaseLine, BrandProduct, Unit, GenericItem } from "@/domain/entities";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface PurchaseItemRowProps {
    line: PurchaseLine;
    genericItem: GenericItem;
    brandOptions: BrandProduct[];
    isChecked: boolean;
    isReadOnly: boolean;
    onCheckChange: (checked: boolean) => void;
    onPriceChange: (price: number) => void;
    onOpenDetails: () => void;
}

export function PurchaseItemRow({
    line,
    genericItem,
    brandOptions,
    isChecked,
    isReadOnly,
    onCheckChange,
    onPriceChange,
    onOpenDetails
}: PurchaseItemRowProps) {
    const [localPrice, setLocalPrice] = useState(line.unitPrice?.toString() || "");

    const genericName = genericItem?.canonicalName || "Item";
    const needsPrice = isChecked && (!line.unitPrice || line.unitPrice <= 0);

    // Get brand name if selected
    const selectedBrand = line.brandProductId
        ? brandOptions.find(b => b.id === line.brandProductId)
        : null;

    const handlePriceBlur = () => {
        const price = parseFloat(localPrice);
        if (!isNaN(price) && price !== line.unitPrice) {
            onPriceChange(price);
        }
    };

    return (
        <div className={cn(
            "group p-3 rounded-lg border transition-all",
            isChecked
                ? "bg-bg-secondary/50 border-border-base opacity-60"
                : "bg-bg-secondary border-border-base hover:border-accent-primary/50 hover:shadow-md",
            needsPrice && "border-accent-danger ring-2 ring-accent-danger/20"
        )}>
            <div className="flex items-center gap-3">
                {/* Checkbox */}
                <Checkbox
                    checked={isChecked}
                    onCheckedChange={onCheckChange}
                    disabled={isReadOnly}
                    className={cn(
                        "h-6 w-6 border-2",
                        "data-[state=checked]:bg-accent-success data-[state=checked]:border-accent-success"
                    )}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "font-semibold text-base text-text-primary truncate",
                        isChecked && "line-through text-text-tertiary"
                    )}>
                        {genericName}
                    </p>

                    {/* Subtle metadata */}
                    <div className="flex items-center gap-2 mt-0.5">
                        {selectedBrand && (
                            <span className="text-xs text-text-tertiary">
                                {selectedBrand.brand}
                            </span>
                        )}
                        {line.qty && line.qty !== 1 && (
                            <span className="text-xs text-text-tertiary">
                                × {line.qty}
                            </span>
                        )}
                    </div>
                </div>

                {/* Price Input */}
                <div className="flex items-center gap-2">
                    <div className="relative w-24">
                        <span className="absolute left-3 top-2.5 text-sm text-text-tertiary">$</span>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className={cn(
                                "pl-6 h-10 text-right font-semibold",
                                needsPrice && "border-accent-danger focus-visible:ring-accent-danger"
                            )}
                            value={localPrice}
                            onChange={(e) => setLocalPrice(e.target.value)}
                            onBlur={handlePriceBlur}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Details Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenDetails}
                        disabled={isChecked || isReadOnly}
                        className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

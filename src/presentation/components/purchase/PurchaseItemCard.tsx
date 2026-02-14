"use client";

import { GenericItem, PurchaseLine, BrandProduct } from "@/domain/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, Edit, Eye, Package, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
    // New props for single swipe management
    isSwiped?: boolean;
    onSwipeOpen?: () => void;
    onSwipeClose?: () => void;
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
    onDelete,
    isSwiped,
    onSwipeOpen,
    onSwipeClose
}: PurchaseItemCardProps) {
    const [priceInput, setPriceInput] = useState(line.unitPrice?.toString() || "");
    const [isInteracting, setIsInteracting] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Watch for external swipe reset or restoration
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        if (!isSwiped) {
            // Close if it should be closed
            if (container.scrollLeft > 0) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            }
        } else {
            // Restore Open state if it should be open but is closed (e.g. after re-render)
            // We check !isInteracting to avoid fighting the user
            if (container.scrollLeft < 20 && !isInteracting) {
                // Scroll to end (actions width)
                // Using a large number ensures we hit the snap point for the actions
                container.scrollTo({ left: 1000, behavior: 'smooth' });
            }
        }
    }, [isSwiped, isInteracting]);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollLeft = scrollContainerRef.current.scrollLeft;

            // Detect Open
            if (scrollLeft > 20 && onSwipeOpen && !isSwiped) {
                onSwipeOpen();
            }

            // Detect Close (manual scroll back)
            if (scrollLeft < 10 && onSwipeClose && isSwiped) {
                onSwipeClose();
            }
        }
    };

    const handleTouchStart = () => setIsInteracting(true);
    const handleTouchEnd = () => {
        setIsInteracting(false);
        // Trigger a check after touch ends to ensure snap state matches logic
        // logic moved to useEffect or handled by next scroll event
    };

    const selectedBrand = brandOptions.find(b => b.id === line.brandProductId);
    const displayImage = selectedBrand?.imageUrl || genericItem?.imageUrl;
    const displayName = genericItem?.canonicalName || "Producto";
    const displayPrice = line.unitPrice || genericItem?.globalPrice || 0;

    const lineTotal = displayPrice * (line.qty || 1);

    return (
        <div className="relative w-full rounded-xl overflow-hidden touch-pan-x">
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
                {/* Main Card Content - Slide 1 */}
                <Card
                    className={`min-w-full snap-center bg-bg-1 border-border hover:bg-bg-2/30 transition-all duration-300 overflow-hidden cursor-pointer ${isChecked ? 'opacity-60 border-accent-success/50' : 'hover:border-accent-violet/30 hover:shadow-lg hover:shadow-accent-violet/5'}`}
                    onClick={() => !isReadOnly && onCheckChange(!isChecked)}
                >
                    <div className="flex items-center gap-2 px-2 py-0.5 sm:py-1">
                        {/* Image */}
                        <div
                            className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center"
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
                                        className="h-auto min-h-[32px] sm:min-h-[40px] px-1.5 py-0.5 sm:py-1 flex flex-col items-center justify-center gap-0.5 bg-bg-2 border border-border hover:bg-bg-3 hover:border-accent-violet/50 rounded-md group/price w-[70px] sm:w-[75px]"
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
                                    <div className="h-auto min-h-[32px] sm:min-h-[40px] px-1.5 py-0.5 sm:py-1 flex flex-col items-center justify-center gap-0.5 bg-bg-2/50 border border-transparent rounded-md w-[70px] sm:w-[75px]">
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
                                    {/* Eye Button - Desktop Only */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`hidden sm:flex h-[30px] bg-bg-2 border border-border hover:bg-bg-3 hover:border-blue-500/30 text-text-3 hover:text-blue-400 rounded-md transition-colors ${!isChecked && onDelete ? 'flex-1' : 'w-full'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenDetails();
                                        }}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </Button>

                                    {/* Delete Button - Desktop Only */}
                                    {!isChecked && onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hidden sm:flex h-[30px] flex-1 bg-bg-2 border border-border hover:bg-bg-3 hover:border-red-500/30 text-text-3 hover:text-red-500 rounded-md transition-colors"
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

                {/* Swipe Actions - Slide 2 (Mobile Only) */}
                {/* Only show/allow swipe if checked is false and onDelete exists */}
                {!isChecked && onDelete && (
                    <div className="flex flex-col min-w-[80px] snap-center ml-2 h-auto">
                        {/* Edit Button (Top) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex-1 w-full rounded-t-xl rounded-b-none bg-accent-info hover:bg-accent-info/90 text-white shadow-none border-b border-white/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenDetails();
                            }}
                        >
                            <Eye className="w-5 h-5" />
                        </Button>

                        {/* Delete Button (Bottom) */}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="flex-1 w-full rounded-b-xl rounded-t-none bg-red-500 hover:bg-red-600 text-white shadow-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

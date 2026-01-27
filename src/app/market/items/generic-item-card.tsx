"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, Tag, Trash2 } from "lucide-react";
import { GenericItem, Category } from "@/domain/entities";
import Link from "next/link";
import { DeleteGenericItemIconButton } from "./delete-generic-item-icon-button";

interface GenericItemCardProps {
    item: GenericItem;
    categories: Category[];
}

export function GenericItemCard({ item, categories }: GenericItemCardProps) {
    const categoryName = item.primaryCategoryId
        ? categories.find(c => c.id === item.primaryCategoryId)?.name
        : null;

    return (
        <Link href={`/market/items/${item.id}`}>
            <Card className="bg-bg-1 border-border hover:bg-bg-2/30 transition-all duration-300 hover:border-accent-violet/30 hover:shadow-lg hover:shadow-accent-violet/5 overflow-hidden group">
                <div className="flex items-center gap-3 px-3 py-2">
                    {/* Image/Icon */}
                    <div className="w-16 h-16 shrink-0 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.canonicalName}
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
                                {item.canonicalName}
                            </h3>
                            <div className="flex items-center gap-2">
                                {categoryName && (
                                    <Badge variant="outline" className="text-[10px] border-border/50 text-text-3 px-1.5 py-0 h-4">
                                        <Tag className="w-2.5 h-2.5 mr-1" />
                                        {categoryName}
                                    </Badge>
                                )}
                                {item.aliases.length > 0 && (
                                    <span className="text-[10px] text-text-3">
                                        +{item.aliases.length} alias
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right: Price and Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                            {/* Price */}
                            {item.globalPrice ? (
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
                                <DeleteGenericItemIconButton id={item.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

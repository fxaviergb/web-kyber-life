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
            <Card className="relative bg-bg-1 border-border hover:bg-bg-2/30 transition-all duration-300 hover:border-accent-violet/30 hover:shadow-lg hover:shadow-accent-violet/5 overflow-hidden group">
                <div className="flex items-start gap-4 p-5">
                    {/* Image/Icon */}
                    <div className="w-20 h-20 shrink-0 bg-bg-2 rounded-xl overflow-hidden flex items-center justify-center border border-border/50 shadow-sm">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.canonicalName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <ShoppingBasket className="w-8 h-8 text-text-3/30" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-text-1 group-hover:text-accent-violet transition-colors leading-snug line-clamp-2 break-words">
                                {item.canonicalName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {categoryName && (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs font-normal border-border/50 text-text-3 px-2 py-0.5 bg-bg-2/50">
                                        <Tag className="w-3 h-3 mr-1 opacity-70" />
                                        {categoryName}
                                    </Badge>
                                )}
                                {item.aliases.length > 0 && (
                                    <span className="text-[10px] sm:text-xs text-text-3">
                                        +{item.aliases.length} alias
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right: Price & Actions */}
                        <div className="shrink-0 flex flex-col items-end gap-2">
                            {item.globalPrice ? (
                                <div className="text-right">
                                    <div className="font-bold text-accent-mint text-xl sm:text-2xl leading-none">
                                        ${item.globalPrice.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-text-3 uppercase tracking-wider mt-0.5">
                                        {item.currencyCode}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs text-text-3 italic opacity-60 py-1">Sin precio</span>
                            )}

                            <div
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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

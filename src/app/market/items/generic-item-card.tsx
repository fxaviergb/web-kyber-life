"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, Edit, Trash2, MoreVertical, Package, Tag } from "lucide-react";
import { GenericItem, Category } from "@/domain/entities";
import Link from "next/link";
import { DeleteGenericItemIconButton } from "./delete-generic-item-icon-button";
import { Button } from "@/components/ui/button";

import { GenericItemDialog } from "./generic-item-dialog";

interface GenericItemCardProps {
    item: GenericItem;
    categories: Category[];
}

export function GenericItemCard({ item, categories }: GenericItemCardProps) {
    const categoryName = item.primaryCategoryId
        ? categories.find(c => c.id === item.primaryCategoryId)?.name
        : null;

    return (
        <div className="cursor-pointer group relative h-full">
            <Link href={`/market/items/${item.id}`} className="absolute inset-0 z-10" />

            <Card className="bg-bg-1 border-border group-hover:bg-bg-2/30 transition-all duration-300 group-hover:border-accent-violet/30 group-hover:shadow-lg group-hover:shadow-accent-violet/5 h-full flex flex-col relative z-0">
                <div className="aspect-video w-full bg-bg-2 relative overflow-hidden">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.canonicalName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-3/30">
                            <ShoppingBasket className="w-8 h-8" />
                        </div>
                    )}

                    {categoryName && (
                        <Badge className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-text-2 text-[10px] px-1.5 py-0 h-5 border-none">
                            {categoryName}
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
                            {item.canonicalName}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {item.aliases.length > 0 && (
                                <p className="text-[9px] text-text-3 truncate w-full opacity-70">
                                    {item.aliases.join(", ")}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions overlay - above the link */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                <GenericItemDialog
                    mode="edit"
                    item={item}
                    categories={categories}
                    trigger={
                        <Button variant="ghost" size="icon" className="h-6 w-6 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full">
                            <Edit className="w-3 h-3" />
                        </Button>
                    }
                />
                <div onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}>
                    <DeleteGenericItemIconButton id={item.id} />
                </div>
            </div>
        </div>
    );
}

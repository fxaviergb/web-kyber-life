"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenericItem, BrandProduct, Category } from "@/domain/entities";
import { ShoppingBasket, ExternalLink } from "lucide-react";

interface ProductDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    genericItem: GenericItem | null;
    selectedBrand?: BrandProduct | null;
    categories: Category[];
    onEdit?: () => void;
}

export function ProductDetailModal({
    open,
    onOpenChange,
    genericItem,
    selectedBrand,
    categories,
    onEdit
}: ProductDetailModalProps) {
    if (!genericItem) return null;

    const displayImage = selectedBrand?.imageUrl || genericItem.imageUrl;
    const categoryName = genericItem.primaryCategoryId
        ? categories.find(c => c.id === genericItem.primaryCategoryId)?.name
        : null;

    const displayPrice = selectedBrand?.globalPrice || genericItem.globalPrice;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-bg-1 border-border text-text-1 max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-text-1">Detalle del Producto</DialogTitle>
                        {onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-accent-violet text-accent-violet hover:bg-accent-violet/10"
                                onClick={() => {
                                    onEdit();
                                    onOpenChange(false);
                                }}
                            >
                                Editar
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Image */}
                    <div className="w-32 h-32 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center mx-auto">
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={genericItem.canonicalName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <ShoppingBasket className="w-12 h-12 text-text-3/30" />
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-text-3 uppercase tracking-wide">Producto</p>
                            <h3 className="text-lg font-bold text-text-1">{genericItem.canonicalName}</h3>
                        </div>

                        {categoryName && (
                            <div>
                                <p className="text-xs text-text-3 uppercase tracking-wide">Categoría</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                    {categoryName}
                                </Badge>
                            </div>
                        )}

                        {selectedBrand && (
                            <div>
                                <p className="text-xs text-text-3 uppercase tracking-wide">Marca Seleccionada</p>
                                <p className="text-sm text-text-1 font-medium">{selectedBrand.brand}</p>
                            </div>
                        )}

                        {genericItem.aliases && genericItem.aliases.length > 0 && (
                            <div>
                                <p className="text-xs text-text-3 uppercase tracking-wide">Valor Sugerido</p>
                                <p className="text-sm text-text-2 italic">
                                    {genericItem.aliases.join(", ") || "No definido"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    {displayPrice !== null && displayPrice !== undefined && (
                        <div className="bg-bg-2/50 p-4 rounded-lg">
                            <p className="text-xs text-text-3 uppercase tracking-wide mb-1">Precio Global</p>
                            <p className="text-2xl font-bold text-accent-mint">
                                ${displayPrice.toFixed(2)} <span className="text-sm text-text-3">USD</span>
                            </p>
                        </div>
                    )}

                    {/* View Full Details */}
                    <Button
                        variant="outline"
                        className="w-full border-border text-text-2 hover:bg-bg-2"
                        asChild
                    >
                        <a href={`/market/items/${genericItem.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver Detalle Completo
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenericItem, BrandProduct, Category } from "@/domain/entities";
import { ShoppingBasket, ExternalLink, Save, X, Pencil, Loader2 } from "lucide-react";
import { updateGenericItemAction } from "@/app/actions/product";

interface ProductDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    genericItem: GenericItem | null;
    selectedBrand?: BrandProduct | null;
    categories: Category[];
    onEdit?: () => void; // Keeping for compatibility, but might not be used
}

export function ProductDetailModal({
    open,
    onOpenChange,
    genericItem,
    selectedBrand,
    categories,
    onEdit
}: ProductDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Edit State
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editImage, setEditImage] = useState("");

    if (!genericItem) return null;

    const displayImage = isEditing ? editImage : (selectedBrand?.imageUrl || genericItem.imageUrl);
    const categoryName = genericItem.primaryCategoryId
        ? categories.find(c => c.id === genericItem.primaryCategoryId)?.name
        : null;

    const displayPrice = selectedBrand?.globalPrice || genericItem.globalPrice;

    function startEditing() {
        setEditName(genericItem!.canonicalName);
        setEditPrice(genericItem!.globalPrice?.toString() || "");
        setEditImage(genericItem!.imageUrl || "");
        setIsEditing(true);
    }

    function cancelEditing() {
        setIsEditing(false);
    }

    async function handleSave() {
        setLoading(true);
        const formData = new FormData();
        formData.append("id", genericItem!.id);
        formData.append("name", editName);
        if (editPrice) formData.append("globalPrice", editPrice);
        if (editImage) formData.append("imageUrl", editImage);

        // Preserve existing fields
        if (genericItem!.primaryCategoryId) formData.append("primaryCategoryId", genericItem!.primaryCategoryId);
        if (genericItem!.secondaryCategoryIds) {
            genericItem!.secondaryCategoryIds.forEach(id => formData.append("secondaryCategoryIds", id));
        }
        if (genericItem!.aliases) {
            genericItem!.aliases.forEach(a => formData.append("aliases", a));
        }
        if (genericItem!.currencyCode) formData.append("currencyCode", genericItem!.currencyCode);


        const res = await updateGenericItemAction(null, formData);

        setLoading(false);
        if (res?.error) {
            alert(res.error); // Simple alert for now
        } else {
            setIsEditing(false);
            // Optionally triggering a refresh or just trusting revalidatePath
        }
    }

    return (
        <ResponsiveDialog open={open} onOpenChange={(val) => {
            if (!val) setIsEditing(false);
            onOpenChange(val);
        }}>
            <ResponsiveDialogContent className="bg-bg-1 border-border text-text-1 max-w-md">
                <ResponsiveDialogHeader>
                    <div className="flex items-center justify-between">
                        <ResponsiveDialogTitle className="text-text-1">
                            {isEditing ? "Editar Producto" : "Detalle del Producto"}
                        </ResponsiveDialogTitle>
                        {!isEditing ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-accent-violet text-accent-violet hover:bg-accent-violet/10"
                                onClick={startEditing}
                            >
                                <Pencil className="w-3.5 h-3.5 mr-2" />
                                Editar
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-text-3 hover:text-text-1"
                                onClick={cancelEditing}
                                disabled={loading}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </ResponsiveDialogHeader>

                <div className="space-y-4 px-1 pb-4">
                    {isEditing ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-center">
                                <div className="w-32 h-32 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center relative group">
                                    {editImage ? (
                                        <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBasket className="w-12 h-12 text-text-3/30" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="bg-bg-2 border-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL de Imagen</Label>
                                <Input
                                    value={editImage}
                                    onChange={e => setEditImage(e.target.value)}
                                    className="bg-bg-2 border-input"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Precio Global Est.</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-text-3">$</span>
                                    <Input
                                        type="number"
                                        value={editPrice}
                                        onChange={e => setEditPrice(e.target.value)}
                                        className="pl-7 bg-bg-2 border-input"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full bg-accent-violet hover:bg-accent-violet/90 text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex gap-6">
                                <div className="w-32 h-32 bg-bg-2 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border">
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

                                <div className="space-y-4 flex-1 min-w-0">
                                    <div>
                                        <p className="text-xs text-text-3 uppercase tracking-wide">Producto</p>
                                        <h3 className="text-lg font-bold text-text-1 leading-tight line-clamp-2">{genericItem.canonicalName}</h3>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-3 uppercase tracking-wide">Categoría</p>
                                        <p className="text-sm text-text-1 font-medium">
                                            {categoryName || "Sin Categoría"}
                                        </p>
                                    </div>

                                    {selectedBrand && (
                                        <div>
                                            <p className="text-xs text-text-3 uppercase tracking-wide">Marca</p>
                                            <p className="text-sm text-text-1">{selectedBrand.brand}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="bg-bg-2/50 p-4 rounded-lg flex items-center justify-between border border-border/50">
                                <div>
                                    <p className="text-xs text-text-3 uppercase tracking-wide">Precio Global</p>
                                    {displayPrice !== null && displayPrice !== undefined ? (
                                        <p className="text-2xl font-bold text-accent-mint animate-pulse-slow">
                                            ${displayPrice.toFixed(2)} <span className="text-sm text-text-3 font-normal">USD</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-text-3 italic mt-1">Sin precio definido</p>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full border-accent-violet/50 text-accent-violet hover:bg-accent-violet/10 h-10"
                                asChild
                            >
                                <a href={`/market/items/${genericItem.id}`}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver Detalle Completo
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}

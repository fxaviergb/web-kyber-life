"use client";

import { useState, useEffect } from "react";
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
    onEdit?: () => void; // Deprecated, kept for compatibility if needed
}

export function ProductDetailModal({
    open,
    onOpenChange,
    genericItem,
    selectedBrand,
    categories,
}: ProductDetailModalProps) {
    const [loading, setLoading] = useState(false);

    // Edit State
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editImage, setEditImage] = useState("");
    const [editCategoryId, setEditCategoryId] = useState("");

    useEffect(() => {
        if (open && genericItem) {
            setEditName(genericItem.canonicalName);
            setEditPrice(genericItem.globalPrice?.toString() || "");
            setEditImage(genericItem.imageUrl || "");
            setEditCategoryId(genericItem.primaryCategoryId || "");
        }
    }, [open, genericItem]);

    if (!genericItem) return null;



    async function handleSave() {
        setLoading(true);
        const formData = new FormData();
        formData.append("id", genericItem!.id);
        formData.append("name", editName);
        if (editPrice) formData.append("globalPrice", editPrice);
        if (editImage) formData.append("imageUrl", editImage);
        if (editCategoryId) formData.append("primaryCategoryId", editCategoryId);

        // Preserve existing fields
        if (!editCategoryId && genericItem!.primaryCategoryId) formData.append("primaryCategoryId", genericItem!.primaryCategoryId);
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
            onOpenChange(false);
        }
    }

    return (
        <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogContent className="bg-bg-1 border-border text-text-1 max-w-md">
                <ResponsiveDialogHeader>
                    <div className="flex items-center justify-between">
                        <ResponsiveDialogTitle className="text-text-1">
                            Editar Producto
                        </ResponsiveDialogTitle>
                    </div>
                </ResponsiveDialogHeader>

                <div className="space-y-4 px-1 pb-4">
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
                            <Label>Categoría</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-bg-2 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editCategoryId}
                                onChange={(e) => setEditCategoryId(e.target.value)}
                            >
                                <option value="">Sin Categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
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
                            <Label>Precio estimado</Label>
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
                </div>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}

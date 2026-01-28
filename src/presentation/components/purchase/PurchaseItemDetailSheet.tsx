"use client";

import { useState, useEffect } from "react";
import { PurchaseLine, BrandProduct, Unit, GenericItem } from "@/domain/entities";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PurchaseItemDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    line: PurchaseLine;
    genericItem: GenericItem;
    brandOptions: BrandProduct[];
    units: Unit[];
    onUpdate: (updates: Partial<PurchaseLine>) => void;
    onCreateBrand: () => void;
}

export function PurchaseItemDetailSheet({
    open,
    onOpenChange,
    line,
    genericItem,
    brandOptions,
    units,
    onUpdate,
    onCreateBrand
}: PurchaseItemDetailSheetProps) {
    const [tempBrand, setTempBrand] = useState(line.brandProductId || "");
    const [tempQty, setTempQty] = useState(line.qty?.toString() || "1");
    const [tempUnit, setTempUnit] = useState(line.unitId || "");
    const [tempPrice, setTempPrice] = useState(line.unitPrice?.toString() || "");

    useEffect(() => {
        const defaultUnitId = units.find(u => u.symbol?.toLowerCase() === "und" || u.name.toLowerCase() === "unidad")?.id || "";

        setTempBrand(line.brandProductId || "");
        setTempQty(line.qty?.toString() || "1");
        setTempUnit(line.unitId || defaultUnitId);
        setTempPrice(line.unitPrice?.toString() || "");
    }, [line, units]);

    const handleSave = () => {
        const updates: Partial<PurchaseLine> = {};

        if ((tempBrand || "") !== (line.brandProductId || "")) {
            updates.brandProductId = tempBrand || null;
        }

        const qty = parseFloat(tempQty);
        if (!isNaN(qty) && qty !== line.qty) {
            updates.qty = qty;
        }

        if ((tempUnit || "") !== (line.unitId || "")) {
            updates.unitId = tempUnit || null;
        }

        const price = parseFloat(tempPrice);
        if (!isNaN(price) && price !== line.unitPrice) {
            updates.unitPrice = price;
        }

        if (Object.keys(updates).length > 0) {
            onUpdate(updates);
        }

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-text-primary">
                        {genericItem?.canonicalName || "Detalles del Item"}
                    </DialogTitle>
                    <DialogDescription className="text-text-tertiary">
                        Edita los detalles específicos de este producto
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Brand Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="brand" className="text-text-secondary">
                            Marca / Presentación
                        </Label>
                        <select
                            id="brand"
                            className="flex h-10 w-full rounded-md border border-border-base bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                            value={tempBrand}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "new_option") {
                                    onCreateBrand();
                                } else {
                                    setTempBrand(val);

                                    // Auto-update price based on selection
                                    if (val) {
                                        const brand = brandOptions.find(b => b.id === val);
                                        if (brand && typeof brand.globalPrice === 'number') {
                                            setTempPrice(brand.globalPrice.toString());
                                        }
                                    } else {
                                        setTempPrice((genericItem.globalPrice || 0).toString());
                                    }
                                }
                            }}
                        >
                            <option value="">Genérico</option>
                            {brandOptions.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.brand} {b.presentation}
                                    {b.globalPrice ? ` ($${b.globalPrice})` : ""}
                                </option>
                            ))}
                            <option value="new_option" className="font-semibold text-accent-primary">
                                + Crear nueva marca...
                            </option>
                        </select>
                    </div>

                    {/* Quantity and Unit in same row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quantity" className="text-text-secondary">
                                Cantidad
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="0.1"
                                min="0"
                                value={tempQty}
                                onChange={(e) => setTempQty(e.target.value)}
                                className="bg-bg-secondary border-border-base"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="unit" className="text-text-secondary">
                                Unidad
                            </Label>
                            <select
                                id="unit"
                                className="flex h-10 w-full rounded-md border border-border-base bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                                value={tempUnit}
                                onChange={(e) => setTempUnit(e.target.value)}
                            >
                                <option value="">--</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.symbol || u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="grid gap-2">
                        <Label htmlFor="price" className="text-text-secondary">
                            Precio Unitario
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-text-tertiary">$</span>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                className="pl-7 bg-bg-secondary border-border-base"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useEffect } from "react";
import { PurchaseLine, BrandProduct, Unit, GenericItem } from "@/domain/entities";
import { CheckCircle } from "lucide-react";
import { FormSheet } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PurchaseItemDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    line: PurchaseLine;
    genericItem: GenericItem;
    brandOptions: BrandProduct[];
    units: Unit[];
    onUpdate: (updates: Partial<PurchaseLine>) => void;
    onSaveAndCheck?: (updates: Partial<PurchaseLine>) => void;
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
    onSaveAndCheck,
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

    const handleSaveAndCheck = () => {
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

        // Always include checked and the current price
        updates.checked = true;
        if (updates.unitPrice === undefined) {
            updates.unitPrice = line.unitPrice;
        }

        onSaveAndCheck?.(updates);
        onOpenChange(false);
    };

    return (
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            title={genericItem?.canonicalName || "Detalles del Item"}
            description="Edita los detalles específicos de este producto"
            contentClassName="sm:max-w-md"
            bodyClassName="space-y-4 py-4"
            footer={
                <>
                    <Button
                        onClick={handleSaveAndCheck}
                        className="w-full bg-accent-success hover:bg-accent-success/90 text-white"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Guardar y Marcar Comprado
                    </Button>
                    <Button onClick={handleSave} className="w-full">
                        Guardar Cambios
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                </>
            }
        >
            <Field label="Marca / Presentación" htmlFor="brand">
                <select
                    id="brand"
                    className="flex h-10 w-full rounded-lg border border-border-base bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Cantidad" htmlFor="quantity">
                    <Input
                        id="quantity"
                        type="number"
                        step="0.1"
                        min="0"
                        value={tempQty}
                        onChange={(e) => setTempQty(e.target.value)}
                    />
                </Field>

                <Field label="Unidad" htmlFor="unit">
                    <select
                        id="unit"
                        className="flex h-10 w-full rounded-lg border border-border-base bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
                </Field>
            </div>

            <Field label="Precio Unitario" htmlFor="price">
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
                        className="pl-7"
                    />
                </div>
            </Field>
        </FormSheet>
    );
}

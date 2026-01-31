"use client";

import { useActionState, useState, useEffect } from "react";
import { updateTemplateItemAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit2, Loader2, Save, X, ImageIcon, ExternalLink } from "lucide-react";
import { Unit, Category } from "@/domain/entities";
import { RemoveTemplateItemButton } from "./remove-item-button";
import Link from "next/link";

interface ItemDetailDialogProps {
    templateId: string;
    item: {
        id: string;
        genericName: string;
        defaultQty: number | null;
        defaultUnitId: string | null;
        genericItemId?: string;
        globalPrice?: number | null;
        currencyCode?: string;
        categoryId?: string | null;
        imageUrl?: string | null;
    };
    units: Unit[];
    categories: Category[];
    trigger?: React.ReactNode;
}

export function ItemDetailDialog({ templateId, item, units, categories, trigger }: ItemDetailDialogProps) {
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [state, formAction, isPending] = useActionState(
        updateTemplateItemAction.bind(null, templateId, item.id),
        null
    );

    useEffect(() => {
        if (state?.success) {
            setOpen(false);
            setIsEditing(false);
        }
    }, [state]);

    useEffect(() => {
        if (!open) setIsEditing(false);
    }, [open]);

    const currency = item.currencyCode || "USD";
    const unitName = item.defaultUnitId ? units.find(u => u.id === item.defaultUnitId)?.symbol : "unid.";
    const categoryName = item.categoryId ? categories.find(c => c.id === item.categoryId)?.name : "Sin Categoría";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="text-text-3 hover:text-accent-violet h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-bg-1 border-border sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <DialogTitle className="text-text-1 text-xl">
                            {isEditing ? "Editar Producto" : "Detalle del Producto"}
                        </DialogTitle>
                        {!isEditing && (
                            <div className="flex items-center gap-2">
                                <RemoveTemplateItemButton templateId={templateId} itemId={item.id} />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="border-accent-violet/50 text-accent-violet hover:bg-accent-violet/10"
                                >
                                    <Edit2 className="w-3 h-3 mr-2" /> Editar
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {isEditing ? (
                    <form action={formAction} className="space-y-4 py-4">
                        {/* Hidden inputs */}
                        {item.genericItemId && <input type="hidden" name="genericItemId" value={item.genericItemId} />}
                        <input type="hidden" name="currencyCode" value={currency} />

                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className="text-text-2">Nombre del Producto</Label>
                                <Input
                                    name="name"
                                    defaultValue={item.genericName}
                                    className="bg-bg-2 border-border w-full"
                                    required
                                />
                            </div>

                            {/* Image URL & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-text-2">URL de Imagen</Label>
                                    <Input
                                        name="imageUrl"
                                        type="url"
                                        defaultValue={item.imageUrl || ""}
                                        placeholder="https://..."
                                        className="bg-bg-2 border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-text-2">Categoría</Label>
                                    <Select name="categoryId" defaultValue={item.categoryId || undefined}>
                                        <SelectTrigger className="bg-bg-2 border-border w-full">
                                            <SelectValue placeholder="Categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Default Qty & Unit */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                                <div className="space-y-2">
                                    <Label className="text-text-2">Cant. Sugerida</Label>
                                    <Input
                                        name="defaultQty"
                                        type="number"
                                        step="0.01"
                                        defaultValue={item.defaultQty || ""}
                                        className="bg-bg-2 border-border w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-text-2">Unidad</Label>
                                    <Select name="defaultUnitId" defaultValue={item.defaultUnitId || units.find(u => u.symbol?.toLowerCase() === "und" || u.name.toLowerCase() === "unidad")?.id}>
                                        <SelectTrigger className="bg-bg-2 border-border w-full">
                                            <SelectValue placeholder="Unidad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Ninguna</SelectItem>
                                            {units.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Global Price */}
                            <div className="space-y-2 border-t border-border pt-4">
                                <Label className="text-text-2 flex justify-between">
                                    <span>Precio Referencial</span>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 font-semibold">$</span>
                                    <Input
                                        name="globalPrice"
                                        type="number"
                                        step="0.01"
                                        defaultValue={item.globalPrice || ""}
                                        className="pl-7 bg-bg-2 border-border w-full"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 text-xs">{currency}</span>
                                </div>
                            </div>
                        </div>

                        {state?.error && <p className="text-destructive text-xs">{state.error}</p>}

                        <DialogFooter className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                disabled={isPending}
                            >
                                <X className="w-4 h-4 mr-2" /> Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-accent-violet">
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Save className="w-4 h-4 mr-2" /> Guardar</>}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="flex gap-6">
                            <div className="w-32 h-32 rounded-lg bg-bg-2 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.genericName} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-12 h-12 text-text-3/50" />
                                )}
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <Label className="text-xs text-text-3 uppercase tracking-wider">Producto</Label>
                                    <p className="text-lg font-bold text-text-1 leading-tight">{item.genericName}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-text-3 uppercase tracking-wider">Categoría</Label>
                                    <p className="text-sm text-text-2">{categoryName}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-text-3 uppercase tracking-wider">Valor Sugerido</Label>
                                    <p className="text-sm text-text-2">
                                        {item.defaultQty ? `${item.defaultQty} ${unitName}` : "No definido"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-bg-2/50 p-4 rounded-lg border border-border/50">
                            <Label className="text-xs text-text-3 uppercase tracking-wider block mb-2">Precio Global</Label>
                            {item.globalPrice ? (
                                <p className="text-2xl font-bold text-accent-mint animate-pulse-slow">
                                    ${item.globalPrice.toFixed(2)} <span className="text-sm font-normal text-text-3">{currency}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-text-3 italic">Sin precio definido</p>
                            )}
                        </div>

                        {item.genericItemId && (
                            <div className="flex justify-end">
                                <Link href={`/market/items/${item.genericItemId}`} className="w-full">
                                    <Button variant="outline" className="w-full border-accent-violet/50 text-accent-violet hover:bg-accent-violet/10">
                                        <ExternalLink className="w-4 h-4 mr-2" /> Ver Detalle Completo
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

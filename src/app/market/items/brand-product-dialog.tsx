"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useState } from "react";
import { createBrandProductAction, updateBrandProductAction, addPriceObservationAction } from "@/app/actions/product";
import { createSupermarketAction } from "@/app/actions/master-data";
import { BrandProduct, Supermarket, PriceObservation } from "@/domain/entities";
import { Loader2, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface BrandProductDialogProps {
    mode: 'create' | 'edit';
    genericItemId?: string;
    product?: BrandProduct;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    supermarkets: Supermarket[];
    observations?: PriceObservation[];
}

export function BrandProductDialog({
    mode,
    genericItemId,
    product,
    trigger,
    open: controlledOpen,
    onOpenChange,
    supermarkets,
    observations = []
}: BrandProductDialogProps) {
    const [open, setOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const effectiveOpen = isControlled ? controlledOpen : open;
    const effectiveSetOpen = isControlled ? onOpenChange! : setOpen;

    // Fixed Action Assignment for useActionState
    // useActionState expects (prevState, formData)
    // createBrandProductAction(genericItemId, prevState, formData) -> bound(null, genericItemId)
    const action = mode === 'create'
        ? createBrandProductAction.bind(null, genericItemId!)
        : updateBrandProductAction;

    const [state, formAction, isPending] = useActionState(action, null);

    const [obsState, obsAction, obsPending] = useActionState(addPriceObservationAction, null);
    const [marketActionState, marketFormAction, marketPending] = useActionState(createSupermarketAction, null);
    const [showNewMarketInput, setShowNewMarketInput] = useState(false);

    useEffect(() => {
        if (state?.success && mode === 'create') {
            effectiveSetOpen(false);
        }
    }, [state, mode, effectiveSetOpen]);

    useEffect(() => {
        if (marketActionState?.success) {
            setShowNewMarketInput(false);
        }
    }, [marketActionState]);

    const title = mode === 'create' ? "Nueva Opción de Marca" : "Editar Opción";

    return (
        <Dialog open={effectiveOpen} onOpenChange={effectiveSetOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="bg-bg-1 border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-text-1">{title}</DialogTitle>
                    <DialogDescription className="text-text-2">
                        Define la marca, presentación y precios.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="grid gap-4 py-4">
                    {mode === 'edit' && product && <input type="hidden" name="id" value={product.id} />}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="brand" className="text-text-1">Marca</Label>
                            <Input id="brand" name="brand" defaultValue={product?.brand} placeholder="Ej. Bimbo" required className="bg-bg-0 text-text-1" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="presentation" className="text-text-1">Presentación</Label>
                            <Input id="presentation" name="presentation" defaultValue={product?.presentation} placeholder="Ej. 600g" required className="bg-bg-0 text-text-1" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="imageUrl" className="text-text-1">Imagen URL</Label>
                        <Input id="imageUrl" name="imageUrl" defaultValue={product?.imageUrl || ""} placeholder="https://..." className="bg-bg-0 text-text-1" />
                    </div>

                    <Separator className="bg-border" />

                    <div className="grid gap-2">
                        <Label className="text-text-1">Precio Referencial Global</Label>
                        <div className="flex gap-2">
                            <Input
                                name="globalPrice"
                                type="number"
                                step="0.01"
                                defaultValue={product?.globalPrice || ""}
                                placeholder="0.00"
                                className="bg-bg-0 text-text-1 flex-1"
                            />
                            <Input
                                name="currencyCode"
                                defaultValue={product?.currencyCode || "USD"}
                                className="bg-bg-0 text-text-1 w-20"
                                readOnly
                            />
                        </div>
                        <p className="text-xs text-text-3">Se usará si no hay precio específico.</p>
                    </div>

                    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className="bg-accent-violet text-white">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'create' ? "Crear Opción" : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>

                {mode === 'edit' && product && (
                    <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-medium text-text-1 mb-3">Disponibilidad y Precios Localizados</h4>

                        <div className="space-y-2 mb-4">
                            {observations.length === 0 && <p className="text-sm text-text-3 italic">No hay supermercados asociados.</p>}
                            {observations.map(obs => {
                                const market = supermarkets.find(s => s.id === obs.supermarketId);
                                return (
                                    <div key={obs.id} className="flex justify-between items-center text-sm bg-bg-0 p-2 rounded border border-border">
                                        <span className="text-text-1 font-medium">{market?.name || "Supermercado"}</span>
                                        <div className="text-right">
                                            {obs.unitPrice !== null ? (
                                                <span className="text-accent-violet font-bold">{obs.unitPrice.toFixed(2)} {obs.currencyCode}</span>
                                            ) : (
                                                <span className="text-text-3 italic text-xs">Sin precio (Disponible)</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-bg-2/50 p-3 rounded-lg border border-border">
                            {showNewMarketInput ? (
                                <form action={marketFormAction} className="flex gap-2 items-end mb-2">
                                    <div className="grid gap-1 flex-1">
                                        <Label className="text-xs text-text-2">Nuevo Supermercado</Label>
                                        <Input name="name" required placeholder="Nombre del súper" className="h-8 text-xs bg-bg-0" />
                                    </div>
                                    <Button type="submit" size="sm" disabled={marketPending} className="h-8 bg-primary text-primary-foreground">
                                        {marketPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Crear"}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setShowNewMarketInput(false)}>Cancelar</Button>
                                </form>
                            ) : (
                                <form action={obsAction} className="flex gap-2 items-end">
                                    <input type="hidden" name="brandProductId" value={product.id} />
                                    <input type="hidden" name="currencyCode" value={product.currencyCode || "USD"} />

                                    <div className="grid gap-1 flex-1">
                                        <Label className="text-xs text-text-2">Supermercado</Label>
                                        <Select name="supermarketId" required onValueChange={(val) => {
                                            if (val === 'new') setShowNewMarketInput(true);
                                        }}>
                                            <SelectTrigger className="h-8 text-xs bg-bg-0"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                            <SelectContent>
                                                {supermarkets.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                <SelectItem value="new" className="text-accent-violet font-medium">+ Crear nuevo súper</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1 w-24">
                                        <Label className="text-xs text-text-2">Precio (Opc.)</Label>
                                        <Input name="unitPrice" type="number" step="0.01" className="h-8 text-xs bg-bg-0" placeholder="-" />
                                    </div>
                                    <Button type="submit" size="sm" disabled={obsPending} className="h-8 bg-secondary text-secondary-foreground">
                                        {obsPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </form>
                            )}
                            {obsState?.error && <p className="text-xs text-destructive mt-1">{obsState.error}</p>}
                            {marketActionState?.error && <p className="text-xs text-destructive mt-1">{marketActionState.error}</p>}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

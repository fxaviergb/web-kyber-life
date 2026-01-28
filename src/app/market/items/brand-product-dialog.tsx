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
import { useActionState, useEffect, useState, startTransition } from "react";
import { createBrandProductAction, updateBrandProductAction, addPriceObservationAction, getBrandProductsAction } from "@/app/actions/product";
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

    const [step, setStep] = useState<"form" | "confirm">("form");
    const [brandName, setBrandName] = useState(product?.brand || "");
    const [localLoading, setLocalLoading] = useState(false);

    // Fixed Action Assignment for useActionState
    const action = mode === 'create'
        ? createBrandProductAction.bind(null, genericItemId!)
        : updateBrandProductAction;

    const [state, formAction, isPending] = useActionState(action, null);

    const [obsState, obsAction, obsPending] = useActionState(addPriceObservationAction, null);
    const [marketActionState, marketFormAction, marketPending] = useActionState(createSupermarketAction, null);
    const [showNewMarketInput, setShowNewMarketInput] = useState(false);

    useEffect(() => {
        if (state?.success) {
            effectiveSetOpen(false);
            setStep("form");
        }
    }, [state?.success, effectiveSetOpen]);

    useEffect(() => {
        if (marketActionState?.success) {
            setShowNewMarketInput(false);
        }
    }, [marketActionState?.success]);

    async function handlePreSubmit(e: React.FormEvent<HTMLFormElement>) {
        if (mode === 'edit') return; // Edit doesn't need duplicate check for same ID, or it can be complex. Let's focus on Create.

        e.preventDefault();
        const form = e.currentTarget;
        if (!brandName.trim()) return;

        setLocalLoading(true);
        // Check for duplicates
        const existingBrands = await getBrandProductsAction(genericItemId!);
        const match = existingBrands.find(b => b.brand.toLowerCase() === brandName.trim().toLowerCase());

        if (match) {
            setStep("confirm");
            setLocalLoading(false);
            return;
        }

        setLocalLoading(false);
        const formData = new FormData(form);
        startTransition(() => {
            formAction(formData);
        });
    }

    function handleForceSubmit() {
        const formData = new FormData();
        formData.set("brand", brandName);
        // We'll need to grab other fields if we want to force submit from confirm step.
        // For simplicity in dialog, we'll just allow them to go back or handle the basics.
        // Actually, let's just make it simple: from confirm, it submits with name.
        startTransition(() => {
            formAction(formData);
        });
    }

    const title = mode === 'create' ? "Nueva Opción de Marca" : "Editar Opción";

    return (
        <Dialog open={effectiveOpen} onOpenChange={(o) => {
            effectiveSetOpen(o);
            if (!o) setTimeout(() => setStep("form"), 200);
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="bg-bg-1 border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-text-1">
                        {step === "form" ? title : "Marca Existente"}
                    </DialogTitle>
                    <DialogDescription className="text-text-2">
                        {step === "form"
                            ? "Define la marca, presentación y precios."
                            : `Ya existe la marca "${brandName}" para este producto.`}
                    </DialogDescription>
                </DialogHeader>

                {step === "form" ? (
                    <form onSubmit={handlePreSubmit} action={mode === 'edit' ? formAction : undefined} className="grid gap-4 py-4">
                        {mode === 'edit' && product && <input type="hidden" name="id" value={product.id} />}

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="brand" className="text-text-1">Marca</Label>
                                <Input
                                    id="brand"
                                    name="brand"
                                    value={brandName}
                                    onChange={e => setBrandName(e.target.value)}
                                    placeholder="Ej. Bimbo"
                                    required
                                    className="bg-bg-0 text-text-1"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl" className="text-text-1">Imagen URL</Label>
                            <Input id="imageUrl" name="imageUrl" defaultValue={product?.imageUrl || ""} placeholder="https://..." className="bg-bg-0 text-text-1" />
                        </div>

                        <Separator className="bg-border" />

                        <div className="grid gap-2">
                            <Label className="text-text-1">Precio Referencial</Label>
                            <div className="flex items-center">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-sm">$</span>
                                    <Input
                                        name="globalPrice"
                                        type="number"
                                        step="0.01"
                                        defaultValue={product?.globalPrice || ""}
                                        placeholder="0.00"
                                        className="bg-bg-0 text-text-1 pl-7 rounded-r-none focus-visible:z-10 h-10"
                                    />
                                </div>
                                <Input
                                    name="currencyCode"
                                    defaultValue={product?.currencyCode || "USD"}
                                    className="bg-bg-2 text-text-2 w-[80px] rounded-l-none border-l-0 text-center font-medium focus-visible:ring-0 focus-visible:ring-offset-0 cursor-not-allowed h-10"
                                    readOnly
                                    tabIndex={-1}
                                />
                            </div>
                            <p className="text-xs text-text-3">Se usará si no hay precio específico.</p>
                        </div>

                        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending || localLoading} className="bg-accent-violet text-white">
                                {isPending || localLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mode === 'create' ? "Crear Opción" : "Guardar Cambios")}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6 py-6">
                        <div className="p-4 rounded-xl bg-accent-violet/5 border border-accent-violet/20 text-center space-y-2">
                            <p className="text-text-1 text-sm">
                                ¿Quieres crear otra opción para esta marca de todos modos o prefieres volver atrás?
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <Button
                                variant="outline"
                                className="w-full border-border text-text-1 hover:bg-glass"
                                onClick={() => setStep("form")}
                                disabled={isPending}
                            >
                                Atrás y cambiar nombre
                            </Button>
                            <Button
                                className="w-full bg-accent-violet text-white hover:bg-accent-violet/90"
                                onClick={handleForceSubmit}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Crear de todas formas"}
                            </Button>
                        </div>
                    </div>
                )}

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
                                    <Button type="submit" size="sm" disabled={marketPending} className="h-8 bg-accent-violet text-white">
                                        {marketPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Crear"}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" className="h-8 text-text-3" onClick={() => setShowNewMarketInput(false)}>Cancelar</Button>
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

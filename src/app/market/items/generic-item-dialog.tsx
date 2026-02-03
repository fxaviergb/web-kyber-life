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
import { useActionState } from "react";
import { createGenericItemAction, updateGenericItemAction } from "@/app/actions/product";
import { useEffect, useState } from "react";
import { GenericItem, Category } from "@/domain/entities";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface GenericItemDialogProps {
    mode: 'create' | 'edit';
    item?: GenericItem;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    categories: Category[];
}

export function GenericItemDialog({ mode, item, trigger, open: controlledOpen, onOpenChange, categories }: GenericItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const effectiveOpen = isControlled ? controlledOpen : open;
    const effectiveSetOpen = isControlled ? onOpenChange! : setOpen;

    const action = mode === 'create' ? createGenericItemAction : updateGenericItemAction;
    const [state, formAction, isPending] = useActionState(action, null);

    useEffect(() => {
        if (state?.success) {
            effectiveSetOpen(false);
        }
    }, [state, effectiveSetOpen]);

    const title = mode === 'create' ? "Nuevo Producto Genérico" : "Editar Producto";
    const description = mode === 'create'
        ? "Crea un producto base para reutilizar en tus listas."
        : "Modifica los datos del producto genérico.";

    return (
        <Dialog open={effectiveOpen} onOpenChange={effectiveSetOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="bg-bg-primary border-border-base sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-text-primary">{title}</DialogTitle>
                    <DialogDescription className="text-text-tertiary">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="grid gap-4 py-4">
                    {mode === 'edit' && item && (
                        <input type="hidden" name="id" value={item.id} />
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-text-secondary">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={item?.canonicalName}
                            className="bg-bg-secondary border-border-base text-text-primary focus-visible:ring-accent-primary"
                            placeholder="Ej. Pan lactal, Leche..."
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="primaryCategoryId" className="text-text-secondary">
                            Categoría Principal
                        </Label>
                        {(() => {
                            const defaultId = categories.find(c => c.name === "Sin categoría")?.id || "null";
                            const value = item?.primaryCategoryId || defaultId;
                            return (
                                <Select name="primaryCategoryId" defaultValue={value}>

                                    <SelectTrigger className="w-full bg-bg-secondary border-border-base text-text-primary focus:ring-accent-primary">
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-bg-primary border-border-base">

                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} {c.ownerUserId ? "(Personal)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            );
                        })()}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="imageUrl" className="text-text-secondary">
                            Imagen URL (Opcional)
                        </Label>
                        <Input
                            id="imageUrl"
                            name="imageUrl"
                            defaultValue={item?.imageUrl || ""}
                            className="bg-bg-secondary border-border-base text-text-primary focus-visible:ring-accent-primary"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="border-t border-border-base pt-4 space-y-2">
                        <Label className="text-text-secondary">Precio Global y Moneda</Label>
                        <div className="flex items-center">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                                <Input
                                    name="globalPrice"
                                    type="number"
                                    step="0.01"
                                    defaultValue={item?.globalPrice || ""}
                                    className="bg-bg-secondary border-border-base text-text-primary pl-7 rounded-r-none focus-visible:ring-accent-primary focus-visible:z-10 h-10"
                                    placeholder="0.00"
                                />
                            </div>
                            <Input
                                name="currencyCode"
                                defaultValue={item?.currencyCode || "USD"}
                                className="bg-bg-secondary text-text-tertiary w-[80px] rounded-l-none border-l-0 text-center font-medium focus-visible:ring-0 focus-visible:ring-offset-0 cursor-not-allowed h-10"
                                readOnly
                                tabIndex={-1}
                            />
                        </div>
                        <p className="text-xs text-text-tertiary">
                            Este precio se usará como referencia si no hay uno específico del súper.
                        </p>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-accent-primary hover:text-accent-primary/80 hover:bg-transparent px-0 font-medium h-auto"
                        >
                            {showDetails ? "- Ocultar detalles" : "+ Agregar más detalles"}
                        </Button>

                        {showDetails && (
                            <div className="grid gap-2 border-t border-border-base pt-4 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <Label className="text-text-secondary">Sinónimos / Alias</Label>
                                <p className="text-xs text-text-tertiary mb-2">
                                    Agrega nombres alternativos para encontrar este producto (ej. "Pan de molde").
                                </p>
                                <div className="space-y-2">
                                    {(item?.aliases || []).map((alias, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                name="aliases"
                                                defaultValue={alias}
                                                className="bg-bg-secondary border-border-base text-text-primary h-9 text-sm"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <Input
                                            name="aliases"
                                            placeholder="Nuevo alias..."
                                            className="bg-bg-secondary border-border-base text-text-primary h-9 text-sm focus-visible:ring-accent-primary"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            name="aliases"
                                            placeholder="Otro alias..."
                                            className="bg-bg-secondary border-border-base text-text-primary h-9 text-sm focus-visible:ring-accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {state?.error && (
                        <p className="text-sm text-accent-danger font-medium">{state.error}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'create' ? "Crear" : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

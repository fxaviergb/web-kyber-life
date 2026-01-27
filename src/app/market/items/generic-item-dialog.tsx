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
import { GenericItem, Category, Unit } from "@/domain/entities";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
            <DialogContent className="bg-bg-1 border-border sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-text-1">{title}</DialogTitle>
                    <DialogDescription className="text-text-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="grid gap-4 py-4">
                    {mode === 'edit' && item && (
                        <input type="hidden" name="id" value={item.id} />
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-text-1">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={item?.canonicalName}
                            className="bg-bg-0 border-input text-text-1 focus-visible:ring-accent-violet"
                            placeholder="Ej. Pan lactal, Leche..."
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="primaryCategoryId" className="text-text-1">
                            Categoría Principal
                        </Label>
                        <Select name="primaryCategoryId" defaultValue={item?.primaryCategoryId || "null"}>
                            <SelectTrigger className="bg-bg-0 border-input text-text-1 focus:ring-accent-violet">
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent className="bg-bg-1 border-border">
                                <SelectItem value="null">Sin Categoría</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} {c.ownerUserId ? "(Personal)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="imageUrl" className="text-text-1">
                            Imagen URL (Opcional)
                        </Label>
                        <Input
                            id="imageUrl"
                            name="imageUrl"
                            defaultValue={item?.imageUrl || ""}
                            className="bg-bg-0 border-input text-text-1 focus-visible:ring-accent-violet"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                        <div className="space-y-2">
                            <Label className="text-text-1">Precio Global (Referencial)</Label>
                            <Input
                                name="globalPrice"
                                type="number"
                                step="0.01"
                                defaultValue={item?.globalPrice || ""}
                                className="bg-bg-0 border-input text-text-1"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-text-1">Moneda</Label>
                            <Input
                                name="currencyCode"
                                defaultValue={item?.currencyCode || "USD"}
                                className="bg-bg-0 border-input text-text-1"
                                maxLength={3}
                            />
                        </div>
                        <p className="col-span-2 text-xs text-text-3">
                            Este precio se usará como referencia en tus compras si no hay un precio específico del supermercado.
                        </p>
                    </div>

                    {/* Aliases Section */}
                    {mode === 'edit' && (
                        <div className="grid gap-2 border-t border-border pt-4 mt-2">
                            <Label className="text-text-1">Sinónimos / Alias</Label>
                            <p className="text-xs text-text-3 mb-2">
                                Agrega nombres alternativos para encontrar este producto (ej. "Pan de molde").
                            </p>
                            <div className="space-y-2">
                                {item?.aliases.map((alias, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            name="aliases"
                                            defaultValue={alias}
                                            className="bg-bg-0 border-input text-text-1 h-8 text-sm"
                                        />
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <Input
                                        name="aliases"
                                        placeholder="Nuevo alias..."
                                        className="bg-bg-0 border-input text-text-1 h-8 text-sm focus-visible:ring-accent-violet"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        name="aliases"
                                        placeholder="Otro alias..."
                                        className="bg-bg-0 border-input text-text-1 h-8 text-sm focus-visible:ring-accent-violet"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tags / Secondary Categories intentionally skipped for MVP simplicity unless critical. 
                       Can be added later as a multi-select component. */}

                    {state?.error && (
                        <p className="text-sm text-destructive font-medium">{state.error}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-accent-violet text-white hover:bg-accent-violet/90"
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

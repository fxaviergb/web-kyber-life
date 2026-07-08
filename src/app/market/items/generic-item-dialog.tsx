"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormSheet, FormSheetForm, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
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
    initialName?: string;
    categories: Category[];
}

export function GenericItemDialog({ mode, item, trigger, open: controlledOpen, onOpenChange, categories, initialName }: GenericItemDialogProps) {
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
        <FormSheet
            open={effectiveOpen}
            onOpenChange={effectiveSetOpen}
            trigger={trigger}
            title={title}
            description={description}
            contentClassName="sm:max-w-[425px]"
        >
            <FormSheetForm action={formAction}>
                <FormSheetBody className="space-y-4">
                    {mode === 'edit' && item && (
                        <input type="hidden" name="id" value={item.id} />
                    )}

                    <Field label="Nombre" htmlFor="name" required>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={item?.canonicalName || initialName || ""}
                            placeholder="Ej. Pan lactal, Leche..."
                            required
                        />
                    </Field>

                    <Field label="Categoría Principal" htmlFor="primaryCategoryId">
                        {(() => {
                            const defaultId = categories.find(c => c.name === "Sin categoría")?.id || "null";
                            const value = item?.primaryCategoryId || defaultId;
                            return (
                                <Select name="primaryCategoryId" defaultValue={value}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} {c.ownerUserId ? "(Personal)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            );
                        })()}
                    </Field>

                    <Field label="Imagen URL" htmlFor="imageUrl" optional>
                        <Input
                            id="imageUrl"
                            name="imageUrl"
                            defaultValue={item?.imageUrl || ""}
                            placeholder="https://..."
                        />
                    </Field>

                    <Field
                        label="Precio Global y Moneda"
                        className="border-t border-border-base pt-4"
                        hint="Este precio se usará como referencia si no hay uno específico del súper."
                    >
                        <div className="flex items-center">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                                <Input
                                    name="globalPrice"
                                    type="number"
                                    step="0.01"
                                    defaultValue={item?.globalPrice || ""}
                                    className="pl-7 rounded-r-none focus-visible:z-10"
                                    placeholder="0.00"
                                />
                            </div>
                            <Input
                                name="currencyCode"
                                defaultValue={item?.currencyCode || "USD"}
                                className="w-[80px] rounded-l-none border-l-0 text-center font-medium text-text-tertiary focus-visible:ring-0 focus-visible:ring-offset-0 cursor-not-allowed"
                                readOnly
                                tabIndex={-1}
                            />
                        </div>
                    </Field>

                    <div>
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
                                    Agrega nombres alternativos para encontrar este producto (ej. &quot;Pan de molde&quot;).
                                </p>
                                <div className="space-y-2">
                                    {(item?.aliases || []).map((alias, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input name="aliases" defaultValue={alias} className="h-9 text-sm" />
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <Input name="aliases" placeholder="Nuevo alias..." className="h-9 text-sm" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input name="aliases" placeholder="Otro alias..." className="h-9 text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {state?.error && (
                        <p className="text-sm text-accent-danger font-medium">{state.error}</p>
                    )}
                </FormSheetBody>

                <FormSheetFooter>
                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'create' ? "Crear" : "Guardar Cambios"}
                    </Button>
                </FormSheetFooter>
            </FormSheetForm>
        </FormSheet>
    );
}

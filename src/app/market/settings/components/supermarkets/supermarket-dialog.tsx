"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSheet, FormSheetForm, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
import { useActionState } from "react";
import { createSupermarketAction, updateSupermarketAction } from "@/app/actions/master-data";
import { useEffect, useState } from "react";
import { Supermarket } from "@/domain/entities";
import { Loader2 } from "lucide-react";

interface SupermarketDialogProps {
    mode: 'create' | 'edit';
    supermarket?: Supermarket;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function SupermarketDialog({ mode, supermarket, trigger, open: controlledOpen, onOpenChange }: SupermarketDialogProps) {
    const [open, setOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const effectiveOpen = isControlled ? controlledOpen : open;
    const effectiveSetOpen = isControlled ? onOpenChange! : setOpen;

    const action = mode === 'create' ? createSupermarketAction : updateSupermarketAction.bind(null, supermarket?.id || "");
    const [state, formAction, isPending] = useActionState(action, null);

    useEffect(() => {
        if (state?.success) {
            effectiveSetOpen(false);
        }
    }, [state, effectiveSetOpen]);

    return (
        <FormSheet
            open={effectiveOpen}
            onOpenChange={effectiveSetOpen}
            trigger={trigger}
            title={mode === 'create' ? 'Nuevo Supermercado' : 'Editar Supermercado'}
            description={mode === 'create' ? 'Agrega un nuevo lugar para tus compras.' : 'Modifica los datos del supermercado.'}
            contentClassName="sm:max-w-[425px]"
        >
            <FormSheetForm action={formAction}>
                <FormSheetBody className="space-y-4">
                    {mode === 'edit' && <input type="hidden" name="id" value={supermarket?.id} />}

                    <Field label="Nombre" htmlFor="name" required>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ej: Walmart, Tienda Local..."
                            defaultValue={supermarket?.name}
                            required
                        />
                    </Field>

                    <Field label="Dirección" htmlFor="address" optional>
                        <Input
                            id="address"
                            name="address"
                            placeholder="Ej: Av. Principal 123"
                            defaultValue={supermarket?.address || ""}
                        />
                    </Field>

                    {state?.error && (
                        <p className="text-sm text-accent-danger font-medium">{state.error}</p>
                    )}
                </FormSheetBody>

                <FormSheetFooter>
                    <Button
                        type="submit"
                        className="w-full bg-accent-violet hover:bg-accent-violet/90 text-white"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Guardar"}
                    </Button>
                </FormSheetFooter>
            </FormSheetForm>
        </FormSheet>
    );
}

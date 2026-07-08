"use client";

import { Input } from "@/components/ui/input";
import { FormSheet, FormSheetForm, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
import { useActionState } from "react";
import { createUnitAction, updateUnitAction } from "@/app/actions/master-data";
import { useEffect, useState } from "react";
import { Unit } from "@/domain/entities";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnitDialogProps {
    mode: 'create' | 'edit';
    unit?: Unit;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function UnitDialog({ mode, unit, trigger, open: controlledOpen, onOpenChange }: UnitDialogProps) {
    const [open, setOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const effectiveOpen = isControlled ? controlledOpen : open;
    const effectiveSetOpen = isControlled ? onOpenChange! : setOpen;

    const action = mode === 'create' ? createUnitAction : updateUnitAction;
    const [state, formAction, isPending] = useActionState(action, null);

    useEffect(() => {
        if (state?.success) {
            effectiveSetOpen(false);
        }
    }, [state, effectiveSetOpen]);

    const title = mode === 'create' ? "Nueva Unidad" : "Editar Unidad";
    const description = mode === 'create'
        ? "Agrega una nueva unidad de medida personalizada."
        : "Modifica tu unidad personalizada.";

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
                    {mode === 'edit' && unit && (
                        <input type="hidden" name="id" value={unit.id} />
                    )}

                    <Field label="Nombre" htmlFor="name" required>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={unit?.name}
                            placeholder="Ej. Paquete, Botella..."
                            required
                        />
                    </Field>

                    <Field label="Símbolo" htmlFor="symbol" optional>
                        <Input
                            id="symbol"
                            name="symbol"
                            defaultValue={unit?.symbol || ""}
                            placeholder="Ej. pk, bt..."
                        />
                    </Field>

                    {state?.error && (
                        <p className="text-sm text-accent-danger font-medium">{state.error}</p>
                    )}
                </FormSheetBody>

                <FormSheetFooter>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-accent-violet text-white hover:bg-accent-violet/90"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'create' ? "Crear" : "Guardar Cambios"}
                    </Button>
                </FormSheetFooter>
            </FormSheetForm>
        </FormSheet>
    );
}

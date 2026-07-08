"use client";

import { Input } from "@/components/ui/input";
import { FormSheet, FormSheetForm, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
import { useActionState } from "react";
import { createCategoryAction, updateCategoryAction } from "@/app/actions/master-data";
import { useEffect, useState } from "react";
import { Category } from "@/domain/entities";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryDialogProps {
    mode: 'create' | 'edit';
    category?: Category;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CategoryDialog({ mode, category, trigger, open: controlledOpen, onOpenChange }: CategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const effectiveOpen = isControlled ? controlledOpen : open;
    const effectiveSetOpen = isControlled ? onOpenChange! : setOpen;

    const action = mode === 'create' ? createCategoryAction : updateCategoryAction;
    const [state, formAction, isPending] = useActionState(action, null);

    useEffect(() => {
        if (state?.success) {
            effectiveSetOpen(false);
        }
    }, [state, effectiveSetOpen]);

    const title = mode === 'create' ? "Nueva Categoría" : "Editar Categoría";
    const description = mode === 'create'
        ? "Agrega una nueva categoría para organizar tus productos."
        : "Modifica el nombre de tu categoría personal.";

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
                <FormSheetBody>
                    {mode === 'edit' && category && (
                        <input type="hidden" name="id" value={category.id} />
                    )}

                    <Field label="Nombre" htmlFor="name" required>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={category?.name}
                            placeholder="Ej. Lácteos, Limpieza..."
                            required
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

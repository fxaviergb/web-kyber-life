"use client";

import { createTemplateAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSheet, FormSheetForm, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
import { Plus, Tag as TagIcon, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

export function CreateTemplateDialog() {
    const [state, formAction, isPending] = useActionState(createTemplateAction, null);
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            setOpen(false);
        }
    }, [state]);

    return (
        <FormSheet
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white font-medium shadow-lg shadow-accent-violet/20 hover:shadow-accent-violet/30 transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Plantilla
                </Button>
            }
            title="Crear Nueva Plantilla"
            description="Define un nombre para tu lista recurrente para agilizar tus compras futuras."
            contentClassName="sm:max-w-[500px]"
        >
            <FormSheetForm ref={formRef} action={formAction}>
                <FormSheetBody className="space-y-6">
                    <Field label="Nombre de la Plantilla" htmlFor="name" required>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ej. Supermercado Semanal"
                            className="h-11"
                            required
                        />
                    </Field>

                    <Field
                        label="Etiquetas"
                        htmlFor="tags"
                        optional
                        hint="Separa las etiquetas usando comas."
                    >
                        <div className="relative">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <Input
                                id="tags"
                                name="tags"
                                placeholder="casa, comida, mensual..."
                                className="pl-10 h-11"
                            />
                        </div>
                    </Field>

                    {state?.error && (
                        <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-sm">
                            {state.error}
                        </div>
                    )}
                </FormSheetBody>

                <FormSheetFooter className="sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                        className="w-full sm:w-auto text-text-secondary hover:text-text-primary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full sm:w-auto bg-accent-violet hover:bg-accent-violet/90 text-white min-w-[140px]"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Crear Plantilla
                            </>
                        )}
                    </Button>
                </FormSheetFooter>
            </FormSheetForm>
        </FormSheet>
    );
}

"use client";

import { updateTemplateAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogDescription,
    ResponsiveDialogTrigger,
    ResponsiveDialogFooter
} from "@/components/ui/responsive-dialog";
import { Label } from "@/components/ui/label";
import { Edit, Tag as TagIcon, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

interface EditTemplateDialogProps {
    template: {
        id: string;
        name: string;
        tags: string[];
    };
    trigger?: React.ReactNode;
}

export function EditTemplateDialog({ template, trigger }: EditTemplateDialogProps) {
    const [state, formAction, isPending] = useActionState(
        updateTemplateAction.bind(null, template.id),
        null
    );
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            setOpen(false);
        }
    }, [state]);

    return (
        <ResponsiveDialog open={open} onOpenChange={setOpen}>
            <ResponsiveDialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-3 hover:text-accent-violet">
                        <Edit className="w-4 h-4" />
                    </Button>
                )}
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent
                className="bg-bg-1 border-border text-text-1 sm:max-w-[500px]"
                onClick={(e) => e.stopPropagation()}
            >
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle className="text-xl font-bold text-text-1">Editar Plantilla</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription className="text-text-2">
                        Modifica el nombre o las etiquetas de tu plantilla.
                    </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>

                <form
                    ref={formRef}
                    action={formAction}
                    className="space-y-6 py-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-text-1 font-medium">Nombre de la Plantilla</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={template.name}
                            placeholder="Ej. Supermercado Semanal"
                            className="bg-bg-2 border-border text-text-1 h-11"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags" className="text-text-1 font-medium">
                            Etiquetas <span className="text-text-3 font-normal text-xs ml-1">(Opcional)</span>
                        </Label>
                        <div className="relative">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                            <Input
                                id="tags"
                                name="tags"
                                defaultValue={template.tags.join(", ")}
                                placeholder="casa, comida, mensual..."
                                className="bg-bg-2 border-border text-text-1 pl-10 h-11"
                            />
                        </div>
                        <p className="text-[11px] text-text-3 pl-1">Separa las etiquetas usando comas.</p>
                    </div>

                    {state?.error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {state.error}
                        </div>
                    )}

                    <ResponsiveDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                            className="w-full sm:w-auto text-text-2 hover:text-text-1 hover:bg-bg-2"
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
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </ResponsiveDialogFooter>
                </form>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}

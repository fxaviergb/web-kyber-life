"use client";

import { createTemplateAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Plantilla
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-bg-1 border-border text-text-1">
                <DialogHeader>
                    <DialogTitle className="text-text-1">Crear Nueva Plantilla</DialogTitle>
                </DialogHeader>
                <form ref={formRef} action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-text-2">Nombre de la Plantilla</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ej. Compras mensuales - Casa"
                            className="bg-bg-2 border-border text-text-1"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tags" className="text-text-2">Etiquetas (opcional)</Label>
                        <div className="relative">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                            <Input
                                id="tags"
                                name="tags"
                                placeholder="Comida, aseo, casa (separadas por coma)"
                                className="bg-bg-2 border-border text-text-1 pl-9"
                            />
                        </div>
                        <p className="text-xs text-text-3">Separa las etiquetas con comas</p>
                    </div>
                    {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-accent-violet hover:bg-accent-violet/90 text-white"
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
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

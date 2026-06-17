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
                    {mode === 'edit' && unit && (
                        <input type="hidden" name="id" value={unit.id} />
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-text-1">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={unit?.name}
                            className="bg-bg-0 border-input text-text-1 focus-visible:ring-accent-violet"
                            placeholder="Ej. Paquete, Botella..."
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="symbol" className="text-text-1">
                            Símbolo (Opcional)
                        </Label>
                        <Input
                            id="symbol"
                            name="symbol"
                            defaultValue={unit?.symbol || ""}
                            className="bg-bg-0 border-input text-text-1 focus-visible:ring-accent-violet"
                            placeholder="Ej. pk, bt..."
                        />
                    </div>

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

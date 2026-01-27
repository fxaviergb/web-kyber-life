"use client";

import { Button } from "@/components/ui/button";
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
import { createSupermarketAction, updateSupermarketAction } from "@/app/actions/master-data";
import { useEffect, useState } from "react";
import { Supermarket } from "@/domain/entities";
import { Loader2, Plus, Edit } from "lucide-react";

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

    const action = mode === 'create' ? createSupermarketAction : updateSupermarketAction;
    const [state, formAction, isPending] = useActionState(action, null);

    useEffect(() => {
        if (state?.success) {
            effectiveSetOpen(false);
        }
    }, [state, effectiveSetOpen]);

    return (
        <Dialog open={effectiveOpen} onOpenChange={effectiveSetOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="bg-bg-1 border-border sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-text-1">{mode === 'create' ? 'Nuevo Supermercado' : 'Editar Supermercado'}</DialogTitle>
                    <DialogDescription className="text-text-2">
                        {mode === 'create' ? 'Agrega un nuevo lugar para tus compras.' : 'Modifica los datos del supermercado.'}
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <div className="grid gap-4 py-4">
                        {mode === 'edit' && <input type="hidden" name="id" value={supermarket?.id} />}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-text-1">Nombre *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Walmart, Tienda Local..."
                                defaultValue={supermarket?.name}
                                className="bg-bg-2 border-input focus:border-accent-violet"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-text-1">Dirección (Opcional)</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="Ej: Av. Principal 123"
                                defaultValue={supermarket?.address || ""}
                                className="bg-bg-2 border-input focus:border-accent-violet"
                            />
                        </div>
                        {state?.error && (
                            <p className="text-sm text-destructive font-medium">{state.error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            className="bg-accent-violet hover:bg-accent-violet/90 text-white w-full sm:w-auto"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
import { useActionState, useEffect, useState } from "react";
import { createBrandProductAction } from "@/app/actions/product";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CreateBrandProductModalProps {
    genericItemId: string;
    genericItemName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateBrandProductModal({
    genericItemId,
    genericItemName,
    open,
    onOpenChange
}: CreateBrandProductModalProps) {
    // Action Binding
    const action = createBrandProductAction.bind(null, genericItemId);
    const [state, formAction, isPending] = useActionState(action, null);

    useEffect(() => {
        if (state?.success) {
            onOpenChange(false);
        }
    }, [state, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-bg-1 border-border sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-text-1">Nueva Opción para {genericItemName}</DialogTitle>
                    <DialogDescription className="text-text-2">
                        Si no encontraste la marca o presentación, créala aquí.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="brand" className="text-text-1">Marca</Label>
                            <Input id="brand" name="brand" placeholder="Ej. Bimbo" required className="bg-bg-0 text-text-1" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="presentation" className="text-text-1">Presentación</Label>
                            <Input id="presentation" name="presentation" placeholder="Ej. 600g" required className="bg-bg-0 text-text-1" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="imageUrl" className="text-text-1">Imagen URL (Opcional)</Label>
                        <Input id="imageUrl" name="imageUrl" placeholder="https://..." className="bg-bg-0 text-text-1" />
                    </div>

                    <Separator className="bg-border" />

                    <div className="grid gap-2">
                        <Label className="text-text-1">Precio Referencial (Opcional)</Label>
                        <div className="flex gap-2">
                            <Input
                                name="globalPrice"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="bg-bg-0 text-text-1 flex-1"
                            />
                            <Input
                                name="currencyCode"
                                defaultValue="USD"
                                className="bg-bg-0 text-text-1 w-20"
                                readOnly
                            />
                        </div>
                    </div>

                    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending} className="bg-accent-violet text-white">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Opción
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { deleteBrandProductAction } from "@/app/actions/product";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useTransition, useState } from "react";

export function DeleteBrandProductIconButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            await deleteBrandProductAction(id);
            setOpen(false);
        });
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-destructive/10 text-destructive"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </Button>

            <ConfirmationModal
                open={open}
                onOpenChange={setOpen}
                title="¿Eliminar variante de marca?"
                description="Se eliminará esta opción y su historial de precios asociado."
                confirmText="Eliminar"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isPending}
            />
        </>
    );
}

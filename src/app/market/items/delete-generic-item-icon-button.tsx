"use client";

import { deleteGenericItemAction } from "@/app/actions/product";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useTransition, useState } from "react";

export function DeleteGenericItemIconButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            await deleteGenericItemAction(id);
            setShowConfirm(false);
        });
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 bg-destructive/80 hover:bg-destructive text-white backdrop-blur-sm rounded-full"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirm(true);
                }}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </Button>

            <ConfirmationModal
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="¿Eliminar producto genérico?"
                description="Esto eliminará el producto de tu lista de disponbiles para nuevas plantillas/compras."
                confirmText="Eliminar"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isPending}
            />
        </>
    );
}

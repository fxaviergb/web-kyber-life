"use client";

import { deleteGenericItemAction } from "@/app/actions/product";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { useTransition, useState } from "react";

export function DeleteGenericItemButton({ id }: { id: string }) {
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
            <DropdownMenuItem
                onSelect={(e) => {
                    e.preventDefault();
                    setShowConfirm(true);
                }}
                className="text-destructive hover:bg-destructive/10 cursor-pointer focus:text-destructive focus:bg-destructive/10"
                disabled={isPending}
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
            </DropdownMenuItem>

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

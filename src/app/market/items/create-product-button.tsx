"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GenericItemDialog } from "./generic-item-dialog";
import { Category } from "@/domain/entities";
import { useState } from "react";

interface CreateProductButtonProps {
    categories: Category[];
}

export function CreateProductButton({ categories }: CreateProductButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
            </Button>
            <GenericItemDialog
                mode="create"
                categories={categories}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}

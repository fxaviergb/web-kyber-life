"use client";

import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { GenericItemDialog } from "./generic-item-dialog";
import { Category, GenericItem } from "@/domain/entities";
import { useState } from "react";

interface EditProductButtonProps {
    item: GenericItem;
    categories: Category[];
    variant?: "ghost" | "default" | "outline";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function EditProductButton({ item, categories, variant = "ghost", size = "icon", className }: EditProductButtonProps) {
    const [open, setOpen] = useState(false);
    const isIconOnly = size === "icon";

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                <Edit className={isIconOnly ? "w-3 h-3" : "w-4 h-4 mr-2"} />
                {!isIconOnly && "Editar"}
            </Button>
            <GenericItemDialog
                mode="edit"
                item={item}
                categories={categories}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}

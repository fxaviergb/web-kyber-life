"use client";

import { GenericItemDialog } from "./generic-item-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit } from "lucide-react";
import { GenericItem, Category } from "@/domain/entities";

interface EditGenericItemButtonProps {
    item: GenericItem;
    categories: Category[];
}

export function EditGenericItemButton({ item, categories }: EditGenericItemButtonProps) {
    return (
        <GenericItemDialog
            mode="edit"
            item={item}
            categories={categories}
            trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-text-1 hover:bg-bg-3 cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
            }
        />
    );
}

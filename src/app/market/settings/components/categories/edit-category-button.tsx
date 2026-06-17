"use client";

import { CategoryDialog } from "./category-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit } from "lucide-react";
import { Category } from "@/domain/entities";

interface EditCategoryButtonProps {
    category: Category;
}

export function EditCategoryButton({ category }: EditCategoryButtonProps) {
    return (
        <CategoryDialog
            mode="edit"
            category={category}
            trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-text-1 hover:bg-bg-3 cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
            }
        />
    );
}

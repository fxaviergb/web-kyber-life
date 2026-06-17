"use client";

import { SupermarketDialog } from "./supermarket-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit } from "lucide-react";
import { Supermarket } from "@/domain/entities";

interface EditSupermarketButtonProps {
    supermarket: Supermarket;
}

export function EditSupermarketButton({ supermarket }: EditSupermarketButtonProps) {
    return (
        <SupermarketDialog
            mode="edit"
            supermarket={supermarket}
            trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-text-1 hover:bg-bg-3 cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
            }
        />
    );
}

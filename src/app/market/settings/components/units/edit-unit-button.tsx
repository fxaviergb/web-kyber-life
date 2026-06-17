"use client";

import { UnitDialog } from "./unit-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit } from "lucide-react";
import { Unit } from "@/domain/entities";

interface EditUnitButtonProps {
    unit: Unit;
}

export function EditUnitButton({ unit }: EditUnitButtonProps) {
    return (
        <UnitDialog
            mode="edit"
            unit={unit}
            trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-text-1 hover:bg-bg-3 cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
            }
        />
    );
}

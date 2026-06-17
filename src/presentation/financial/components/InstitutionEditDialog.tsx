"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import type { FinancialInstitution, FinancialInstitutionType } from "@/domain/entities/financial";

export interface PendingInstitutionEdit {
    id: string;
    name: string;
    institutionTypeId: string | null;
    description: string | null;
}

interface InstitutionEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The institution being edited (with any pending edit already applied). */
    institution: FinancialInstitution | null;
    types: FinancialInstitutionType[];
    /** Stage the edit. Persistence is deferred to the parent's save flow. */
    onApply: (edit: PendingInstitutionEdit) => void;
}

// Radix Select cannot use an empty-string value, so use a sentinel for "none".
const NONE_TYPE = "__none__";

/**
 * Lightweight, deferred editor for an existing institution. It only stages the
 * changes (name / type / description) via `onApply`; the parent transaction form
 * persists them when the transaction itself is saved or confirmed.
 *
 * The inner form is keyed and gated on `open` so it mounts fresh each time the
 * dialog opens — initializing its fields from the institution without effects.
 */
export function InstitutionEditDialog({ open, onOpenChange, institution, types, onApply }: InstitutionEditDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        Editar institución
                    </DialogTitle>
                    <DialogDescription>
                        Corrige el nombre, el tipo o la descripción. Los cambios se guardarán al confirmar o guardar la transacción.
                    </DialogDescription>
                </DialogHeader>
                {open && institution && (
                    <InstitutionEditForm
                        key={institution.id}
                        institution={institution}
                        types={types}
                        onApply={onApply}
                        onClose={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function InstitutionEditForm({
    institution,
    types,
    onApply,
    onClose,
}: {
    institution: FinancialInstitution;
    types: FinancialInstitutionType[];
    onApply: (edit: PendingInstitutionEdit) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState(institution.name ?? "");
    const [institutionTypeId, setInstitutionTypeId] = useState<string>(institution.institutionTypeId ?? NONE_TYPE);
    const [description, setDescription] = useState(institution.description ?? "");

    const handleApply = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onApply({
            id: institution.id!,
            name: trimmed,
            institutionTypeId: institutionTypeId === NONE_TYPE ? null : institutionTypeId,
            description: description.trim() ? description.trim() : null,
        });
        onClose();
    };

    return (
        <>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="inst-edit-name">Nombre</Label>
                    <Input
                        id="inst-edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Banco Pichincha"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Tipo de institución</Label>
                    <Select value={institutionTypeId} onValueChange={setInstitutionTypeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE_TYPE}>Sin clasificar</SelectItem>
                            {types.map((t) => (
                                <SelectItem key={t.id} value={t.id!}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="inst-edit-desc">Descripción (opcional)</Label>
                    <Textarea
                        id="inst-edit-desc"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Notas sobre esta institución..."
                    />
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleApply} disabled={!name.trim()}>Aplicar</Button>
            </DialogFooter>
        </>
    );
}

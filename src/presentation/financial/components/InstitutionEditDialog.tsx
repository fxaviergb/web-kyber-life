"use client";

import { useState } from "react";
import { FormSheet, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
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
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            title={
                <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Editar institución
                </span>
            }
            description="Corrige el nombre, el tipo o la descripción. Los cambios se guardarán al confirmar o guardar la transacción."
        >
            {open && institution && (
                <InstitutionEditForm
                    key={institution.id}
                    institution={institution}
                    types={types}
                    onApply={onApply}
                    onClose={() => onOpenChange(false)}
                />
            )}
        </FormSheet>
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
            <FormSheetBody className="space-y-4 py-2">
                <Field label="Nombre" htmlFor="inst-edit-name">
                    <Input
                        id="inst-edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Banco Pichincha"
                    />
                </Field>

                <Field label="Tipo de institución">
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
                </Field>

                <Field label="Descripción" htmlFor="inst-edit-desc" optional>
                    <Textarea
                        id="inst-edit-desc"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Notas sobre esta institución..."
                    />
                </Field>
            </FormSheetBody>

            <FormSheetFooter className="sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleApply} disabled={!name.trim()}>Aplicar</Button>
            </FormSheetFooter>
        </>
    );
}

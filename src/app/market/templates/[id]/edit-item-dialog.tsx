"use client";

import { useActionState, useState, useEffect } from "react";
import { updateTemplateItemAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSheet, FormSheetForm, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit2, Loader2 } from "lucide-react";
import { Unit } from "@/domain/entities";

interface EditTemplateItemDialogProps {
    templateId: string;
    item: {
        id: string;
        genericName: string;
        defaultQty: number | null;
        defaultUnitId: string | null;
        genericItemId?: string;
        globalPrice?: number | null;
        currencyCode?: string;
    };
    units: Unit[];
}

export function EditTemplateItemDialog({ templateId, item, units }: EditTemplateItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(
        updateTemplateItemAction.bind(null, templateId, item.id),
        null
    );

    useEffect(() => {
        if (state?.success) {
            setOpen(false);
        }
    }, [state]);

    return (
        <FormSheet
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button variant="ghost" size="icon" className="text-text-tertiary hover:text-accent-violet h-8 w-8">
                    <Edit2 className="w-4 h-4" />
                </Button>
            }
            title="Editar Valores por Defecto"
            description={<>Configura la cantidad y unidad sugerida para <strong>{item.genericName}</strong>.</>}
            contentClassName="sm:max-w-[425px]"
        >
            <FormSheetForm action={formAction}>
                <FormSheetBody>
                    {/* Hidden inputs to pass required data */}
                    {item.genericItemId && <input type="hidden" name="genericItemId" value={item.genericItemId} />}
                    <input type="hidden" name="currencyCode" value={item.currencyCode || "USD"} />

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Cant. Sugerida">
                            <Input
                                name="defaultQty"
                                type="number"
                                step="0.01"
                                defaultValue={item.defaultQty || ""}
                            />
                        </Field>
                        <Field label="Unidad">
                            <Select name="defaultUnitId" defaultValue={item.defaultUnitId || units.find(u => u.symbol?.toLowerCase() === "und" || u.name.toLowerCase() === "unidad")?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ninguna</SelectItem>
                                    {units.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field
                            label="Precio Referencial"
                            className="col-span-2 border-t border-border-base pt-4 mt-2"
                            labelAside="Actualiza producto en todo el sistema"
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary font-semibold">$</span>
                                <Input
                                    name="globalPrice"
                                    type="number"
                                    step="0.01"
                                    defaultValue={item.globalPrice || ""}
                                    className="pl-7"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">{item.currencyCode || "USD"}</span>
                            </div>
                        </Field>
                    </div>

                    {state?.error && <p className="text-accent-danger text-xs">{state.error}</p>}
                </FormSheetBody>

                <FormSheetFooter>
                    <Button type="submit" disabled={isPending} className="w-full bg-accent-violet text-white">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Guardar Cambios"}
                    </Button>
                </FormSheetFooter>
            </FormSheetForm>
        </FormSheet>
    );
}

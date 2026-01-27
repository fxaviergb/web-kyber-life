"use client";

import { useActionState, useState, useEffect } from "react";
import { updateTemplateItemAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-text-3 hover:text-accent-violet h-8 w-8">
                    <Edit2 className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-bg-1 border-border sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-text-1">Editar Valores por Defecto</DialogTitle>
                    <DialogDescription className="text-text-2">
                        Configura la cantidad y unidad sugerida para <strong>{item.genericName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="space-y-4 py-4">
                    {/* Hidden inputs to pass required data */}
                    {item.genericItemId && <input type="hidden" name="genericItemId" value={item.genericItemId} />}
                    <input type="hidden" name="currencyCode" value={item.currencyCode || "USD"} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-text-2">Cant. Sugerida</Label>
                            <Input
                                name="defaultQty"
                                type="number"
                                step="0.01"
                                defaultValue={item.defaultQty || ""}
                                className="bg-bg-2 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-text-2">Unidad</Label>
                            <Select name="defaultUnitId" defaultValue={item.defaultUnitId || undefined}>
                                <SelectTrigger className="bg-bg-2 border-border">
                                    <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ninguna</SelectItem>
                                    {units.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Global Price Input */}
                        <div className="space-y-2 col-span-2 border-t border-border pt-4 mt-2">
                            <Label className="text-text-2 flex justify-between">
                                <span>Precio Referencial Global</span>
                                <span className="text-xs text-text-3">Actualiza producto en todo el sistema</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 font-semibold">$</span>
                                <Input
                                    name="globalPrice"
                                    type="number"
                                    step="0.01"
                                    defaultValue={item.globalPrice || ""}
                                    className="pl-7 bg-bg-2 border-border"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 text-xs">{item.currencyCode || "USD"}</span>
                            </div>
                        </div>
                    </div>

                    {state?.error && <p className="text-destructive text-xs">{state.error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className="w-full bg-accent-violet">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

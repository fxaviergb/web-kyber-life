"use client";

import { useActionState, useState, useEffect } from "react";
import { addTemplateItemAction } from "@/app/actions/template";
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
import { Plus, Search, Loader2 } from "lucide-react";
import { GenericItem, Unit } from "@/domain/entities";

interface AddItemDialogProps {
    templateId: string;
    genericItems: GenericItem[];
    units: Unit[];
    existingItemIds: string[];
}

export function AddItemDialog({ templateId, genericItems, units, existingItemIds }: AddItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [state, formAction, isPending] = useActionState(addTemplateItemAction.bind(null, templateId), null);

    useEffect(() => {
        if (state?.success) {
            setOpen(false);
            setSelectedItemId(null);
            setSearch("");
        }
    }, [state]);

    const filteredItems = genericItems
        .filter(item => !existingItemIds.includes(item.id))
        .filter(item =>
            item.canonicalName.toLowerCase().includes(search.toLowerCase()) ||
            item.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
        ).slice(0, 10);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Añadir Producto
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-bg-1 border-border sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-text-1">Añadir Producto a Plantilla</DialogTitle>
                    <DialogDescription className="text-text-2">
                        Busca un producto y configura sus valores por defecto.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!selectedItemId ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                                <Input
                                    placeholder="Buscar producto (ej. Leche)..."
                                    className="pl-9 bg-bg-2 border-border"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {filteredItems.map(item => (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        className="w-full justify-start text-text-1 hover:bg-bg-2"
                                        onClick={() => setSelectedItemId(item.id)}
                                    >
                                        {item.canonicalName}
                                    </Button>
                                ))}
                                {search && filteredItems.length === 0 && (
                                    <p className="text-center py-4 text-sm text-text-3">No hay resultados</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form action={formAction} className="space-y-4">
                            <input type="hidden" name="genericItemId" value={selectedItemId} />

                            <div className="p-3 bg-bg-2 rounded-lg border border-border flex justify-between items-center">
                                <span className="font-medium text-text-1">
                                    {genericItems.find(i => i.id === selectedItemId)?.canonicalName}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedItemId(null)} className="h-7 text-xs">Cambiar</Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-text-2">Cant. Sugerida</Label>
                                    <Input name="defaultQty" type="number" step="0.01" placeholder="1" className="bg-bg-2 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-text-2">Unidad</Label>
                                    <Select name="defaultUnitId">
                                        <SelectTrigger className="bg-bg-2 border-border">
                                            <SelectValue placeholder="Unidad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {state?.error && <p className="text-destructive text-xs">{state.error}</p>}

                            <DialogFooter>
                                <Button type="submit" disabled={isPending} className="w-full bg-accent-violet">
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Agregar a Plantilla
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

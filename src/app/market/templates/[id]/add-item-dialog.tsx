"use client";

import { useActionState, useState, useEffect } from "react";
import { addTemplateItemAction } from "@/app/actions/template";
import { createGenericItemAction } from "@/app/actions/product";
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
import { GenericItem, Unit, Category } from "@/domain/entities";

interface AddItemDialogProps {
    templateId: string;
    genericItems: GenericItem[];
    units: Unit[];
    categories: Category[];
    existingItemIds: string[];
    initialSearch?: string;
    trigger?: React.ReactNode;
}

export function AddItemDialog({ templateId, genericItems, units, categories, existingItemIds, initialSearch, trigger }: AddItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"search" | "create" | "configure">("search");

    // Search State
    const [search, setSearch] = useState(initialSearch || "");
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    // Create State
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newCategoryId, setNewCategoryId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isAddingMultiple, setIsAddingMultiple] = useState(false);

    // Filter Items
    const filteredItems = genericItems
        .filter(item => !existingItemIds.includes(item.id))
        .filter(item =>
            item.canonicalName.toLowerCase().includes(search.toLowerCase()) ||
            item.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
        ).slice(0, 10);

    // Form Action for Adding to Template
    const [state, formAction, isPending] = useActionState(addTemplateItemAction.bind(null, templateId), null);

    // Reset when closed
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep("search");
                setSearch("");
                setSelectedItemId(null);
                setSelectedItemIds([]);
                setNewName("");
                setNewPrice("");
                setNewCategoryId("");
            }, 300);
        }
    }, [open]);

    // Handle Add Success
    useEffect(() => {
        if (state?.success) {
            setOpen(false);
        }
    }, [state]);

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAddMultiple = async () => {
        if (selectedItemIds.length === 0) return;
        setIsAddingMultiple(true);
        try {
            const { addMultipleTemplateItemsAction } = await import("@/app/actions/template");
            const result = await addMultipleTemplateItemsAction(templateId, selectedItemIds);
            if (result?.success) {
                setOpen(false);
            } else {
                alert("Error añadiendo productos");
            }
        } catch (error) {
            console.error(error);
            alert("Error desconocido");
        } finally {
            setIsAddingMultiple(false);
        }
    };

    async function handleCreateItem() {
        if (!newName.trim()) return;
        setIsCreating(true);

        try {
            const formData = new FormData();
            formData.set("name", newName);
            if (newPrice) formData.set("globalPrice", newPrice);
            if (newCategoryId) formData.set("primaryCategoryId", newCategoryId);

            const res = await createGenericItemAction(null, formData);

            if (res?.error) {
                alert(res.error);
                return;
            }

            const newItemId = (res as any).id;
            if (newItemId) {
                // Immediately add to template with default values
                const addFormData = new FormData();
                addFormData.set("genericItemId", newItemId);
                addFormData.set("defaultQty", "1");

                // We use null for prevState as it is a server action called directly
                const addRes = await addTemplateItemAction(templateId, null, addFormData);

                if (addRes?.error) {
                    alert(addRes.error);
                    // If add failed but create succeeded, maybe we should let them configure?
                    // For now, alert is consistent with existing error handling.
                    setSelectedItemId(newItemId);
                    setStep("configure");
                } else {
                    setOpen(false); // Success - close dialog
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error creando producto");
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Añadir Producto
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="bg-bg-1 border-border sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-text-1">
                        {step === "search" && "Añadir Producto a Plantilla"}
                        {step === "create" && "Crear Nuevo Producto"}
                        {step === "configure" && "Configurar Producto"}
                    </DialogTitle>
                    <DialogDescription className="text-text-2">
                        {step === "search" && "Selecciona uno o varios productos para añadir."}
                        {step === "create" && "Agrega un nuevo producto a tu catálogo."}
                        {step === "configure" && "Define la cantidad y unidad por defecto para este producto."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {step === "search" && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                                <Input
                                    placeholder="Buscar producto (ej. Leche)..."
                                    className="pl-9 bg-bg-2 border-border text-text-1"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {filteredItems.map(item => {
                                    const isSelected = selectedItemIds.includes(item.id);
                                    return (
                                        <div key={item.id} className="flex gap-2 group">
                                            <Button
                                                variant={isSelected ? "secondary" : "ghost"}
                                                className={`flex-1 justify-between text-text-1 hover:bg-bg-2 ${isSelected ? "bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20" : ""}`}
                                                onClick={(e) => toggleSelection(item.id, e)}
                                            >
                                                <span>{item.canonicalName}</span>
                                                {isSelected && <div className="h-2 w-2 rounded-full bg-accent-violet" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Configurar individualmente"
                                                onClick={() => {
                                                    setSelectedItemId(item.id);
                                                    setStep("configure");
                                                }}
                                            >
                                                <Plus className="w-4 h-4 text-text-3" />
                                            </Button>
                                        </div>
                                    );
                                })}

                                {filteredItems.length === 0 && search && (
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-accent-violet hover:bg-accent-violet/10 hover:text-accent-violet"
                                        onClick={() => {
                                            setNewName(search);
                                            setStep("create");
                                            setNewPrice("");
                                            setNewCategoryId("");
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Crear &quot;{search}&quot;
                                    </Button>
                                )}

                                {filteredItems.length === 0 && !search && (
                                    <p className="text-sm text-text-3 text-center py-4">Empieza a buscar para ver resultados</p>
                                )}
                            </div>

                            {selectedItemIds.length > 0 && (
                                <div className="pt-2 border-t border-border">
                                    <Button
                                        className="w-full bg-accent-violet hover:bg-accent-violet/90 text-white"
                                        onClick={handleAddMultiple}
                                        disabled={isAddingMultiple}
                                    >
                                        {isAddingMultiple ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Añadir {selectedItemIds.length} productos
                                    </Button>
                                </div>
                            )}

                            {!search && selectedItemIds.length === 0 && (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-text-2 hover:bg-bg-2"
                                    onClick={() => {
                                        setNewName("");
                                        setStep("create");
                                        setNewPrice("");
                                        setNewCategoryId("");
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear nuevo producto
                                </Button>
                            )}
                        </div>
                    )}

                    {step === "create" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-text-1">Nombre del Producto</Label>
                                <Input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ej. Arroz Integral"
                                    className="bg-bg-0 border-input text-text-1 focus-visible:ring-accent-violet"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-text-1">Precio (Opcional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-text-3">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-7 bg-bg-0 border-input text-text-1 focus-visible:ring-accent-violet"
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-text-1">Categoría (Opcional)</Label>
                                <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                                    <SelectTrigger className="bg-bg-0 border-input text-text-1 focus:ring-2 focus:ring-accent-violet">
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" onClick={() => setStep("search")}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateItem}
                                    disabled={!newName.trim() || isCreating}
                                    className="bg-accent-violet text-white hover:bg-accent-violet/90"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Crear y Añadir
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "configure" && selectedItemId && (
                        <form action={formAction} className="space-y-4">
                            <input type="hidden" name="genericItemId" value={selectedItemId} />

                            <div className="p-3 bg-bg-2 rounded-lg border border-border flex justify-between items-center">
                                <span className="font-medium text-text-1">
                                    {genericItems.find(i => i.id === selectedItemId)?.canonicalName || newName}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedItemId(null);
                                        setStep("search");
                                    }}
                                    className="h-7 text-xs"
                                >
                                    Cambiar
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-text-2">Cant. Sugerida</Label>
                                    <Input name="defaultQty" type="number" step="0.01" placeholder="1" className="bg-bg-2 border-border text-text-1" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-text-2">Unidad</Label>
                                    <Select name="defaultUnitId" defaultValue={units.find(u => u.symbol?.toLowerCase() === "und" || u.name.toLowerCase() === "unidad")?.id}>
                                        <SelectTrigger className="bg-bg-2 border-border text-text-1">
                                            <SelectValue placeholder="Unidad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-text-2">Precio Estimado (USD)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-text-3">$</span>
                                        <Input
                                            name="globalPrice"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            defaultValue={genericItems.find(i => i.id === selectedItemId)?.globalPrice || ''}
                                            className="pl-7 bg-bg-2 border-border text-text-1"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-3">Este precio se actualizará en tu catálogo global.</p>
                                </div>
                            </div>

                            {state?.error && <p className="text-destructive text-xs">{state.error}</p>}

                            <DialogFooter>
                                <Button type="submit" disabled={isPending} className="w-full bg-accent-violet text-white hover:bg-accent-violet/90">
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

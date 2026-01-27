"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category, Template, GenericItem } from "@/domain/entities";
import { createGenericItemAction, searchGenericItemsAction, getGenericItemsAction } from "@/app/actions/product";
import { addPurchaseLineAction } from "@/app/actions/purchase";
import { addTemplateItemAction } from "@/app/actions/template";
import { Loader2, Plus, Search, Tag, Eye } from "lucide-react";

interface UnplannedProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseId: string;
    categories: Category[];
    templates: Template[];
    existingItemIds: string[];
    onSuccess: () => void;
}

export function UnplannedProductDialog({
    open,
    onOpenChange,
    purchaseId,
    categories,
    templates,
    existingItemIds,
    onSuccess
}: UnplannedProductDialogProps) {
    const [step, setStep] = useState<"search" | "create" | "confirm_existing" | "template">("search");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GenericItem[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedExistingItem, setSelectedExistingItem] = useState<GenericItem | null>(null);

    // Create State
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [duplicateMatch, setDuplicateMatch] = useState<GenericItem | null>(null);

    // Shared State
    const [loading, setLoading] = useState(false);
    const [createdGenericId, setCreatedGenericId] = useState<string | null>(null);

    // Search Effect with Debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchGenericItemsAction(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    async function handleLoadAll() {
        setSearching(true);
        try {
            const results = await getGenericItemsAction();
            setSearchResults(results);
        } finally {
            setSearching(false);
        }
    }

    async function handleSelectExisting(item: GenericItem) {
        setLoading(true);
        // Direct Add
        const newItemId = item.id;
        setCreatedGenericId(newItemId);

        // Use global price if available
        const parsedPrice = item.globalPrice || undefined;

        const resAdd = await addPurchaseLineAction(purchaseId, newItemId, parsedPrice);
        if (resAdd?.error) {
            alert(resAdd.error);
            setLoading(false);
            return;
        }

        setLoading(false);
        checkTemplatesAndNext();
    }

    function handleGoToCreate() {
        setName(searchQuery);
        setStep("create");
    }

    async function handleCreate(force: boolean = false) {
        if (!name.trim()) return;
        setLoading(true);

        // Duplicate Detection (if not forcing)
        if (!force) {
            const allItems = await getGenericItemsAction();
            const match = allItems.find(i => i.canonicalName.toLowerCase() === name.trim().toLowerCase());
            if (match) {
                setDuplicateMatch(match);
                setStep("confirm_existing");
                setLoading(false);
                return;
            }
        }

        const formData = new FormData();
        formData.set("name", name);
        formData.set("primaryCategoryId", categoryId);

        // 1. Create Generic Item
        const resItem = await createGenericItemAction(null, formData);
        if (resItem?.error) {
            alert(resItem.error);
            setLoading(false);
            return;
        }

        const newItemId = (resItem as any).id;
        if (!newItemId) {
            setLoading(false);
            return;
        }

        setCreatedGenericId(newItemId);

        // 2. Add to Purchase with Price
        const parsedPrice = price ? parseFloat(price) : undefined;
        const resAdd = await addPurchaseLineAction(purchaseId, newItemId, parsedPrice);
        if (resAdd?.error) {
            alert(resAdd.error);
            setLoading(false);
            return;
        }

        setLoading(false);
        checkTemplatesAndNext();
    }

    function checkTemplatesAndNext() {
        // Skip template prompt as per user request
        onSuccess();
        onOpenChange(false);
    }

    async function handleAddToTemplate(templateId: string) {
        if (!createdGenericId) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("genericItemId", createdGenericId);
        fd.set("defaultQty", "1");

        await addTemplateItemAction(templateId, null, fd);
        setLoading(false);
        onSuccess();
        onOpenChange(false);
    }

    async function handleSkipTemplate() {
        onSuccess();
        onOpenChange(false);
    }

    // Reset state on open/close
    if (!open && step !== "search") {
        setTimeout(() => {
            setStep("search");
            setSearchQuery("");
            setSearchResults([]);
            setName("");
            setPrice("");
            setCategoryId("");
            setCreatedGenericId(null);
            setSelectedExistingItem(null);
            setDuplicateMatch(null);
        }, 200);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-bg-1 border-border">
                <DialogHeader>
                    <DialogTitle>
                        {step === "search" && "Agregar Producto"}
                        {step === "create" && "Crear Nuevo Producto"}
                        {step === "confirm_existing" && "Producto Existente"}
                        {step === "template" && "¿Agregar a una plantilla?"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "search" && "Busca en el catálogo o crea uno nuevo."}
                        {step === "confirm_existing" && `Encontramos "${duplicateMatch?.canonicalName}" en tu catálogo.`}
                        {step === "create" && "Detalles del nuevo producto."}
                        {step === "template" && "Guarda este producto para el futuro."}
                    </DialogDescription>
                </DialogHeader>

                {step === "search" && (
                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-text-3" />
                            <Input
                                placeholder="Buscar producto..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 bg-bg-0 border-input text-text-1"
                                autoFocus
                            />
                            {searching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-text-3" />}
                        </div>

                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                            {!searchQuery.trim() && searchResults.length === 0 && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-text-3 border-dashed border-border hover:bg-glass"
                                    onClick={handleLoadAll}
                                >
                                    <Eye className="w-4 h-4 mr-2 text-accent-cyan" />
                                    Ver todos los productos
                                </Button>
                            )}


                            {searchResults
                                .filter(item => !existingItemIds.includes(item.id))
                                .map(item => (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        className="w-full justify-between font-normal group hover:bg-glass text-text-1"
                                        onClick={() => handleSelectExisting(item)}
                                        disabled={loading}
                                    >
                                        <span className="flex items-center">
                                            <Tag className="w-4 h-4 mr-2 text-text-3 group-hover:text-accent-violet" />
                                            {item.canonicalName}
                                        </span>
                                        {item.globalPrice && (
                                            <span className="text-xs font-mono text-accent-mint bg-accent-mint/10 px-2 py-0.5 rounded">
                                                ${item.globalPrice.toFixed(2)}
                                            </span>
                                        )}
                                    </Button>
                                ))}

                            {searchQuery.trim() && (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-accent-violet hover:text-accent-violet/80 hover:bg-accent-violet/10 group"
                                    onClick={handleGoToCreate}
                                >
                                    <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                    Crear &quot;{searchQuery}&quot;
                                </Button>
                            )}
                            {!searchQuery.trim() && (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-text-2 hover:bg-glass"
                                    onClick={() => setStep("create")}
                                >
                                    <Plus className="w-4 h-4 mr-2 text-accent-violet" />
                                    Crear nuevo producto
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === "create" && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-text-1">Nombre del producto</Label>
                            <Input
                                placeholder="Ej: Salsa de Tomate"
                                value={name}
                                onChange={e => setName(e.target.value)}
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
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-text-1">Categoría (Opcional)</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-bg-0 px-3 py-2 text-sm text-text-1 focus:ring-2 focus:ring-accent-violet outline-none"
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                            >
                                <option value="">Sin Categoría</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {step === "confirm_existing" && duplicateMatch && (
                    <div className="space-y-6 py-6">
                        <div className="p-4 rounded-xl bg-accent-violet/5 border border-accent-violet/20 text-center space-y-2">
                            <p className="text-text-1 text-sm">
                                Este producto ya existe en tu catálogo. ¿Quieres usar el existente o crear uno nuevo de todos modos?
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <Button
                                className="w-full bg-accent-violet text-white hover:bg-accent-violet/90"
                                onClick={() => handleSelectExisting(duplicateMatch)}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
                                Usar &quot;{duplicateMatch.canonicalName}&quot;
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full border-border text-text-2 hover:bg-glass"
                                onClick={() => handleCreate(true)}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Crear como producto nuevo
                            </Button>
                        </div>
                    </div>
                )}

                {step === "template" && (
                    <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto">
                        <div className="grid gap-2">
                            {templates.map(t => (
                                <Button
                                    key={t.id}
                                    variant="outline"
                                    className="justify-start border-border hover:bg-glass text-text-1"
                                    onClick={() => handleAddToTemplate(t.id)}
                                    disabled={loading}
                                >
                                    <Plus className="w-4 h-4 mr-2 text-accent-violet" /> {t.name}
                                </Button>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full text-text-3 hover:text-text-1" onClick={handleSkipTemplate}>
                            No agregar a plantilla
                        </Button>
                    </div>
                )}

                <DialogFooter>
                    {step === "create" && (
                        <div className="flex gap-2 w-full justify-between items-center border-t border-border pt-4">
                            <Button variant="ghost" className="text-text-3 hover:text-text-1" onClick={() => setStep("search")}>Atrás</Button>
                            <Button
                                onClick={() => handleCreate()}
                                disabled={!name.trim() || loading}
                                className="bg-accent-violet text-white hover:bg-accent-violet/90 shadow-lg shadow-accent-violet/20"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar y añadir"}
                            </Button>
                        </div>
                    )}
                    {step === "confirm_existing" && (
                        <Button variant="ghost" className="w-full text-text-3" onClick={() => setStep("create")} disabled={loading}>
                            Cancelar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

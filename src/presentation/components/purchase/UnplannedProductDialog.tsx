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

    // Shared State
    const [loading, setLoading] = useState(false);
    const [createdGenericId, setCreatedGenericId] = useState<string | null>(null);

    // Search Effect with Debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            // Keep results if we manually loaded them? No, clear them to return to empty state
            // But if we just clicked "Load All", query is empty.
            // We can prevent clearing if results > 0 and query empty? 
            // Better: Only clear if we were searching.
            // Or simpler: Don't clear here. rely on manual clear?
            // If user deletes text, they expect clear.
            // The effect depends on [searchQuery]. If I change query, it runs.
            // If I click button, query doesn't change. Effect doesn't run.
            // If I clear query (backspace), query changes. Effect runs.
            // So: if query is empty, set results [].
            // THIS WILL CLEAR "Show All" results if I type something then delete it. This is acceptable behavior.
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

    // Removed handleConfirmExisting as it is no longer used

    async function handleCreate() {
        if (!name.trim()) return;
        setLoading(true);

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
        }, 200);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {step === "search" && "Agregar Producto"}
                        {step === "create" && "Crear Nuevo Producto"}
                        {step === "confirm_existing" && "Confirmar Agregar"}
                        {step === "template" && "¿Agregar a una plantilla?"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "search" && "Busca en el catálogo o crea uno nuevo."}
                        {step === "confirm_existing" && `Agregando "${selectedExistingItem?.canonicalName}" a la lista.`}
                        {step === "create" && "Detalles del nuevo producto."}
                        {step === "template" && "Guarda este producto para el futuro."}
                    </DialogDescription>
                </DialogHeader>

                {step === "search" && (
                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar producto..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                            {searching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>

                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {!searchQuery.trim() && searchResults.length === 0 && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-muted-foreground border-dashed"
                                    onClick={handleLoadAll}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver todos los productos
                                </Button>
                            )}


                            {searchResults
                                .filter(item => !existingItemIds.includes(item.id))
                                .map(item => (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        className="w-full justify-between font-normal group"
                                        onClick={() => handleSelectExisting(item)}
                                        disabled={loading}
                                    >
                                        <span className="flex items-center">
                                            <Tag className="w-4 h-4 mr-2 text-muted-foreground opacity-70 group-hover:text-accent-violet" />
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
                                    className="w-full justify-start text-accent-violet hover:text-accent-violet/80 hover:bg-accent-violet/10"
                                    onClick={handleGoToCreate}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear "{searchQuery}"
                                </Button>
                            )}
                            {!searchQuery.trim() && (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-muted-foreground"
                                    onClick={() => setStep("create")}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear nuevo producto
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === "create" && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre del producto</Label>
                            <Input
                                placeholder="Ej: Salsa de Tomate"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Precio (Opcional)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-text-3">$</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-7"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría (Opcional)</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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

                {step === "template" && (
                    <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto">
                        <div className="grid gap-2">
                            {templates.map(t => (
                                <Button
                                    key={t.id}
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => handleAddToTemplate(t.id)}
                                    disabled={loading}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> {t.name}
                                </Button>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full" onClick={handleSkipTemplate}>
                            No agregar a plantilla
                        </Button>
                    </div>
                )}

                <DialogFooter>
                    {step === "create" && (
                        <div className="flex gap-2 w-full justify-between">
                            <Button variant="ghost" onClick={() => setStep("search")}>Atrás</Button>
                            <Button onClick={handleCreate} disabled={!name.trim() || loading} className="bg-accent-violet">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar y añadir"}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

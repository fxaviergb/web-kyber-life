"use client";

import { useState, useEffect } from "react";
import { FormSheet, FormSheetBody, FormSheetFooter } from "@/components/ui/form-sheet";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Category, Template, GenericItem, Unit, BrandProduct } from "@/domain/entities";
import { createGenericItemAction, searchGenericItemsAction, getGenericItemsAction } from "@/app/actions/product";
import { addPurchaseLineAction } from "@/app/actions/purchase";
import { addTemplateItemAction } from "@/app/actions/template";
import { Loader2, Plus, Search, Tag, Eye, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UnplannedProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseId: string;
    categories: Category[];
    templates: Template[];
    existingItemIds: string[];
    initialSearch?: string;
    brandOptionsMap: Record<string, BrandProduct[]>;
    units: Unit[];
    onSuccess: () => void;
}

export function UnplannedProductDialog({
    open,
    onOpenChange,
    purchaseId,
    categories,
    templates,
    existingItemIds,
    initialSearch,
    brandOptionsMap,
    units,
    onSuccess
}: UnplannedProductDialogProps) {
    const router = useRouter();
    const [step, setStep] = useState<"search" | "create" | "confirm_existing" | "template">("search");

    // Search State
    const [searchQuery, setSearchQuery] = useState(initialSearch || "");
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
    const [markAsBought, setMarkAsBought] = useState(true);
    
    // Additional Details State
    const [qty, setQty] = useState("1");
    const [unitId, setUnitId] = useState("");
    const [brandId, setBrandId] = useState(""); // empty string means Generic
    const [prices, setPrices] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!unitId && units.length > 0) {
            const undUnit = units.find(u => u.symbol?.toLowerCase() === 'und' || u.name.toLowerCase() === 'unidad' || u.name.toLowerCase() === 'unidades');
            if (undUnit) {
                setUnitId(undUnit.id);
            }
        }
    }, [units, unitId]);

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

    // Update internal search state if initialSearch prop changes and dialog is open
    useEffect(() => {
        if (open && initialSearch) {
            setSearchQuery(initialSearch);
        }
    }, [initialSearch, open]);

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

        const itemPriceStr = prices[item.id];
        let parsedPrice: number | undefined;
        if (itemPriceStr !== undefined && itemPriceStr !== "") {
            parsedPrice = parseFloat(itemPriceStr);
        } else {
            parsedPrice = item.globalPrice || undefined;
        }

        if (markAsBought && (!parsedPrice || parsedPrice <= 0)) {
            toast.error("Ingresa el precio antes de marcar como comprado.");
            setLoading(false);
            return;
        }

        const newItemId = item.id;
        setCreatedGenericId(newItemId);

        const parsedQty = parseFloat(qty);
        const finalQty = !isNaN(parsedQty) ? parsedQty : 1;
        const finalUnitId = unitId || undefined;
        const finalBrandId = brandId || undefined;

        const resAdd = await addPurchaseLineAction(purchaseId, newItemId, parsedPrice, markAsBought, finalQty, finalUnitId, finalBrandId);
        if (resAdd?.error) {
            alert(resAdd.error);
            setLoading(false);
            return;
        }

        if (markAsBought) {
            toast.success(`${item.canonicalName} comprado`, {
                icon: <CheckCircle className="w-5 h-5 text-accent-success" />
            });
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

        const parsedPrice = price ? parseFloat(price) : undefined;
        if (markAsBought && (!parsedPrice || parsedPrice <= 0)) {
            toast.error("Ingresa el precio antes de marcar como comprado.");
            setLoading(false);
            return;
        }

        const parsedQty = parseFloat(qty);
        const finalQty = !isNaN(parsedQty) ? parsedQty : 1;
        const finalUnitId = unitId || undefined;
        const finalBrandId = brandId || undefined;

        const resAdd = await addPurchaseLineAction(purchaseId, newItemId, parsedPrice, markAsBought, finalQty, finalUnitId, finalBrandId);
        if (resAdd?.error) {
            alert(resAdd.error);
            setLoading(false);
            return;
        }

        if (markAsBought) {
            toast.success(`${name} comprado`, {
                icon: <CheckCircle className="w-5 h-5 text-accent-success" />
            });
        }

        setLoading(false);
        checkTemplatesAndNext();
    }

    function checkTemplatesAndNext() {
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

    if (!open && step !== "search") {
        setTimeout(() => {
            setStep("search");
            setSearchQuery(initialSearch || "");
            setSearchResults([]);
            setName("");
            setPrice("");
            setCategoryId("");
            setCreatedGenericId(null);
            setSelectedExistingItem(null);
            setDuplicateMatch(null);
            setMarkAsBought(true);
            setQty("1");
            setUnitId("");
            setBrandId("");
        }, 200);
    }

    const title = step === "search" ? "Agregar Producto" :
        step === "create" ? "Crear Nuevo Producto" :
            step === "confirm_existing" ? "Producto Existente" :
                step === "template" ? "¿Agregar a una plantilla?" : "";

    const description = step === "search" ? "Busca en el catálogo o crea uno nuevo." :
        step === "confirm_existing" ? `Encontramos "${duplicateMatch?.canonicalName}" en tu catálogo.` :
            step === "create" ? "Detalles del nuevo producto." :
                step === "template" ? "Guarda este producto para el futuro." : "";

    const sharedContent = (
        <div className="px-4">
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

                    <div className="flex items-center space-x-2 pb-2">
                        <Checkbox 
                            id="markAsBoughtSearch" 
                            checked={markAsBought} 
                            onCheckedChange={(c) => setMarkAsBought(c as boolean)} 
                        />
                        <Label htmlFor="markAsBoughtSearch" className="text-text-2 cursor-pointer font-medium text-sm">Marcar como comprado</Label>
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
                            .map(item => {
                                const brandsForItem = brandOptionsMap[item.id] || [];
                                return (
                                <div key={item.id} className="border border-border-base rounded-xl p-3 bg-bg-secondary hover:border-accent-violet/30 transition-colors mb-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center text-text-1 font-medium">
                                            <Tag className="w-4 h-4 mr-2 text-accent-violet shrink-0" />
                                            <span className="truncate">{item.canonicalName}</span>
                                        </span>
                                        {item.globalPrice && (
                                            <span className="text-xs font-mono text-accent-mint bg-accent-mint/10 px-2 py-0.5 rounded ml-2 shrink-0">
                                                ${item.globalPrice.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs text-text-3">Cantidad</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                defaultValue="1"
                                                className="h-8 text-sm bg-bg-1"
                                                onChange={(e) => setQty(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs text-text-3">Unidad</Label>
                                            <select
                                                className="h-8 w-full rounded-md border border-border-base bg-bg-1 px-2 text-sm text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-violet"
                                                onChange={(e) => setUnitId(e.target.value)}
                                            >
                                                <option value="">--</option>
                                                {units.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.symbol || u.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs text-text-3">Marca / Presentación</Label>
                                            <select
                                                className="h-8 w-full rounded-md border border-border-base bg-bg-1 px-2 text-sm text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-violet"
                                                onChange={(e) => setBrandId(e.target.value)}
                                            >
                                                <option value="">Genérico</option>
                                                {brandsForItem.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.brand} {b.presentation}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs text-text-3">Precio {markAsBought ? "*" : "(Opcional)"}</Label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-text-3 text-sm">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="h-8 pl-6 text-sm bg-bg-1"
                                                    value={prices[item.id] !== undefined ? prices[item.id] : (item.globalPrice || "")}
                                                    onChange={(e) => setPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-accent-violet/10 text-accent-violet hover:bg-accent-violet hover:text-white h-8 text-xs mt-1"
                                        onClick={() => handleSelectExisting(item)}
                                        disabled={loading}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Agregar a la lista
                                    </Button>
                                </div>
                            )})}

                        {searchQuery.trim() && (
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-accent-violet hover:text-accent-violet/80 hover:bg-accent-violet/10 group h-auto py-3"
                                onClick={handleGoToCreate}
                            >
                                <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform shrink-0" />
                                <span className="truncate">Crear &quot;{searchQuery}&quot;</span>
                            </Button>
                        )}
                        {!searchQuery.trim() && (
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-text-2 hover:bg-glass h-auto py-3"
                                onClick={() => setStep("create")}
                            >
                                <Plus className="w-4 h-4 mr-2 text-accent-violet shrink-0" />
                                Crear nuevo producto
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {step === "create" && (
                <div className="space-y-4 py-4">
                    <Field label="Nombre del producto">
                        <Input
                            placeholder="Ej: Salsa de Tomate"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </Field>
                    <Field label="Precio" optional>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-text-tertiary">$</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                            />
                        </div>
                    </Field>
                    <Field label="Categoría" optional>
                        <select
                            className="w-full h-10 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                        >
                            <option value="">Sin Categoría</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Cantidad">
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                            />
                        </Field>
                        <Field label="Unidad">
                            <select
                                className="w-full h-10 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
                                value={unitId}
                                onChange={(e) => setUnitId(e.target.value)}
                            >
                                <option value="">--</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.symbol || u.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="markAsBoughtCreate" 
                            checked={markAsBought} 
                            onCheckedChange={(c) => setMarkAsBought(c as boolean)} 
                        />
                        <Label htmlFor="markAsBoughtCreate" className="text-text-2 cursor-pointer font-medium text-sm">Marcar como comprado</Label>
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

                    {/* Show extra fields before confirmation so user can edit qty/brand/unit for the existing item */}
                    <div className="grid gap-4 bg-bg-secondary p-4 rounded-xl border border-border-base">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-text-2 text-xs uppercase tracking-wider">Marca / Presentación</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-border-base bg-bg-1 px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-accent-violet"
                                    value={brandId}
                                    onChange={e => setBrandId(e.target.value)}
                                >
                                    <option value="">Genérico</option>
                                    {(brandOptionsMap[duplicateMatch.id] || []).map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.brand} {b.presentation}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-text-2 text-xs uppercase tracking-wider">Precio {markAsBought ? "*" : "(Opcional)"}</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-text-3">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-7 bg-bg-1 border-border-base"
                                        value={prices[duplicateMatch.id] !== undefined ? prices[duplicateMatch.id] : (duplicateMatch.globalPrice || "")}
                                        onChange={(e) => setPrices(prev => ({ ...prev, [duplicateMatch.id]: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-text-2 text-xs uppercase tracking-wider">Cantidad</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    className="bg-bg-1 border-border-base"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-text-2 text-xs uppercase tracking-wider">Unidad</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-border-base bg-bg-1 px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-accent-violet"
                                    value={unitId}
                                    onChange={(e) => setUnitId(e.target.value)}
                                >
                                    <option value="">--</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.symbol || u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
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
        </div>
    );

    const sharedFooter = (
        <>
            {step === "create" && (
                <div className="flex gap-2 w-full justify-between items-center">
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
                <Button variant="ghost" className="w-full text-text-3 mt-4" onClick={() => setStep("create")} disabled={loading}>
                    Cancelar
                </Button>
            )}
        </>
    );

    const hasFooter = step === "create" || step === "confirm_existing";

    return (
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            contentClassName="sm:max-w-[425px]"
        >
            <FormSheetBody className="px-1">
                {sharedContent}
            </FormSheetBody>
            {hasFooter && <FormSheetFooter>{sharedFooter}</FormSheetFooter>}
        </FormSheet>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Purchase, PurchaseLine, BrandProduct, Unit, GenericItem, Category } from "@/domain/entities";
import { updateLineJsonAction, finishPurchaseAction, deletePurchaseAction } from "@/app/actions/purchase";
import { updateGenericGlobalPriceAction } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CreateBrandProductModal } from "@/presentation/components/products/CreateBrandProductModal";
import { UnplannedProductDialog } from "./UnplannedProductDialog";
import { FinishPurchaseDialog } from "./FinishPurchaseDialog";
import { Template } from "@/domain/entities";
import { CheckCircle, Globe, Tag, Plus, Trash2 } from "lucide-react";
// import { toast } from "sonner"; // Assuming sonner is installed or use alert

export function PurchaseChecklist({
    purchase,
    initialLines,
    brandOptionsMap,
    units,
    genericItemsMap,
    categories,
    userTemplates
}: {
    purchase: Purchase,
    initialLines: PurchaseLine[],
    brandOptionsMap: Record<string, BrandProduct[]>,
    units: Unit[],
    genericItemsMap: Record<string, GenericItem>,
    categories: Category[],
    userTemplates: Template[]
}) {
    const [lines, setLines] = useState(initialLines);

    // Update lines if server data changes (e.g. after revalidation)
    useEffect(() => {
        setLines(initialLines);
    }, [initialLines]);

    const [finishing, setFinishing] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [showEmptyAlert, setShowEmptyAlert] = useState(false);
    const [errorAlertMessage, setErrorAlertMessage] = useState("");
    const router = useRouter();

    // Unplanned Item State
    const [unplannedModalOpen, setUnplannedModalOpen] = useState(false);

    // Finish Purchase State
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);

    // Create New Option State

    // Create New Option State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForGenericId, setCreateForGenericId] = useState<string | null>(null);

    // Global Price Update State


    const totalEstimated = lines.reduce((sum, line) => {
        if (line.checked && line.unitPrice && line.unitPrice > 0) {
            return sum + (line.unitPrice * (line.qty || 1));
        }
        return sum;
    }, 0);

    async function handleLineUpdate(lineId: string, updates: Partial<PurchaseLine>) {
        // Validation Logic for Checking
        if (updates.checked === true) {
            const line = lines.find(l => l.id === lineId);
            const price = updates.unitPrice !== undefined ? updates.unitPrice : line?.unitPrice;

            // If price is missing or 0, block check
            if (!price || price <= 0) {
                setErrorAlertMessage("Ingresa el precio antes de marcar como comprado.");
                setShowErrorAlert(true);
                return; // Block update
            }
        }

        setLines(prev => prev.map(l => l.id === lineId ? { ...l, ...updates } : l));
        await updateLineJsonAction(lineId, updates);
    }

    function handlePriceBlur(line: PurchaseLine, newPriceStr: string) {
        const newPrice = parseFloat(newPriceStr);
        if (isNaN(newPrice)) return;

        // 1. Update line immediately
        if (line.unitPrice !== newPrice) {
            handleLineUpdate(line.id, { unitPrice: newPrice });
        }

    }

    function handleBrandChange(lineId: string, value: string, genericItemId: string) {
        if (value === "new_option") {
            setCreateForGenericId(genericItemId);
            setCreateModalOpen(true);
        } else {
            handleLineUpdate(lineId, { brandProductId: value || null });
        }
    }



    const hasCheckedItems = lines.some(l => l.checked);

    function onDiscardClick() {
        setShowEmptyAlert(true);
    }

    function onFinishClick() {
        // Validate prices before opening completion dialog
        const invalid = lines.some(l => l.checked && (!l.unitPrice || l.unitPrice <= 0));
        if (invalid) {
            setErrorAlertMessage("Hay items marcados como comprados que no tienen precio registrado. Por favor completa los precios.");
            setShowErrorAlert(true);
            return;
        }
        setFinishDialogOpen(true);
    }

    const isReadOnly = purchase.status === 'completed';

    // Split into Pending and Completed
    const pendingLines = lines.filter(l => !l.checked);
    const completedLines = lines.filter(l => l.checked);

    // Grouping Helper
    function groupByCategory(items: PurchaseLine[]) {
        return items.reduce((acc, line) => {
            const genericItem = genericItemsMap[line.genericItemId];
            const categoryId = genericItem?.primaryCategoryId || "uncategorized";
            if (!acc[categoryId]) acc[categoryId] = [];
            acc[categoryId].push(line);
            return acc;
        }, {} as Record<string, PurchaseLine[]>);
    }

    const groupedPending = groupByCategory(pendingLines);

    // Sort Categories for Pending
    const sortedPendingCategoryIds = Object.keys(groupedPending).sort((a, b) => {
        if (a === "uncategorized") return 1;
        if (b === "uncategorized") return -1;
        const catA = categories.find(c => c.id === a)?.name || "";
        const catB = categories.find(c => c.id === b)?.name || "";
        return catA.localeCompare(catB);
    });

    const renderLine = (line: PurchaseLine) => {
        const brands = brandOptionsMap[line.genericItemId] || [];
        const genericItem = genericItemsMap[line.genericItemId];
        const genericName = genericItem?.canonicalName || "Item";
        const needsPrice = line.checked && (!line.unitPrice || line.unitPrice <= 0);

        return (
            <div key={line.id} className={cn(
                "p-3 rounded-xl border transition-all",
                line.checked
                    ? "bg-bg-1/50 border-input opacity-75"
                    : "bg-bg-1 border-border shadow-sm hover:border-accent-violet",
                needsPrice && "border-destructive ring-1 ring-destructive"
            )}>
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    {/* Check & Name */}
                    <div className="flex items-center gap-3 flex-1 w-full">
                        <Checkbox
                            checked={line.checked}
                            onCheckedChange={(c) => !isReadOnly && handleLineUpdate(line.id, { checked: !!c })}
                            disabled={isReadOnly}
                            className={cn(
                                "h-6 w-6 border-2 data-[state=checked]:bg-accent-mint data-[state=checked]:border-accent-mint"
                            )}
                        />
                        <div className="flex-1 min-w-0">
                            <p className={cn("font-medium text-lg truncate", line.checked && "line-through text-text-3")}>
                                {genericName}
                            </p>
                            {!line.brandProductId && genericItem?.globalPrice && (
                                <p className="text-xs text-text-3 flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Ref: ${genericItem.globalPrice}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 w-full md:w-auto items-center">
                        <div className="w-full md:w-40 col-span-3 md:col-span-1">
                            <select
                                className="w-full h-10 rounded-md border border-input bg-bg-2 px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                value={line.brandProductId || ""}
                                onChange={(e) => handleBrandChange(line.id, e.target.value, line.genericItemId)}
                                disabled={line.checked || isReadOnly}
                            >
                                <option value="">Genérico</option>
                                {brands.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.brand} {b.presentation} {b.globalPrice ? `($${b.globalPrice})` : ""}
                                    </option>
                                ))}
                                <option value="new_option" className="font-bold text-accent-violet">+ Crear nueva opción...</option>
                            </select>
                        </div>

                        <div className="flex gap-1 w-full md:w-32 col-span-2 md:col-span-1">
                            <Input
                                type="number"
                                placeholder="Cant"
                                className="bg-bg-0 border-input w-16 text-center px-1"
                                defaultValue={line.qty?.toString()}
                                disabled={line.checked || isReadOnly}
                                onBlur={(e) => handleLineUpdate(line.id, { qty: parseFloat(e.target.value) })}
                            />
                            <select
                                className="w-full h-10 rounded-md border border-input bg-bg-2 px-1 py-2 text-xs text-text-1 disabled:opacity-50"
                                value={line.unitId || ""}
                                onChange={(e) => handleLineUpdate(line.id, { unitId: e.target.value || null })}
                                disabled={line.checked || isReadOnly}
                            >
                                <option value="">--</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.symbol || u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full md:w-28 relative col-span-1 md:col-span-1">
                            <span className="absolute left-3 top-2.5 text-text-3">$</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className={cn(
                                    "pl-7 bg-bg-0 border-input font-bold",
                                    (!line.unitPrice || line.unitPrice <= 0) && line.checked && "border-destructive focus-visible:ring-destructive"
                                )}
                                defaultValue={line.unitPrice?.toString()}
                                disabled={isReadOnly}
                                onBlur={(e) => handlePriceBlur(line, e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {!isReadOnly && (
                <div className="flex justify-between items-center bg-bg-1 p-4 rounded-xl border border-border sticky top-0 z-30 shadow-lg backdrop-blur-md bg-opacity-90">
                    <div>
                        <p className="text-sm text-text-2">Total Estimado</p>
                        <p className="text-2xl font-bold text-accent-mint">${totalEstimated.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setUnplannedModalOpen(true)}
                            disabled={finishing}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Agregar Item
                        </Button>

                        {hasCheckedItems ? (
                            <Button
                                onClick={onFinishClick}
                                disabled={finishing}
                                className="bg-accent-violet hover:bg-accent-violet/90"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> Finalizar
                            </Button>
                        ) : (
                            <Button
                                onClick={onDiscardClick}
                                disabled={finishing}
                                variant="destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Descartar
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* PENDING ITEMS */}
            <div className="space-y-6">
                {sortedPendingCategoryIds.map(catId => {
                    const catName = catId === "uncategorized"
                        ? "Sin Categoría"
                        : categories.find(c => c.id === catId)?.name || "Desconocido";

                    const catLines = groupedPending[catId];

                    return (
                        <div key={catId} className="space-y-2">
                            <div className="flex items-center gap-2 text-text-2 px-1">
                                <Tag className="w-4 h-4" />
                                <h3 className="font-semibold text-sm uppercase tracking-wide">{catName}</h3>
                            </div>

                            <div className="space-y-2">
                                {catLines.map(line => renderLine(line))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* COMPLETED ITEMS */}
            {completedLines.length > 0 && (
                <>
                    <div className="border-t border-border my-8" />
                    <div className="space-y-4">
                        <h3 className="text-text-2 font-semibold text-sm uppercase tracking-wide px-1">Comprados ({completedLines.length})</h3>
                        <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                            {completedLines.map(line => renderLine(line))}
                        </div>
                    </div>
                </>
            )}

            <FinishPurchaseDialog
                open={finishDialogOpen}
                onOpenChange={setFinishDialogOpen}
                purchaseId={purchase.id}
                purchase={purchase}
                lines={lines}
                newLines={lines.filter(l => !initialLines.some(il => il.id === l.id))}
                categories={categories}
                genericItemsMap={genericItemsMap}
                totalEstimated={totalEstimated}
                templates={userTemplates}
            />

            <ConfirmationModal
                open={showErrorAlert}
                onOpenChange={setShowErrorAlert}
                title="Atención"
                description={errorAlertMessage}
                confirmText="Entendido"
                showCancel={false}
                onConfirm={() => setShowErrorAlert(false)}
            />

            <ConfirmationModal
                open={showEmptyAlert}
                onOpenChange={setShowEmptyAlert}
                title="Descartar Compra"
                description={lines.length === 0
                    ? "Esta compra no tiene items. ¿Deseas eliminarla?"
                    : "No has marcado ningún item como comprado. ¿Deseas descartar esta compra?"}
                confirmText="Eliminar Compra"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={async () => {
                    setFinishing(true);
                    await deletePurchaseAction(purchase.id);
                    router.push("/dashboard");
                }}
            />

            <UnplannedProductDialog
                open={unplannedModalOpen}
                onOpenChange={setUnplannedModalOpen}
                purchaseId={purchase.id}
                categories={categories}
                templates={userTemplates}
                existingItemIds={lines.map(l => l.genericItemId)}
                onSuccess={() => {
                    // Page revalidates via actions, but let's refresh local logic? 
                    // Actually, actions called inside dialog revalidate path. 
                    // But `router.refresh()` might be needed to see new lines immediately if they don't appear?
                    // RevalidatePath usually updates server components. Client components using props (initialLines) might NOT update unless parent re-renders or we use router.refresh().
                    // Since specific actions revalidate, Next.js should handle soft navigation update.
                    // Or here.
                    window.location.reload(); // Hard reload or router.refresh()
                }}
            />




            {
                createForGenericId && (
                    <CreateBrandProductModal
                        genericItemId={createForGenericId}
                        genericItemName={genericItemsMap[createForGenericId]?.canonicalName || "Item"}
                        open={createModalOpen}
                        onOpenChange={(open) => {
                            setCreateModalOpen(open);
                            if (!open) setCreateForGenericId(null);
                        }}
                    />
                )
            }
        </div >
    );
}

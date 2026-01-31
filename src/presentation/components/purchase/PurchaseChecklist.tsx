"use client";

import { useState, useEffect } from "react";
import { Purchase, PurchaseLine, BrandProduct, Unit, GenericItem, Category } from "@/domain/entities";
import { updateLineJsonAction, finishPurchaseAction, deletePurchaseAction, deleteLineAction } from "@/app/actions/purchase";
import { updateGenericGlobalPriceAction } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { CreateBrandProductModal } from "@/presentation/components/products/CreateBrandProductModal";
import { UnplannedProductDialog } from "./UnplannedProductDialog";
import { FinishPurchaseDialog } from "./FinishPurchaseDialog";
import { PurchaseItemCard } from "./PurchaseItemCard";
import { PurchaseItemDetailSheet } from "./PurchaseItemDetailSheet";
import { ProductDetailModal } from "./ProductDetailModal";
import { Template } from "@/domain/entities";
import { CheckCircle, Tag, Plus, Trash2 } from "lucide-react";

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
    const [createForLineId, setCreateForLineId] = useState<string | null>(null);
    const [extraBrands, setExtraBrands] = useState<Record<string, BrandProduct[]>>({});

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

    async function handleDeleteLine(lineId: string) {
        setLines(prev => prev.filter(l => l.id !== lineId));
        await deleteLineAction(lineId);
    }

    function handleBrandChange(lineId: string, value: string, genericItemId: string, brandOverride?: BrandProduct) {
        if (value === "new_option") {
            setCreateForGenericId(genericItemId);
            setCreateForLineId(lineId);
            setCreateModalOpen(true);
        } else {
            const updates: Partial<PurchaseLine> = { brandProductId: value || null };

            // Logic: Update price based on selection
            if (value) {
                // Search in both server brands and locally created ones
                const brands = [
                    ...(brandOptionsMap[genericItemId] || []),
                    ...(extraBrands[genericItemId] || [])
                ];
                const brand = brandOverride || brands.find(b => b.id === value);
                if (brand && typeof brand.globalPrice === 'number') {
                    updates.unitPrice = brand.globalPrice;
                }
            } else {
                // Revert to Generic Price
                const generic = genericItemsMap[genericItemId];
                updates.unitPrice = (generic && typeof generic.globalPrice === 'number') ? generic.globalPrice : 0;
            }

            handleLineUpdate(lineId, updates);
        }
    }

    function onBrandCreated(brand: BrandProduct) {
        setExtraBrands(prev => ({
            ...prev,
            [brand.genericItemId]: [...(prev[brand.genericItemId] || []), brand]
        }));
        if (createForLineId && createForGenericId) {
            handleBrandChange(createForLineId, brand.id, createForGenericId, brand);
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

    const [detailSheetOpen, setDetailSheetOpen] = useState(false);
    const [editingLineId, setEditingLineId] = useState<string | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalLineId, setDetailModalLineId] = useState<string | null>(null);

    const renderLine = (line: PurchaseLine) => {
        const brands = [
            ...(brandOptionsMap[line.genericItemId] || []),
            ...(extraBrands[line.genericItemId] || [])
        ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Deduplicate

        const genericItem = genericItemsMap[line.genericItemId];

        return (
            <PurchaseItemCard
                key={line.id}
                line={line}
                genericItem={genericItem}
                brandOptions={brands}
                isChecked={line.checked}
                isReadOnly={isReadOnly}
                onCheckChange={(checked: boolean) => handleLineUpdate(line.id, { checked })}
                onPriceChange={(price: number) => handleLineUpdate(line.id, { unitPrice: price })}
                onOpenDetails={() => {
                    setDetailModalLineId(line.id);
                    setDetailModalOpen(true);
                }}
                onOpenEdit={() => {
                    setEditingLineId(line.id);
                    setDetailSheetOpen(true);
                }}
                onDelete={() => handleDeleteLine(line.id)}
            />
        );
    };

    return (
        <div className="space-y-6">
            {!isReadOnly && (
                <div className="bg-bg-secondary p-5 rounded-2xl border border-white/5 shadow-xl mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Total Estimado</p>
                            <p className="text-3xl font-bold text-accent-success">${totalEstimated.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-text-primary border-0 h-10 px-4 rounded-lg transition-all whitespace-nowrap"
                                onClick={() => setUnplannedModalOpen(true)}
                                disabled={finishing}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Agregar Item
                            </Button>

                            {hasCheckedItems ? (
                                <Button
                                    className="flex-1 sm:flex-none bg-accent-success hover:bg-accent-success/90 text-white h-10 px-4 rounded-lg shadow-lg shadow-accent-success/20 transition-all whitespace-nowrap"
                                    onClick={onFinishClick}
                                    disabled={finishing}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Finalizar
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white h-10 px-4 rounded-lg shadow-lg shadow-red-500/20 transition-all whitespace-nowrap"
                                    onClick={onDiscardClick}
                                    disabled={finishing}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Descartar
                                </Button>
                            )}
                        </div>
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
                        <div key={catId} className="space-y-3">
                            <div className="flex items-center gap-2 text-text-tertiary px-1">
                                <Tag className="w-4 h-4" />
                                <h3 className="font-semibold text-sm uppercase tracking-wide">{catName}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {catLines.map(line => renderLine(line))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* COMPLETED ITEMS */}
            {completedLines.length > 0 && (
                <>
                    <div className="border-t border-border-base my-8" />
                    <div className="space-y-4">
                        <h3 className="text-text-tertiary font-semibold text-sm uppercase tracking-wide px-1">
                            Comprados ({completedLines.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60 hover:opacity-100 transition-opacity">
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
                    window.location.reload();
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
                            if (!open) {
                                setCreateForGenericId(null);
                                setCreateForLineId(null);
                            }
                        }}
                        onSuccess={onBrandCreated}
                    />
                )
            }

            {/* Item Detail Sheet */}
            {editingLineId && (
                <PurchaseItemDetailSheet
                    open={detailSheetOpen}
                    onOpenChange={setDetailSheetOpen}
                    line={lines.find(l => l.id === editingLineId)!}
                    genericItem={genericItemsMap[lines.find(l => l.id === editingLineId)?.genericItemId || ""]}
                    brandOptions={[
                        ...(brandOptionsMap[lines.find(l => l.id === editingLineId)?.genericItemId || ""] || []),
                        ...(extraBrands[lines.find(l => l.id === editingLineId)?.genericItemId || ""] || [])
                    ]}
                    units={units}
                    onUpdate={(updates) => handleLineUpdate(editingLineId, updates)}
                    onCreateBrand={() => {
                        const line = lines.find(l => l.id === editingLineId);
                        if (line) {
                            setCreateForGenericId(line.genericItemId);
                            setCreateForLineId(editingLineId);
                            setCreateModalOpen(true);
                            setDetailSheetOpen(false);
                        }
                    }}
                />
            )}

            {/* Product Detail Modal */}
            {detailModalLineId && (
                <ProductDetailModal
                    open={detailModalOpen}
                    onOpenChange={setDetailModalOpen}
                    genericItem={genericItemsMap[lines.find(l => l.id === detailModalLineId)?.genericItemId || ""]}
                    selectedBrand={brandOptionsMap[lines.find(l => l.id === detailModalLineId)?.genericItemId || ""]?.find(
                        b => b.id === lines.find(l => l.id === detailModalLineId)?.brandProductId
                    )}
                    categories={categories}
                    onEdit={() => {
                        setEditingLineId(detailModalLineId);
                        setDetailModalOpen(false);
                        setDetailSheetOpen(true);
                    }}
                />
            )}
        </div >
    );
}

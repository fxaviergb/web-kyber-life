"use client";

import { useState, useMemo, useEffect } from "react";
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurchaseLine, Category, GenericItem, Purchase, Template } from "@/domain/entities";
import { finishPurchaseAction } from "@/app/actions/purchase";
import { updateGenericGlobalPriceAction } from "@/app/actions/product";
import { addTemplateItemAction } from "@/app/actions/template";
import { Loader2, ArrowRight, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FinishPurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseId: string;
    purchase: Purchase;
    lines: PurchaseLine[];
    newLines: PurchaseLine[];
    categories: Category[];
    genericItemsMap: Record<string, GenericItem>;
    totalEstimated: number;
    templates: Template[];
}

type WizardStep = "totals" | "prices" | "templates" | "processing";

export function FinishPurchaseDialog({
    open,
    onOpenChange,
    purchaseId,
    purchase,
    lines,
    newLines,
    categories,
    genericItemsMap,
    totalEstimated,
    templates
}: FinishPurchaseDialogProps) {
    const [step, setStep] = useState<WizardStep>("totals");
    const [loading, setLoading] = useState(false);

    // -- Step 0: Totals --


    const [subtotal, setSubtotal] = useState<string>("0");
    const [discount, setDiscount] = useState<string>("0");
    const [tax, setTax] = useState<string>("0");
    const [totalPaid, setTotalPaid] = useState<string>("0");
    const [finishTime, setFinishTime] = useState<string>("");

    // Reset when opened
    useEffect(() => {
        if (open) {
            setSubtotal(totalEstimated.toFixed(2));
            setDiscount("0");
            setTax("0");
            // Set current time HH:mm
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            setFinishTime(timeStr);
            setStep("totals");
            setLoading(false);
        }
    }, [open, totalEstimated]);

    useEffect(() => {
        const parseValue = (val: string) => {
            if (!val) return 0;
            // Handle "1.000,00" (Spanish/Euro) -> Remove dots, replace comma with dot
            if (val.includes('.') && val.includes(',')) {
                if (val.indexOf('.') < val.indexOf(',')) {
                    // 1.234,56
                    return parseFloat(val.replace(/\./g, '').replace(',', '.'));
                } else {
                    // 1,234.56 (English/US alternative) -> Remove commas
                    return parseFloat(val.replace(/,/g, ''));
                }
            }
            // Assume single comma is decimal separator
            if (val.includes(',')) {
                return parseFloat(val.replace(/,/g, '.'));
            }
            return parseFloat(val);
        };

        const s = parseValue(subtotal);
        const d = parseValue(discount);
        const t = parseValue(tax);
        // Allow negative so user sees why it's 0 (e.g. discount > subtotal)
        const calculated = s - d + t;
        setTotalPaid(calculated.toFixed(2));
    }, [subtotal, discount, tax]);

    // -- Step 1: Price Updates --
    const priceCandidates = useMemo(() => {
        return lines.filter(l => {
            if (!l.checked || !l.unitPrice || l.unitPrice <= 0) return false;
            // Ignore brand products for global update for now (or handle them if we passed brand map)
            // Simplified: Update Generic Global Price only if no brand selected
            if (l.brandProductId) return false;

            const generic = genericItemsMap[l.genericItemId];
            if (!generic) return false;

            const currentGlobal = generic.globalPrice;
            // Diff check (> 1 cent)
            return !currentGlobal || Math.abs(currentGlobal - l.unitPrice) > 0.01;
        }).map(l => ({
            lineId: l.id,
            genericItemId: l.genericItemId,
            name: genericItemsMap[l.genericItemId]?.canonicalName,
            oldPrice: genericItemsMap[l.genericItemId]?.globalPrice,
            newPrice: l.unitPrice!,
            currencyCode: purchase.currencyCode
        }));
    }, [lines, genericItemsMap, purchase.currencyCode]);

    const [selectedPriceUpdates, setSelectedPriceUpdates] = useState<string[]>([]);

    useEffect(() => {
        // Default select all candidates
        if (open && step === "totals") {
            setSelectedPriceUpdates(priceCandidates.map(c => c.lineId));
        }
    }, [open, priceCandidates, step]);

    // -- Step 2: Templates --
    // Filter newLines that are actually "new" (not in current templates if we could check). 
    // Since we receive 'newLines' from parent which checks initialLines, we trust it.
    // We only care about Checked lines (purchased)? Or all added? Usually purchased ones or explicitly added.
    // Let's assume all newLines (even unchecked?) -> Prompt says "se listan todos los productos nuevos".

    // Check if newLines exist.
    const hasNewItems = newLines.length > 0;

    // State to track which templates to add each item to.
    // Map: itemId -> Set<templateId>
    const [templateSelections, setTemplateSelections] = useState<Record<string, string[]>>({});

    const handleTemplateToggle = (lineId: string, templateId: string) => {
        setTemplateSelections(prev => {
            const current = prev[lineId] || [];
            if (current.includes(templateId)) {
                return { ...prev, [lineId]: current.filter(id => id !== templateId) };
            } else {
                return { ...prev, [lineId]: [...current, templateId] };
            }
        });
    };

    // Calculate 'relevant' templates (those used in purchase + maybe others?)
    // Prompt: "se presentan las plantillas que fueron usadas ... tambien posibilidad de no agregar a ninguna"
    // We show all templates but maybe highlight used ones?
    // Let's simplified: Show list of templates.
    const usedTemplateIds = new Set(purchase.selectedTemplateIds);

    // -- Navigation --

    const canGoNext = () => {
        if (step === "totals") {
            const val = parseFloat(totalPaid);
            return !isNaN(val) && val >= 0;
        }
        return true;
    };

    const handleNext = () => {
        if (step === "totals") {
            if (priceCandidates.length > 0) setStep("prices");
            else if (hasNewItems && templates.length > 0) setStep("templates");
            else handleFinishProcess();
        } else if (step === "prices") {
            if (hasNewItems && templates.length > 0) setStep("templates");
            else handleFinishProcess();
        } else if (step === "templates") {
            handleFinishProcess();
        }
    };

    const handleBack = () => {
        if (step === "processing") return;
        if (step === "prices") setStep("totals");
        else if (step === "templates") {
            if (priceCandidates.length > 0) setStep("prices");
            else setStep("totals");
        }
    };

    async function handleFinishProcess() {
        setStep("processing");
        setLoading(true);

        // 1. Update Prices
        const updates = priceCandidates.filter(c => selectedPriceUpdates.includes(c.lineId));
        await Promise.all(updates.map(u =>
            updateGenericGlobalPriceAction(u.genericItemId, u.newPrice, u.currencyCode)
        ));

        // 2. Add to Templates
        // Flatten selections: [ { templateId, itemId }, ... ]
        const templateAdds: { tId: string, lId: string }[] = [];
        Object.entries(templateSelections).forEach(([lId, tIds]) => {
            tIds.forEach(tId => templateAdds.push({ tId, lId }));
        });

        await Promise.all(templateAdds.map(async ({ tId, lId }) => {
            const line = newLines.find(l => l.id === lId);
            if (line) {
                const fd = new FormData();
                fd.set("genericItemId", line.genericItemId);
                fd.set("defaultQty", (line.qty || 1).toString());
                if (line.unitId) fd.set("defaultUnitId", line.unitId);
                await addTemplateItemAction(tId, null, fd);
            }
        }));

        // 3. Finish Purchase
        const formData = new FormData();
        formData.set("totalPaid", totalPaid);
        if (subtotal) formData.set("subtotal", subtotal);
        if (discount) formData.set("discount", discount);
        if (tax) formData.set("tax", tax);

        if (finishTime) {
            const datePart = purchase.date.split('T')[0];
            // We'll trust the user wants this time on that date.
            // TODO: Proper Timezone handling if moved to server-side rendering with user preferences.
            const finishedAtISO = `${datePart}T${finishTime}:00.000Z`;
            formData.set("finishedAt", finishedAtISO);
        }

        const res = await finishPurchaseAction(purchaseId, formData);
        if (res?.error) {
            alert(res.error);
            setLoading(false);
            setStep("totals"); // Reset?
            return;
        }
        // Redirect handled by action
    }

    // Determine Step Title/Content
    const renderStepContent = () => {
        if (step === "totals") {
            return (
                <div className="space-y-4 py-4 px-1">
                    <p className="text-sm text-text-2">Confirma los valores finales del ticket.</p>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="subtotal">Subtotal</Label>
                                <Input id="subtotal" type="number" value={subtotal} onChange={e => setSubtotal(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount">Descuentos</Label>
                                <Input id="discount" type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="text-accent-mint" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tax">Impuestos</Label>
                                <Input id="tax" type="number" value={tax} onChange={e => setTax(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="finishTime">Hora</Label>
                                <Input id="finishTime" type="time" value={finishTime} onChange={e => setFinishTime(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="totalPaid" className="text-base font-semibold">Total Pagado (Real)</Label>
                        <Input id="totalPaid" type="number" value={totalPaid} onChange={e => setTotalPaid(e.target.value)} className={cn("text-xl font-bold bg-accent-violet/10", parseFloat(totalPaid) < 0 && "text-destructive border-destructive focus-visible:ring-destructive")} />
                        {parseFloat(totalPaid) < 0 && (
                            <p className="text-xs text-destructive font-bold">El total no puede ser negativo.</p>
                        )}
                    </div>
                </div>
            );
        }

        if (step === "prices") {
            return (
                <div className="space-y-4 py-4 px-1">
                    <p className="text-sm text-text-2">Se detectaron cambios de precio en estos productos. Selecciona cuáles deseas actualizar en el catálogo global.</p>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2 border rounded-md p-2">
                        {priceCandidates.map(c => (
                            <div key={c.lineId} className="flex items-start gap-3 p-2 hover:bg-secondary/10 rounded">
                                <Checkbox
                                    checked={selectedPriceUpdates.includes(c.lineId)}
                                    onCheckedChange={(chk) => {
                                        if (chk) setSelectedPriceUpdates(prev => [...prev, c.lineId]);
                                        else setSelectedPriceUpdates(prev => prev.filter(id => id !== c.lineId));
                                    }}
                                />
                                <div className="flex-1 text-sm">
                                    <p className="font-semibold text-text-1">{c.name}</p>
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-text-3 line-through">${c.oldPrice?.toFixed(2) || "N/A"}</span>
                                        <ArrowRight className="w-3 h-3 text-text-3 mt-0.5" />
                                        <span className="text-accent-mint font-bold">${c.newPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 text-sm">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPriceUpdates(priceCandidates.map(c => c.lineId))}>Todos</Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedPriceUpdates([])}>Ninguno</Button>
                    </div>
                </div>
            );
        }

        if (step === "templates") {
            return (
                <div className="space-y-4 py-4 px-1">
                    <p className="text-sm text-text-2">Agregaste nuevos productos en esta compra. ¿Deseas guardarlos en tus plantillas?</p>
                    <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
                        {newLines.map(line => {
                            const itemName = genericItemsMap[line.genericItemId]?.canonicalName || "Item";
                            const selections = templateSelections[line.id] || [];

                            return (
                                <div key={line.id} className="border p-3 rounded-lg space-y-2">
                                    <p className="font-semibold text-text-1 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-accent-gold" />
                                        {itemName}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {templates.map(t => {
                                            const isUsed = usedTemplateIds.has(t.id);
                                            return (
                                                <div key={t.id} className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={selections.includes(t.id)}
                                                        onCheckedChange={() => handleTemplateToggle(line.id, t.id)}
                                                    />
                                                    <span className={cn("text-sm truncate", isUsed ? "font-medium text-accent-violet" : "text-text-2")}>
                                                        {t.name} {isUsed && "(Usada)"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (step === "processing") {
            return (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 px-1">
                    <Loader2 className="w-10 h-10 animate-spin text-accent-violet" />
                    <p className="text-text-2">Finalizando compra...</p>
                </div>
            );
        }
    };

    const getTitle = () => {
        if (step === "totals") return "Finalizar: Totales";
        if (step === "prices") return "Actualizar Precios";
        if (step === "templates") return "Actualizar Plantillas";
        return "Procesando";
    };

    return (
        <ResponsiveDialog open={open} onOpenChange={step === "processing" ? () => { } : onOpenChange}>
            <ResponsiveDialogContent className="max-w-md sm:max-w-lg bg-bg-1 text-text-1 border-border">
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle>{getTitle()}</ResponsiveDialogTitle>
                </ResponsiveDialogHeader>

                {renderStepContent()}

                {step !== "processing" && (
                    <ResponsiveDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        {step !== "totals" ? (
                            <Button variant="ghost" onClick={handleBack} disabled={loading} className="flex-1 sm:flex-none">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 sm:flex-none">
                                Cancelar
                            </Button>
                        )}

                        <Button onClick={handleNext} disabled={!canGoNext() || loading} className="bg-accent-violet flex-1 sm:flex-none">
                            {step === "templates" || (step === "prices" && !hasNewItems) || (step === "totals" && priceCandidates.length === 0 && !hasNewItems) ? (
                                <>Confirmar <Check className="w-4 h-4 ml-2" /></>
                            ) : (
                                <>Siguiente <ArrowRight className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </ResponsiveDialogFooter>
                )}
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}

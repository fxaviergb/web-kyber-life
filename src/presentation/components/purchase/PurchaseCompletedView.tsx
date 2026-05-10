"use client";

import { Purchase, PurchaseLine, GenericItem, Unit, BrandProduct } from "@/domain/entities";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, ArrowLeft } from "lucide-react";
import { deletePurchaseAction } from "@/app/actions/purchase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit2, Plus } from "lucide-react";
import { 
    ResponsiveDialog, 
    ResponsiveDialogContent, 
    ResponsiveDialogHeader, 
    ResponsiveDialogTitle,
    ResponsiveDialogFooter
} from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePurchaseAction, updateLineJsonAction } from "@/app/actions/purchase";

interface PurchaseCompletedViewProps {
    purchase: Purchase;
    lines: PurchaseLine[];
    genericItemsMap: Record<string, GenericItem>;
    brandOptionsMap: Record<string, BrandProduct[]>;
    units: Unit[];
}

export function PurchaseCompletedView({
    purchase,
    lines,
    genericItemsMap,
    brandOptionsMap,
    units
}: PurchaseCompletedViewProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    
    // Totals edit state
    const [editingTotals, setEditingTotals] = useState(false);
    const [totalsForm, setTotalsForm] = useState({
        subtotal: purchase.subtotal || "",
        discount: purchase.discount || "",
        tax: purchase.tax || "",
        totalPaid: purchase.totalPaid || "",
    });
    const [savingTotals, setSavingTotals] = useState(false);

    // Line edit state
    const [editingLine, setEditingLine] = useState<PurchaseLine | null>(null);
    const [lineForm, setLineForm] = useState({
        qty: "",
        unitPrice: "",
        checked: false,
    });
    const [savingLine, setSavingLine] = useState(false);

    const handleSaveTotals = async () => {
        setSavingTotals(true);
        const updates = {
            subtotal: totalsForm.subtotal ? parseFloat(totalsForm.subtotal as string) : null,
            discount: totalsForm.discount ? parseFloat(totalsForm.discount as string) : null,
            tax: totalsForm.tax ? parseFloat(totalsForm.tax as string) : null,
            totalPaid: totalsForm.totalPaid ? parseFloat(totalsForm.totalPaid as string) : null,
        };
        const res = await updatePurchaseAction(purchase.id, updates);
        setSavingTotals(false);
        if (res.error) {
            alert(res.error);
        } else {
            setEditingTotals(false);
        }
    };

    const handleSaveLine = async () => {
        if (!editingLine) return;
        setSavingLine(true);
        const updates = {
            qty: lineForm.qty ? parseFloat(lineForm.qty as string) : 0,
            unitPrice: lineForm.unitPrice ? parseFloat(lineForm.unitPrice as string) : null,
            checked: lineForm.checked
        };
        const res = await updateLineJsonAction(editingLine.id, updates);
        setSavingLine(false);
        if (res.error) {
            alert(res.error);
        } else {
            setEditingLine(null);
        }
    };

    const openLineEdit = (line: PurchaseLine) => {
        setLineForm({
            qty: line.qty?.toString() || "",
            unitPrice: line.unitPrice?.toString() || "",
            checked: line.checked
        });
        setEditingLine(line);
    };

    const handleDelete = async () => {
        // Confirmation handled by Modal
        setDeleting(true);
        const res = await deletePurchaseAction(purchase.id);
        if (res.error) {
            alert(res.error);
            setDeleting(false);
        } else {
            // Redirect happens in action or triggers router refresh
            // But action returns success, let's manual redirect just in case or rely on revalidate.
            // Action redirects? Wait, deletePurchaseAction revalidates /market/purchases.
            router.push("/market/purchases");
        }
    };

    const boughtLines = lines.filter(l => l.checked);
    const ignoredLines = lines.filter(l => !l.checked);

    // Helper to get product name
    const getProductName = (line: PurchaseLine) => {
        if (line.brandProductId) {
            // Find brand product in map (need to search all lists?)
            // Optimization: We assume brandOptionsMap contains it if passed.
            // Usually brandOptionsMap is Keyed by GenericItemId.
            const brandList = brandOptionsMap[line.genericItemId] || [];
            const bp = brandList.find(b => b.id === line.brandProductId);
            if (bp) return `${bp.brand} ${bp.presentation}`;
        }
        return genericItemsMap[line.genericItemId]?.canonicalName || "Producto desconocido";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Financial Summary */}
            <Card className="bg-bg-2 border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-accent-mint flex items-center gap-2">
                        <span>Compra Finalizada</span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setEditingTotals(true)} className="h-8 w-8">
                        <Edit2 className="w-4 h-4 text-text-3" />
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm md:text-base">
                    <div className="text-text-2">Subtotal</div>
                    <div className="text-right text-text-1 font-bold">
                        {purchase.subtotal ? `$${purchase.subtotal.toFixed(2)}` : "--"}
                    </div>
                    <div className="text-text-2">Descuentos</div>
                    <div className="text-right text-accent-coral font-bold">
                        {purchase.discount ? `-$${purchase.discount.toFixed(2)}` : "--"}
                    </div>
                    <div className="text-text-2">Impuestos</div>
                    <div className="text-right text-text-1 font-bold">
                        {purchase.tax ? `$${purchase.tax.toFixed(2)}` : "--"}
                    </div>
                    <div className="border-t border-border col-span-2 my-2"></div>
                    <div className="text-lg font-bold text-accent-gold">Total Pagado</div>
                    <div className="text-lg font-bold text-right text-accent-gold">
                        ${purchase.totalPaid?.toFixed(2)}
                    </div>
                </CardContent>
            </Card>

            {/* Items List */}
            <div>
                <h3 className="text-lg font-semibold text-text-2 mb-4">Productos Comprados ({boughtLines.length})</h3>
                <div className="space-y-2">
                    {boughtLines.map(line => (
                        <div 
                            key={line.id} 
                            onClick={() => openLineEdit(line)}
                            className="p-3 bg-bg-1 border border-border rounded-lg flex justify-between items-center group cursor-pointer hover:bg-bg-2 transition-colors"
                        >
                            <div>
                                <p className="font-bold text-text-1">{getProductName(line)}</p>
                                <p className="text-xs text-text-3">
                                    {line.qty} {units.find(u => u.id === line.unitId)?.symbol || "u"}
                                </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <p className="font-bold text-text-1">${line.unitPrice?.toFixed(2)}</p>
                                <Edit2 className="w-4 h-4 text-text-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ))}
                    {boughtLines.length === 0 && <p className="text-text-3 italic">Ningun producto comprado.</p>}
                </div>
            </div>

            {/* Ignored Items (Optional to show?) */}
            {ignoredLines.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-text-3 mb-4 opacity-70">No Comprados</h3>
                    <div className="space-y-2 opacity-60">
                        {ignoredLines.map(line => (
                            <div 
                                key={line.id} 
                                onClick={() => openLineEdit(line)}
                                className="p-3 bg-bg-1 border border-border rounded-lg flex justify-between items-center group cursor-pointer hover:bg-bg-2 transition-colors"
                            >
                                <p className="font-medium text-text-2">{genericItemsMap[line.genericItemId]?.canonicalName}</p>
                                <Edit2 className="w-4 h-4 text-text-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-8 border-t border-border flex justify-between">
                <Button variant="ghost" onClick={() => router.push('/market/purchases')} disabled={deleting}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={deleting}>
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Compra
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-bg-2 border-border text-text-1">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription className="text-text-3">
                                Esta acción eliminará permanentemente la compra y todos sus registros. No se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-bg-1 text-text-2 hover:bg-bg-3 hover:text-white border-border">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">
                                {deleting ? "Eliminando..." : "Sí, Eliminar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {/* Totals Edit Dialog */}
            <ResponsiveDialog open={editingTotals} onOpenChange={setEditingTotals}>
                <ResponsiveDialogContent className="bg-bg-2 border-border text-text-1">
                    <ResponsiveDialogHeader>
                        <ResponsiveDialogTitle>Editar Totales</ResponsiveDialogTitle>
                    </ResponsiveDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subtotal">Subtotal</Label>
                            <Input
                                id="subtotal"
                                type="number"
                                step="0.01"
                                value={totalsForm.subtotal}
                                onChange={(e) => setTotalsForm({ ...totalsForm, subtotal: e.target.value })}
                                className="bg-bg-1 border-border text-text-1"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discount">Descuento</Label>
                            <Input
                                id="discount"
                                type="number"
                                step="0.01"
                                value={totalsForm.discount}
                                onChange={(e) => setTotalsForm({ ...totalsForm, discount: e.target.value })}
                                className="bg-bg-1 border-border text-text-1"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tax">Impuestos</Label>
                            <Input
                                id="tax"
                                type="number"
                                step="0.01"
                                value={totalsForm.tax}
                                onChange={(e) => setTotalsForm({ ...totalsForm, tax: e.target.value })}
                                className="bg-bg-1 border-border text-text-1"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="totalPaid">Total Pagado</Label>
                            <Input
                                id="totalPaid"
                                type="number"
                                step="0.01"
                                value={totalsForm.totalPaid}
                                onChange={(e) => setTotalsForm({ ...totalsForm, totalPaid: e.target.value })}
                                className="bg-bg-1 border-border text-text-1"
                            />
                        </div>
                    </div>
                    <ResponsiveDialogFooter>
                        <Button variant="ghost" onClick={() => setEditingTotals(false)} disabled={savingTotals}>Cancelar</Button>
                        <Button onClick={handleSaveTotals} disabled={savingTotals}>
                            {savingTotals ? "Guardando..." : "Guardar"}
                        </Button>
                    </ResponsiveDialogFooter>
                </ResponsiveDialogContent>
            </ResponsiveDialog>

            {/* Line Edit Dialog */}
            <ResponsiveDialog open={!!editingLine} onOpenChange={(open) => !open && setEditingLine(null)}>
                <ResponsiveDialogContent className="bg-bg-2 border-border text-text-1">
                    <ResponsiveDialogHeader>
                        <ResponsiveDialogTitle>
                            Editar {editingLine ? genericItemsMap[editingLine.genericItemId]?.canonicalName : ""}
                        </ResponsiveDialogTitle>
                    </ResponsiveDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2 flex items-center justify-between">
                            <Label htmlFor="lineChecked">Comprado</Label>
                            <input 
                                type="checkbox"
                                id="lineChecked"
                                checked={lineForm.checked}
                                onChange={(e) => setLineForm({ ...lineForm, checked: e.target.checked })}
                                className="h-5 w-5 rounded border-border bg-bg-1 text-accent-mint focus:ring-accent-mint"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lineQty">Cantidad</Label>
                            <Input
                                id="lineQty"
                                type="number"
                                step="0.01"
                                value={lineForm.qty}
                                onChange={(e) => setLineForm({ ...lineForm, qty: e.target.value })}
                                className="bg-bg-1 border-border text-text-1"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="linePrice">Precio Unitario</Label>
                            <Input
                                id="linePrice"
                                type="number"
                                step="0.01"
                                value={lineForm.unitPrice}
                                onChange={(e) => setLineForm({ ...lineForm, unitPrice: e.target.value })}
                                className="bg-bg-1 border-border text-text-1"
                            />
                        </div>
                    </div>
                    <ResponsiveDialogFooter>
                        <Button variant="ghost" onClick={() => setEditingLine(null)} disabled={savingLine}>Cancelar</Button>
                        <Button onClick={handleSaveLine} disabled={savingLine}>
                            {savingLine ? "Guardando..." : "Guardar"}
                        </Button>
                    </ResponsiveDialogFooter>
                </ResponsiveDialogContent>
            </ResponsiveDialog>
        </div>
    );
}

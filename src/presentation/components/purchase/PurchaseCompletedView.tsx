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
                <CardHeader>
                    <CardTitle className="text-accent-mint flex items-center gap-2">
                        <span>Compra Finalizada</span>
                    </CardTitle>
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
                        <div key={line.id} className="p-3 bg-bg-1 border border-border rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-text-1">{getProductName(line)}</p>
                                <p className="text-xs text-text-3">
                                    {line.qty} {units.find(u => u.id === line.unitId)?.symbol || "u"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-text-1">${line.unitPrice?.toFixed(2)}</p>
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
                            <div key={line.id} className="p-3 bg-bg-1 border border-border rounded-lg flex justify-between items-center">
                                <p className="font-medium text-text-2">{genericItemsMap[line.genericItemId]?.canonicalName}</p>
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
        </div>
    );
}

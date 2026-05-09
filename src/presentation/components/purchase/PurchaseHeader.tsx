"use client";

import { useState } from "react";
import { Supermarket } from "@/domain/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Pencil, Loader2 } from "lucide-react";
import { updatePurchaseAction } from "@/app/actions/purchase";

interface PurchaseHeaderProps {
    purchaseId: string;
    currentSupermarketId: string | null;
    currentDate: string;
    supermarkets: Supermarket[];
}

export function PurchaseHeader({ purchaseId, currentSupermarketId, currentDate, supermarkets }: PurchaseHeaderProps) {
    const [open, setOpen] = useState(false);
    const [supermarketId, setSupermarketId] = useState(currentSupermarketId || "");
    const [date, setDate] = useState(currentDate.split('T')[0]);
    const [loading, setLoading] = useState(false);

    const currentSupermarket = supermarkets.find(s => s.id === currentSupermarketId);

    async function handleSave() {
        setLoading(true);
        // Provide the date as a full ISO string to avoid parsing issues
        // The HTML date input gives YYYY-MM-DD
        const dateObj = new Date(date);
        
        await updatePurchaseAction(purchaseId, {
            supermarketId: supermarketId || null,
            date: dateObj.toISOString()
        });
        
        setLoading(false);
        setOpen(false);
    }

    return (
        <>
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Lista de Compras</h1>
                    <p className="text-text-3">
                        {currentSupermarket ? `${currentSupermarket.name} - ` : ''}
                        {new Date(currentDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </p>
                </div>
                <button 
                    onClick={() => setOpen(true)}
                    className="p-2 text-text-3 hover:text-accent-violet hover:bg-accent-violet/10 rounded-full transition-colors"
                    aria-label="Editar detalles de la compra"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>

            <ResponsiveDialog open={open} onOpenChange={setOpen}>
                <ResponsiveDialogContent className="bg-bg-1 border-border sm:max-w-[425px]">
                    <ResponsiveDialogHeader>
                        <ResponsiveDialogTitle>Editar Detalles</ResponsiveDialogTitle>
                    </ResponsiveDialogHeader>
                    <div className="space-y-4 py-4 px-4">
                        <div className="space-y-2">
                            <Label className="text-text-1">Supermercado</Label>
                            <select 
                                className="w-full h-10 rounded-md border border-input bg-bg-0 px-3 py-2 text-sm text-text-1 focus:ring-2 focus:ring-accent-violet outline-none"
                                value={supermarketId}
                                onChange={(e) => setSupermarketId(e.target.value)}
                            >
                                <option value="">Sin supermercado</option>
                                {supermarkets.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-text-1">Fecha</Label>
                            <Input 
                                type="date"
                                className="bg-bg-0 border-input text-text-1 focus-visible:ring-accent-violet w-full"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <ResponsiveDialogFooter className="px-4 pb-4">
                        <div className="flex gap-2 w-full justify-between items-center border-t border-border pt-4">
                            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-text-3 hover:text-text-1">Cancelar</Button>
                            <Button onClick={handleSave} disabled={loading} className="bg-accent-violet text-white hover:bg-accent-violet/90 shadow-lg shadow-accent-violet/20">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                            </Button>
                        </div>
                    </ResponsiveDialogFooter>
                </ResponsiveDialogContent>
            </ResponsiveDialog>
        </>
    );
}

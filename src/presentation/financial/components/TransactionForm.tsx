"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransactionAction } from "@/app/actions/financial-transactions";
import { FinancialTransactionType } from "@/domain/entities/financial";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";

export function TransactionForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [type, setType] = useState<FinancialTransactionType>("EXPENSE");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [merchant, setMerchant] = useState("");
    const [notes, setNotes] = useState("");

    // Load draft on mount
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const drafts = await financialOfflineStore.drafts.getAll();
                const latestDraft = drafts.length > 0 ? drafts[drafts.length - 1] : null;
                
                if (latestDraft) {
                    const data = latestDraft.data as any;
                    if (data.type) setType(data.type);
                    if (data.amount) setAmount(data.amount.toString());
                    if (data.date) setDate(data.date.split("T")[0]);
                    if (data.merchant) setMerchant(data.merchant);
                    if (data.notes) setNotes(data.notes);
                }
            } catch (e) {
                console.error("Failed to load transaction draft from offline store", e);
            }
        };
        loadDraft();
    }, []);

    // Save draft when values change
    useEffect(() => {
        const saveDraft = async () => {
            try {
                // To avoid storing multiple drafts for the same form session, we might want to 
                // just keep one draft or clear existing before adding, but for simplicity we'll
                // clear all and add the current one as the unique draft for this form instance.
                await financialOfflineStore.drafts.clear();
                if (amount || merchant || notes) {
                    await financialOfflineStore.drafts.add("draft_transaction", {
                        type,
                        amount: Number(amount) || 0,
                        date: new Date(date).toISOString(),
                        merchant,
                        notes,
                        status: "MANUAL",
                        currency: "USD",
                    });
                }
            } catch (e) {
                console.error("Failed to save draft to offline store", e);
            }
        };
        
        // Use a small timeout to debounce saving
        const timeoutId = setTimeout(saveDraft, 500);
        return () => clearTimeout(timeoutId);
    }, [type, amount, date, merchant, notes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Ingresa un monto válido");
            return;
        }

        setIsSubmitting(true);
        
        const transactionData = {
            type,
            status: "MANUAL" as const,
            amount: Number(amount),
            currency: "USD",
            date: new Date(date).toISOString(),
            merchant: merchant || undefined,
            notes: notes || undefined,
        };

        if (!navigator.onLine) {
            try {
                await financialOfflineStore.drafts.add(`draft_${Date.now()}`, transactionData);
                toast.success("Guardado localmente. Se sincronizará cuando tengas conexión.");
                router.push("/financial/transactions");
                router.refresh();
            } catch (error) {
                toast.error("Error al guardar localmente");
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        try {
            const result = await createTransactionAction(transactionData);

            if (result.success) {
                toast.success("Transacción creada correctamente");
                await financialOfflineStore.drafts.clear();
                router.push("/financial/transactions");
                router.refresh();
            } else {
                toast.error(result.error || "No se pudo crear la transacción");
            }
        } catch (error) {
            // Handle network errors even if navigator.onLine was true
            try {
                await financialOfflineStore.drafts.add(`draft_${Date.now()}`, transactionData);
                toast.success("Error de red. Guardado localmente para sincronización futura.");
                router.push("/financial/transactions");
                router.refresh();
            } catch (e) {
                toast.error("Ocurrió un error inesperado y no se pudo guardar localmente.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Nueva transacción</CardTitle>
                <CardDescription>Registra manualmente una nueva transacción financiera.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de transacción</Label>
                        <Select value={type} onValueChange={(value) => setType(value as FinancialTransactionType)}>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EXPENSE">Gasto</SelectItem>
                                <SelectItem value="INCOME">Ingreso</SelectItem>
                                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                <SelectItem value="SUBSCRIPTION">Suscripción</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto (USD)</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="0.00" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input 
                            id="date" 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="merchant">Comercio / descripción</Label>
                        <Input 
                            id="merchant" 
                            type="text" 
                            placeholder="Ej.: Amazon, Uber, Salario" 
                            value={merchant}
                            onChange={(e) => setMerchant(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Input 
                            id="notes" 
                            type="text" 
                            placeholder="Detalles adicionales..." 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Guardar transacción"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

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
        const draft = localStorage.getItem("financial_transaction_draft");
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.type) setType(parsed.type);
                if (parsed.amount) setAmount(parsed.amount);
                if (parsed.date) setDate(parsed.date);
                if (parsed.merchant) setMerchant(parsed.merchant);
                if (parsed.notes) setNotes(parsed.notes);
            } catch (e) {
                console.error("Failed to parse transaction draft", e);
            }
        }
    }, []);

    // Save draft when values change
    useEffect(() => {
        const draft = { type, amount, date, merchant, notes };
        localStorage.setItem("financial_transaction_draft", JSON.stringify(draft));
    }, [type, amount, date, merchant, notes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Ingresa un monto válido");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createTransactionAction({
                type,
                status: "MANUAL",
                amount: Number(amount),
                currency: "USD",
                date: new Date(date).toISOString(),
                merchant: merchant || undefined,
                notes: notes || undefined,
            });

            if (result.success) {
                toast.success("Transaccion creada correctamente");
                localStorage.removeItem("financial_transaction_draft");
                router.push("/financial/transactions");
                router.refresh();
            } else {
                toast.error(result.error || "No se pudo crear la transacción");
            }
        } catch {
            toast.error("Ocurrio un error inesperado");
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

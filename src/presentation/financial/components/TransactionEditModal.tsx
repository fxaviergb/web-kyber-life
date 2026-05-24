"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTransactionAction } from "@/app/actions/financial-transactions";
import { FinancialTransaction, FinancialTransactionType } from "@/domain/entities/financial";

interface TransactionEditModalProps {
    transaction: FinancialTransaction;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransactionEditModal({
    transaction,
    isOpen,
    onClose,
    onSuccess,
}: TransactionEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [type, setType] = useState<FinancialTransactionType>(transaction.type);
    const [amount, setAmount] = useState(transaction.amount.toString());
    const [date, setDate] = useState(new Date(transaction.date).toISOString().split("T")[0]);
    const [merchant, setMerchant] = useState(transaction.merchant || "");
    const [notes, setNotes] = useState(transaction.notes || "");
    const [status, setStatus] = useState<FinancialTransaction['status']>(transaction.status);
    const [currency, setCurrency] = useState(transaction.currency || "USD");

    useEffect(() => {
        if (isOpen) {
            setType(transaction.type);
            setAmount(transaction.amount.toString());
            setDate(new Date(transaction.date).toISOString().split("T")[0]);
            setMerchant(transaction.merchant || "");
            setNotes(transaction.notes || "");
            setStatus(transaction.status);
            setCurrency(transaction.currency || "USD");
        }
    }, [isOpen, transaction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Ingresa un monto válido");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await updateTransactionAction(transaction.id!, {
                type,
                amount: Number(amount),
                currency,
                status,
                date: new Date(date).toISOString(),
                merchant: merchant || null,
                notes: notes || null,
            });

            if (result.success) {
                toast.success("Transacción actualizada correctamente");
                onSuccess();
                onClose();
            } else {
                toast.error(result.error || "No se pudo actualizar la transacción");
            }
        } catch {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Transacción</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de la transacción.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                                <SelectItem value="PAYMENT">Pago</SelectItem>
                                <SelectItem value="REFUND">Reembolso</SelectItem>
                                <SelectItem value="WITHDRAWAL">Retiro</SelectItem>
                                <SelectItem value="DEPOSIT">Depósito</SelectItem>
                                <SelectItem value="FEE">Comisión</SelectItem>
                                <SelectItem value="TAX">Impuesto</SelectItem>
                                <SelectItem value="OTHER">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as FinancialTransaction['status'])}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DETECTED">Detectada</SelectItem>
                                <SelectItem value="REVIEWED">Revisada</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                                <SelectItem value="REJECTED">Rechazada</SelectItem>
                                <SelectItem value="ARCHIVED">Archivada</SelectItem>
                                <SelectItem value="MANUAL">Manual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto</Label>
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
                            <Label htmlFor="currency">Moneda</Label>
                            <Input
                                id="currency"
                                type="text"
                                maxLength={3}
                                placeholder="USD"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                                required
                            />
                        </div>
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

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

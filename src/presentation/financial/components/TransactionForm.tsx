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
import { getInstitutionsAction, getAccountsAction, getCategoriesAction } from "@/app/actions/financial-settings";
import { FinancialTransactionType } from "@/domain/entities/financial";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Building2, Landmark, FolderGit2, FileText } from "lucide-react";

export function TransactionForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [type, setType] = useState<FinancialTransactionType>("EXPENSE");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [institutionName, setInstitutionName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [categoryName, setCategoryName] = useState("");

    const [institutionsList, setInstitutionsList] = useState<string[]>([]);
    const [accountsList, setAccountsList] = useState<string[]>([]);
    const [categoriesList, setCategoriesList] = useState<string[]>([]);

    // Load draft and lists on mount
    useEffect(() => {
        const loadDraftAndData = async () => {
            try {
                // Fetch settings for datalist
                const [instRes, accRes, catRes] = await Promise.all([
                    getInstitutionsAction(),
                    getAccountsAction(),
                    getCategoriesAction()
                ]);

                setInstitutionsList(instRes.map(i => i.name));
                setAccountsList(accRes.map(a => a.name));
                setCategoriesList(catRes.map(c => c.name));

                // Load draft
                const drafts = await financialOfflineStore.drafts.getAll();
                const latestDraft = drafts.length > 0 ? drafts[drafts.length - 1] : null;

                if (latestDraft) {
                    const data = latestDraft.data as any;
                    if (data.type) setType(data.type);
                    if (data.amount) setAmount(data.amount.toString());
                    if (data.description) setDescription(data.description);
                    if (data.date) setDate(data.date.split("T")[0]);
                    if (data.notes) setNotes(data.notes);
                    if (data.institutionName) setInstitutionName(data.institutionName);
                    if (data.accountName) setAccountName(data.accountName);
                    if (data.categoryName) setCategoryName(data.categoryName);
                }
            } catch (e) {
                console.error("Failed to load transaction draft or settings", e);
            }
        };
        loadDraftAndData();
    }, []);

    // Save draft when values change
    useEffect(() => {
        const saveDraft = async () => {
            try {
                // To avoid storing multiple drafts for the same form session, we might want to 
                // just keep one draft or clear existing before adding, but for simplicity we'll
                // clear all and add the current one as the unique draft for this form instance.
                await financialOfflineStore.drafts.clear();
                if (amount || institutionName || notes || description) {
                    await financialOfflineStore.drafts.add("draft_transaction", {
                        type,
                        amount: Number(amount) || 0,
                        description,
                        date: new Date(date).toISOString(),
                        notes,
                        institutionName,
                        accountName,
                        categoryName,
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
    }, [type, amount, description, date, notes, institutionName, accountName, categoryName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!institutionName || institutionName.trim() === "") {
            toast.error("La institución es requerida");
            return;
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Ingresa un monto válido mayor a 0");
            return;
        }

        if (!date) {
            toast.error("La fecha es requerida");
            return;
        }

        if (!type) {
            toast.error("El tipo de transacción es requerido");
            return;
        }

        setIsSubmitting(true);

        const transactionData = {
            type,
            status: "MANUAL" as const,
            amount: Number(amount),
            currency: "USD",
            description: description.trim() || undefined,
            date: new Date(date).toISOString(),
            notes: notes || undefined,
            institutionName: institutionName || undefined,
            accountName: accountName || undefined,
            categoryName: categoryName || undefined,
        };

        if (!navigator.onLine) {
            try {
                await financialOfflineStore.drafts.add(`draft_${Date.now()}`, transactionData);
                toast.success("Guardado localmente. Se sincronizará cuando tengas conexión.", { id: "tx-offline-success" });
                router.push("/financial/transactions");
                router.refresh();
            } catch (error) {
                toast.error("Error al guardar localmente", { id: "tx-offline-error" });
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        try {
            const result = await createTransactionAction(transactionData);

            if (result.success) {
                toast.success("Transacción creada correctamente", { id: "tx-create-success" });
                await financialOfflineStore.drafts.clear();
                router.push("/financial/transactions");
                router.refresh();
            } else {
                toast.error(result.error || "No se pudo crear la transacción", { id: "tx-create-error" });
            }
        } catch (error) {
            // Handle network errors even if navigator.onLine was true
            try {
                await financialOfflineStore.drafts.add(`draft_${Date.now()}`, transactionData);
                toast.success("Error de red. Guardado localmente para sincronización futura.", { id: "tx-network-fallback-success" });
                router.push("/financial/transactions");
                router.refresh();
            } catch (e) {
                toast.error("Ocurrió un error inesperado y no se pudo guardar localmente.", { id: "tx-network-fallback-error" });
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
                        <Label htmlFor="description" className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-violet-500" />
                            Descripción
                        </Label>
                        <Input
                            id="description"
                            name="description"
                            type="text"
                            placeholder="Ej.: Compra en supermercado, Pago de servicio..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="institutionName" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            Institución
                        </Label>
                        <AutocompleteInput
                            id="institutionName"
                            value={institutionName}
                            onChange={setInstitutionName}
                            options={institutionsList}
                            className="bg-background border-border/50"
                            placeholder="Ej. Banco de Chile, Sodexo, Amazon..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountName" className="flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-emerald-500" />
                            Cuenta
                        </Label>
                        <AutocompleteInput
                            id="accountName"
                            value={accountName}
                            onChange={setAccountName}
                            options={accountsList}
                            className="bg-background border-border/50"
                            placeholder="Ej.: Ahorros Múltiple, Tarjeta Visa"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="categoryName" className="flex items-center gap-2">
                            <FolderGit2 className="w-4 h-4 text-amber-500" />
                            Categoría
                        </Label>
                        <AutocompleteInput
                            id="categoryName"
                            value={categoryName}
                            onChange={setCategoryName}
                            options={categoriesList}
                            className="bg-background border-border/50"
                            placeholder="Ej.: Alimentación, Transporte, Servicios"
                        />
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo de transacción</Label>
                            <Select value={type} onValueChange={(value) => setType(value as FinancialTransactionType)}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Gasto</SelectItem>
                                    <SelectItem value="INCOME">Ingreso</SelectItem>
                                    <SelectItem value="TRANSFER">Transferencias propias</SelectItem>
                                    <SelectItem value="WITHDRAWAL">Retiro</SelectItem>
                                    <SelectItem value="SUBSCRIPTION">Suscripción</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto (USD)</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>



                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas (opcional)</Label>
                            <Input
                                id="notes"
                                name="notes"
                                type="text"
                                placeholder="Detalles adicionales..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
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

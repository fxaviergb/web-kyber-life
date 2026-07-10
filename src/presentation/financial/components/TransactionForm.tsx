"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransactionAction } from "@/app/actions/financial-transactions";
import { getInstitutionsAction, getAccountsAction, getCategoriesAction, getInstitutionTypesAction, updateInstitutionAction } from "@/app/actions/financial-settings";
import { FinancialTransactionType, FinancialInstitution, FinancialInstitutionType } from "@/domain/entities/financial";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { InstitutionEditDialog, type PendingInstitutionEdit } from "./InstitutionEditDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toDateTimeLocalValue, isoToWallClockInput, wallClockInputToISO } from "@/lib/date-range";
import { Building2, Landmark, FolderGit2, FileText, Pencil, CreditCard } from "lucide-react";

/** Types for which "paid with credit card" is a meaningful, editable flag. */
const CREDIT_ELIGIBLE_TYPES: readonly FinancialTransactionType[] = ["EXPENSE", "SUBSCRIPTION"];

// Lowercase type labels for natural-reading auto notes.
const NOTE_TYPE_LABELS: Record<string, string> = {
    EXPENSE: "gasto",
    INCOME: "ingreso",
    TRANSFER: "transferencia",
    WITHDRAWAL: "retiro",
    SUBSCRIPTION: "suscripción",
};

/** Format a datetime-local string as "DD/MM/YYYY HH:mm". */
function formatNotesDateTime(dtLocal: string): string {
    if (!dtLocal) return "";
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AutoNotesInput {
    type: string;
    description: string;
    institutionName: string;
    amount: string;
    date: string;
    accountName: string;
}

/**
 * Build the auto-generated notes sentence from the current form fields.
 * Clauses are appended only when their value exists, so the sentence stays
 * clean while the form is being filled. The "desde la cuenta ..." clause is
 * included only when an account/card has been entered.
 */
function buildAutoNotes(p: AutoNotesInput): string {
    const typeLabel = NOTE_TYPE_LABELS[p.type] ?? p.type.toLowerCase();
    let s = `Registro de ${typeLabel}`;
    if (p.description.trim()) s += ` por ${p.description.trim()}`;
    if (p.institutionName.trim()) s += ` en ${p.institutionName.trim()}`;
    if (p.amount && Number(p.amount) > 0) s += ` por un monto de $${p.amount}`;
    const dateStr = formatNotesDateTime(p.date);
    if (dateStr) s += ` el ${dateStr}`;
    if (p.accountName.trim()) s += ` desde la cuenta ${p.accountName.trim()}`;
    return s;
}

export function TransactionForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [type, setType] = useState<FinancialTransactionType>("EXPENSE");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(toDateTimeLocalValue(new Date()));
    const [notes, setNotes] = useState("");
    // Whether the user has manually customised the notes (stops auto-generation).
    const [notesEdited, setNotesEdited] = useState(false);
    const [institutionName, setInstitutionName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [paidWithCredit, setPaidWithCredit] = useState(false);

    const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
    const [institutionTypes, setInstitutionTypes] = useState<FinancialInstitutionType[]>([]);
    const [accountsList, setAccountsList] = useState<string[]>([]);
    const [categoriesList, setCategoriesList] = useState<string[]>([]);

    // Institution inline-edit (staged; persisted on submit).
    const [pendingInstitutionEdit, setPendingInstitutionEdit] = useState<PendingInstitutionEdit | null>(null);
    const [instDialogOpen, setInstDialogOpen] = useState(false);

    const institutionNames = useMemo(
        () => institutions.filter(i => !i.isDeleted).map(i => i.name),
        [institutions],
    );

    // Load draft and lists on mount
    useEffect(() => {
        const loadDraftAndData = async () => {
            try {
                // Fetch settings for datalist
                const [instRes, accRes, catRes, typesRes] = await Promise.all([
                    getInstitutionsAction(),
                    getAccountsAction(),
                    getCategoriesAction(),
                    getInstitutionTypesAction(),
                ]);

                setInstitutions(instRes);
                setAccountsList(accRes.map(a => a.name));
                setCategoriesList(catRes.map(c => c.name));
                setInstitutionTypes(typesRes);

                // Load draft
                const drafts = await financialOfflineStore.drafts.getAll();
                const latestDraft = drafts.length > 0 ? drafts[drafts.length - 1] : null;

                if (latestDraft) {
                    const data = latestDraft.data as any;
                    const draftType = data.type || "EXPENSE";
                    const draftAmount = data.amount ? data.amount.toString() : "";
                    const draftDescription = data.description || "";
                    const draftInstitution = data.institutionName || "";
                    const draftAccount = data.accountName || "";
                    const draftDate = isoToWallClockInput(data.date) ?? "";

                    if (data.type) setType(data.type);
                    if (data.amount) setAmount(draftAmount);
                    if (data.description) setDescription(draftDescription);
                    if (draftDate) setDate(draftDate);
                    if (data.institutionName) setInstitutionName(draftInstitution);
                    if (data.accountName) setAccountName(draftAccount);
                    if (data.categoryName) setCategoryName(data.categoryName);
                    if (data.paidWithCredit) setPaidWithCredit(Boolean(data.paidWithCredit));

                    if (data.notes) {
                        // Resume auto-generation only if the draft notes still match what
                        // we'd auto-generate; otherwise treat them as user-customised.
                        const draftAuto = buildAutoNotes({
                            type: draftType,
                            description: draftDescription,
                            institutionName: draftInstitution,
                            amount: draftAmount,
                            date: draftDate,
                            accountName: draftAccount,
                        });
                        setNotes(data.notes);
                        setNotesEdited(data.notes.trim() !== draftAuto.trim());
                    }
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
                        date: wallClockInputToISO(date),
                        notes,
                        institutionName,
                        accountName,
                        categoryName,
                        paidWithCredit,
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
    }, [type, amount, description, date, notes, institutionName, accountName, categoryName, paidWithCredit]);

    // Auto-generate the notes from the form fields until the user customises them.
    const autoNotes = useMemo(
        () => buildAutoNotes({ type, description, institutionName, amount, date, accountName }),
        [type, description, institutionName, amount, date, accountName],
    );

    useEffect(() => {
        if (!notesEdited) {
            setNotes(autoNotes);
        }
    }, [autoNotes, notesEdited]);

    // The existing institution matching the typed name (editable via the dialog).
    const matchedInstitution = useMemo(
        () => institutions.find(i => !i.isDeleted && i.name.trim().toLowerCase() === institutionName.trim().toLowerCase()) ?? null,
        [institutions, institutionName],
    );

    // The institution passed to the dialog, with any staged edit already applied.
    const institutionForDialog = useMemo(() => {
        if (!matchedInstitution) return null;
        if (pendingInstitutionEdit && pendingInstitutionEdit.id === matchedInstitution.id) {
            return {
                ...matchedInstitution,
                name: pendingInstitutionEdit.name,
                institutionTypeId: pendingInstitutionEdit.institutionTypeId,
                description: pendingInstitutionEdit.description,
            };
        }
        return matchedInstitution;
    }, [matchedInstitution, pendingInstitutionEdit]);

    const handleInstitutionEditApply = (edit: PendingInstitutionEdit) => {
        setPendingInstitutionEdit(edit);
        setInstitutionName(edit.name);
        // Optimistically reflect the staged rename so the field still matches.
        setInstitutions(prev => prev.map(i => i.id === edit.id
            ? { ...i, name: edit.name, institutionTypeId: edit.institutionTypeId, description: edit.description }
            : i));
    };

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
            // `date` is a literal wall-clock from the input; persist its digits as
            // UTC so it round-trips without a timezone shift (guarded non-empty above).
            date: wallClockInputToISO(date)!,
            notes: notes || undefined,
            institutionName: institutionName || undefined,
            accountName: accountName || undefined,
            categoryName: categoryName || undefined,
            paidWithCredit: CREDIT_ELIGIBLE_TYPES.includes(type) ? paidWithCredit : undefined,
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
            // Persist a staged institution edit first (deferred until save).
            if (pendingInstitutionEdit && institutionName.trim().toLowerCase() === pendingInstitutionEdit.name.trim().toLowerCase()) {
                try {
                    await updateInstitutionAction(pendingInstitutionEdit.id, {
                        name: pendingInstitutionEdit.name,
                        institutionTypeId: pendingInstitutionEdit.institutionTypeId,
                        description: pendingInstitutionEdit.description,
                    });
                } catch {
                    toast.error("No se pudo actualizar la institución", { id: "inst-update-error" });
                    setIsSubmitting(false);
                    return;
                }
            }

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
                        <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <AutocompleteInput
                                    id="institutionName"
                                    value={institutionName}
                                    onChange={setInstitutionName}
                                    options={institutionNames}
                                    className="bg-background border-border/50"
                                    placeholder="Ej. Banco de Chile, Sodexo, Amazon..."
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                disabled={!matchedInstitution}
                                title={matchedInstitution ? "Editar institución" : "Elige una institución existente para editar su registro"}
                                onClick={() => setInstDialogOpen(true)}
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar institución</span>
                            </Button>
                        </div>
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

                        {CREDIT_ELIGIBLE_TYPES.includes(type) && (
                            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-bg-primary/30 px-3 py-2.5">
                                <Checkbox
                                    id="paidWithCredit"
                                    checked={paidWithCredit}
                                    onCheckedChange={(checked) => setPaidWithCredit(checked === true)}
                                />
                                <Label htmlFor="paidWithCredit" className="flex items-center gap-2 font-normal cursor-pointer">
                                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                                    Pagado con tarjeta de crédito
                                </Label>
                            </div>
                        )}

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
                            <Label htmlFor="date">Fecha y hora</Label>
                            <Input
                                id="date"
                                name="date"
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>



                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas (opcional)</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                rows={4}
                                placeholder="Se completa automáticamente con los datos del formulario. Puedes editarlo libremente."
                                value={notes}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNotes(val);
                                    setNotesEdited(val.trim().length > 0);
                                }}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-3 pt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Guardar transacción"}
                    </Button>
                </CardFooter>
            </form>

            <InstitutionEditDialog
                open={instDialogOpen}
                onOpenChange={setInstDialogOpen}
                institution={institutionForDialog}
                types={institutionTypes}
                onApply={handleInstitutionEditApply}
            />
        </Card>
    );
}

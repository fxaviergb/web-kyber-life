"use client";

import { useState, useEffect, useMemo } from "react";
import { FinancialTransaction, FinancialInstitution, FinancialInstitutionType } from "@/domain/entities/financial";
import { getTransactionDisplayTitle } from "@/lib/financial-utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AuditTrail } from "./AuditTrail";
import { DuplicateResolver } from "./DuplicateResolver";
import { OriginStatsViewer } from "./OriginStatsViewer";
import { History, CalendarDays, Wallet, Edit2, Undo2, Check, Sparkles, Building2, Tags, FileText, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateTransactionAction, getUniqueTagsAction } from "@/app/actions/financial-transactions";
import { getInstitutionsAction, getAccountsAction, getCategoriesAction, getInstitutionTypesAction, updateInstitutionAction } from "@/app/actions/financial-settings";
import { InstitutionEditDialog, type PendingInstitutionEdit } from "./InstitutionEditDialog";
import { cn } from "@/lib/utils";
import { isoToWallClockInput, wallClockInputToISO } from "@/lib/date-range";
import { TagInput } from "@/components/ui/tag-input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Landmark, FolderGit2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
    EXPENSE: "Gasto",
    INCOME: "Ingreso",
    TRANSFER: "Transferencias propias",
    SUBSCRIPTION: "Suscripción",
    PAYMENT: "Pago",
    REFUND: "Reembolso",
    WITHDRAWAL: "Retiro",
    DEPOSIT: "Depósito",
    FEE: "Comisión",
    TAX: "Impuesto",
    OTHER: "Otro",
};

function getTypeBadgeVariant(type: string): "danger" | "success" | "warning" | "outline" {
    const INCOME_TYPES = ["INCOME", "DEPOSIT", "REFUND"];
    const EXPENSE_TYPES = ["EXPENSE", "PAYMENT", "WITHDRAWAL", "FEE", "TAX", "SUBSCRIPTION"];
    if (EXPENSE_TYPES.includes(type)) return "danger";
    if (INCOME_TYPES.includes(type)) return "success";
    if (type === "TRANSFER") return "warning";
    return "outline";
}

const STATUS_CONFIG: Record<string, { variant: "warning" | "success" | "danger" | "outline" | "default"; label: string }> = {
    DETECTED: { variant: "warning", label: "Nueva" },
    REVIEWED: { variant: "warning", label: "Revisada" },
    CONFIRMED: { variant: "success", label: "Confirmada" },
    REJECTED: { variant: "danger", label: "Rechazada" },
    DUPLICATE: { variant: "warning", label: "Duplicada" },
    ARCHIVED: { variant: "outline", label: "Archivada" },
    MANUAL: { variant: "outline", label: "Manual" },
    DELETED: { variant: "danger", label: "Eliminada" },
};

function formatAmount(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    // The stored `date` is a literal wall-clock value (tagged UTC), so format it
    // in UTC to show exactly what's stored — no device-timezone shift.
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    }).format(new Date(dateStr));
}

function extractContext(tx: FinancialTransaction): string {
    return tx.notes || "";
}

// ─── Component ────────────────────────────────────────────────
interface TransactionDetailClientProps {
    initialTransaction: FinancialTransaction;
}

export function TransactionDetailClient({ initialTransaction }: TransactionDetailClientProps) {
    const router = useRouter();
    const [transaction, setTransaction] = useState<FinancialTransaction>(initialTransaction);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
    const [institutionTypes, setInstitutionTypes] = useState<FinancialInstitutionType[]>([]);
    const [accountsList, setAccountsList] = useState<string[]>([]);
    const [categoriesList, setCategoriesList] = useState<string[]>([]);

    // Institution inline-edit (staged; persisted when the edit is confirmed).
    const [pendingInstitutionEdit, setPendingInstitutionEdit] = useState<PendingInstitutionEdit | null>(null);
    const [instDialogOpen, setInstDialogOpen] = useState(false);

    const institutionNames = useMemo(
        () => institutions.filter(i => !i.isDeleted).map(i => i.name),
        [institutions],
    );

    const [displayNames, setDisplayNames] = useState({
        institution: transaction.merchant || "",
        account: "",
        category: "",
    });

    useEffect(() => {
        const fetchTags = async () => {
            const res = await getUniqueTagsAction();
            if (res.success && Array.isArray(res.data)) {
                setSuggestions(res.data as string[]);
            }
        };
        const fetchSettings = async () => {
            try {
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

                const instName = instRes.find(i => i.id === transaction.institutionId)?.name || transaction.merchant || "";
                const accName = accRes.find(a => a.id === transaction.accountId)?.name || "";
                const catName = catRes.find(c => c.id === transaction.categoryId)?.name || "";

                setDisplayNames({
                    institution: instName,
                    account: accName,
                    category: catName,
                });

                setEditState(prev => ({
                    ...prev,
                    merchant: instName,
                    institutionName: instName,
                    accountName: accName,
                    categoryName: catName,
                }));
            } catch (e) {
                console.error("Failed to fetch settings", e);
            }
        };
        fetchTags();
        fetchSettings();
    }, [transaction]);

    const [editState, setEditState] = useState({
        description: transaction.description || "",
        merchant: transaction.merchant || "",
        institutionName: "",
        accountName: "",
        categoryName: "",
        type: transaction.type || "EXPENSE",
        amount: transaction.amount ?? null,
        date: isoToWallClockInput(transaction.date) ?? "",
        notes: extractContext(transaction),
        tags: transaction.tags || [],
    });

    const handleDuplicateResolved = () => {
        router.refresh();
    };

    const updateEditState = (field: keyof typeof editState, value: any) => {
        setEditState((prev) => ({ ...prev, [field]: value }));
    };

    const toggleEdit = () => {
        if (!isEditing) {
            setEditState({
                description: transaction.description || getTransactionDisplayTitle(transaction),
                merchant: displayNames.institution,
                institutionName: displayNames.institution,
                accountName: displayNames.account,
                categoryName: displayNames.category,
                type: transaction.type || "EXPENSE",
                amount: transaction.amount ?? null,
                date: isoToWallClockInput(transaction.date) ?? "",
                notes: extractContext(transaction),
                tags: transaction.tags || [],
            });
        }
        setIsEditing(!isEditing);
    };

    const matchedInstitution = useMemo(
        () => institutions.find(i => !i.isDeleted && i.name.trim().toLowerCase() === editState.institutionName.trim().toLowerCase()) ?? null,
        [institutions, editState.institutionName],
    );

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
        updateEditState("institutionName", edit.name);
        updateEditState("merchant", edit.name);
        setInstitutions(prev => prev.map(i => i.id === edit.id
            ? { ...i, name: edit.name, institutionTypeId: edit.institutionTypeId, description: edit.description }
            : i));
    };

    const handleSaveEdit = async () => {
        setIsLoading(true);
        try {
            // Persist a staged institution edit first (deferred until confirm).
            if (pendingInstitutionEdit && editState.institutionName.trim().toLowerCase() === pendingInstitutionEdit.name.trim().toLowerCase()) {
                await updateInstitutionAction(pendingInstitutionEdit.id, {
                    name: pendingInstitutionEdit.name,
                    institutionTypeId: pendingInstitutionEdit.institutionTypeId,
                    description: pendingInstitutionEdit.description,
                });
            }

            const res = await updateTransactionAction(transaction.id!, {
                description: editState.description.trim() || undefined,
                merchant: editState.merchant || editState.institutionName,
                institutionId: null, // Force backend to resolve by name
                institutionName: editState.institutionName || undefined,
                accountId: null,
                accountName: editState.accountName || undefined,
                categoryId: null,
                categoryName: editState.categoryName || undefined,
                type: editState.type,
                amount: editState.amount,
                date: wallClockInputToISO(editState.date),
                notes: editState.notes,
                tags: editState.tags,
            });
            if (res.success && res.data) {
                toast.success("Transacción actualizada exitosamente");
                setTransaction(res.data);
                setIsEditing(false);
                router.refresh(); // Refresh to update server components
                // Also update local suggestions if there are new tags
                const newTags = editState.tags.filter(t => !suggestions.includes(t));
                if (newTags.length > 0) {
                    setSuggestions(prev => [...prev, ...newTags]);
                }
            } else {
                toast.error(res.error || "Error al actualizar la transacción");
            }
        } catch {
            toast.error("Error inesperado al actualizar");
        } finally {
            setIsLoading(false);
        }
    };

    const isIncome = ["INCOME", "DEPOSIT", "REFUND"].includes(transaction.type);
    const statusCfg = STATUS_CONFIG[transaction.status] ?? STATUS_CONFIG.DETECTED;
    const typeLabel = TYPE_LABELS[transaction.type] ?? transaction.type;
    const typeBadgeVariant = getTypeBadgeVariant(transaction.type);
    const displayContext = extractContext(transaction);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

                <DuplicateResolver
                    transactionId={transaction.id!}
                    isPossibleDuplicate={transaction.possibleDuplicate && transaction.status !== 'DUPLICATE'}
                    onResolved={handleDuplicateResolved}
                />

                {/* ── Main Details Card ──────────────────────────────── */}
                <Card className={cn("shadow-sm border-border/50 overflow-hidden relative", isLoading && "opacity-60 pointer-events-none")}>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-primary/60 to-accent-primary/10" aria-hidden="true" />
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={statusCfg.variant} className="rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                                    {statusCfg.label}
                                </Badge>
                                {isEditing && (
                                    <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.14em] border-accent-primary/50 text-accent-primary">
                                        Modo Edición
                                    </Badge>
                                )}
                            </div>
                            {!isEditing && transaction.status !== "ARCHIVED" && (
                                <Button variant="ghost" size="sm" onClick={toggleEdit} className="text-muted-foreground h-8">
                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                            <div className="space-y-1 flex-1">
                                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="h-4 w-4" /> Institución
                                </div>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <AutocompleteInput
                                                id="headerInstitutionName"
                                                value={editState.institutionName}
                                                onChange={(val) => {
                                                    updateEditState("institutionName", val);
                                                    updateEditState("merchant", val);
                                                }}
                                                options={institutionNames}
                                                className="h-10 text-xl font-bold border-border/50 bg-bg-primary"
                                                placeholder="Nombre de la institución"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0 h-10 w-10"
                                            disabled={!matchedInstitution}
                                            title={matchedInstitution ? "Editar institución" : "Elige una institución existente para editar su registro"}
                                            onClick={() => setInstDialogOpen(true)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar institución</span>
                                        </Button>
                                    </div>
                                ) : (
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                        {displayNames.institution || transaction.merchant || "Sin institución"}
                                    </h2>
                                )}
                            </div>

                            <div className="shrink-0 text-left md:text-right">
                                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                                    Monto ({transaction.currency})
                                </div>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editState.amount ?? ""}
                                            onChange={(e) => updateEditState("amount", e.target.value ? parseFloat(e.target.value) : null)}
                                            className="h-10 w-32 text-right font-bold text-xl border-border/50 bg-bg-primary"
                                        />
                                    </div>
                                ) : (
                                    <div className={cn("text-3xl sm:text-4xl font-bold tracking-tighter", isIncome && "text-emerald-500")}>
                                        {isIncome ? "+" : ""}{formatAmount(transaction.amount, transaction.currency)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                <FileText className="h-4 w-4" /> Descripción
                            </div>
                            {isEditing ? (
                                <Input
                                    id="description"
                                    value={editState.description}
                                    onChange={(e) => updateEditState("description", e.target.value)}
                                    className="h-9 text-sm border-border/50 bg-bg-secondary"
                                    placeholder="Descripción de la transacción"
                                />
                            ) : (
                                <div className="text-sm font-medium">{getTransactionDisplayTitle(transaction)}</div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                    <CalendarDays className="h-4 w-4" /> Fecha
                                </div>
                                {isEditing ? (
                                    <Input
                                        type="datetime-local"
                                        value={editState.date}
                                        onChange={(e) => updateEditState("date", e.target.value)}
                                        className="h-9 text-sm border-border/50 bg-bg-secondary"
                                    />
                                ) : (
                                    <div className="text-sm font-medium">{formatDate(transaction.date)}</div>
                                )}
                            </div>

                            <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                    <Wallet className="h-4 w-4" /> Tipo de Operación
                                </div>
                                {isEditing ? (
                                    <Select value={editState.type} onValueChange={(val) => updateEditState("type", val)}>
                                        <SelectTrigger className="h-9 text-sm border-border/50 bg-bg-secondary">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TYPE_LABELS)
                                                .filter(([val]) => ["EXPENSE", "INCOME", "TRANSFER", "WITHDRAWAL"].includes(val))
                                                .map(([val, label]) => (
                                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div>
                                        <Badge variant={typeBadgeVariant} className="text-sm px-3">{typeLabel}</Badge>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                    <Landmark className="h-4 w-4" /> Cuenta
                                </div>
                                {isEditing ? (
                                    <AutocompleteInput
                                        id="accountName"
                                        value={editState.accountName}
                                        onChange={(val) => updateEditState("accountName", val)}
                                        options={accountsList}
                                        className="h-9 text-sm border-border/50 bg-bg-secondary"
                                        placeholder="Seleccionar cuenta..."
                                    />
                                ) : (
                                    <div className="text-sm font-medium">{displayNames.account || "Sin cuenta"}</div>
                                )}
                            </div>

                            <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                    <FolderGit2 className="h-4 w-4" /> Categoría
                                </div>
                                {isEditing ? (
                                    <AutocompleteInput
                                        id="categoryName"
                                        value={editState.categoryName}
                                        onChange={(val) => updateEditState("categoryName", val)}
                                        options={categoriesList}
                                        className="h-9 text-sm border-border/50 bg-bg-secondary"
                                        placeholder="Seleccionar categoría..."
                                    />
                                ) : (
                                    <div className="text-sm font-medium">{displayNames.category || "Sin categoría"}</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-bg-primary/50 p-5 border border-border/30">
                            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                <Sparkles className="h-4 w-4 text-accent-primary" /> Contexto
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={editState.notes}
                                    onChange={(e) => updateEditState("notes", e.target.value)}
                                    className="w-full min-h-[100px] rounded-xl border border-border/50 bg-bg-secondary p-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary/50 resize-y"
                                    placeholder="Agrega notas o contexto..."
                                />
                            ) : (
                                <div className="w-full max-w-full overflow-hidden">
                                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words [word-break:break-word]">
                                        {displayContext || "No hay notas o contexto disponible para esta transacción."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {(transaction.tags?.length || 0) > 0 || isEditing ? (
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                    <Tags className="h-4 w-4" /> Etiquetas
                                </div>
                                {isEditing ? (
                                    <TagInput
                                        value={editState.tags}
                                        onChange={(tags) => updateEditState("tags", tags)}
                                        suggestions={suggestions}
                                        placeholder="Escribe y presiona Enter..."
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {transaction.tags?.map((tag) => (
                                            <Badge key={tag} variant="outline" className="rounded-full px-3 bg-bg-secondary/50 border-border/50">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </CardContent>

                    {isEditing && (
                        <CardFooter className="bg-bg-primary/30 border-t border-border/50 py-4 flex justify-end gap-3">
                            <Button variant="ghost" onClick={toggleEdit} disabled={isLoading} className="rounded-xl">
                                <Undo2 className="h-4 w-4 mr-2" /> Cancelar
                            </Button>
                            <Button onClick={handleSaveEdit} disabled={isLoading} className="rounded-xl bg-accent-primary text-accent-primary-foreground">
                                <Check className="h-4 w-4 mr-2" /> {isLoading ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {/* ── Audit Trail ──────────────────────────────── */}
                <Card className="shadow-sm border-border/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                            <History className="h-4 w-4 text-primary/70" />
                            Historial de auditoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <AuditTrail transactionId={transaction.id!} />
                    </CardContent>
                </Card>
            </div>

            {/* ── Sidebar ──────────────────────────────── */}
            <div className="space-y-6">
                <OriginStatsViewer originStats={transaction.originStats as Record<string, unknown>} />
            </div>

            <InstitutionEditDialog
                open={instDialogOpen}
                onOpenChange={setInstDialogOpen}
                institution={institutionForDialog}
                types={institutionTypes}
                onApply={handleInstitutionEditApply}
            />
        </div>
    );
}

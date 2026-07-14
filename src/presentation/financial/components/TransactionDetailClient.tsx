"use client";

import { useState, useEffect, useRef } from "react";
import { FinancialTransaction, FinancialInstitution, FinancialInstitutionType, FinancialCategory, FinancialTransactionType } from "@/domain/entities/financial";
import { getTransactionDisplayTitle } from "@/lib/financial-utils";
import { AuditTrail } from "./AuditTrail";
import { DuplicateResolver } from "./DuplicateResolver";
import { OriginStatsViewer } from "./OriginStatsViewer";
import { History, Calendar, Edit2, Undo2, Check, Sparkles, Building2, Tags, FileText, Wallet, CreditCard, Landmark, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FieldCard } from "@/components/ui/field-card";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { DateTimeStepInput } from "@/components/ui/datetime-step-input";
import { useScrollFieldIntoView } from "@/hooks/use-scroll-field-into-view";
import { toast } from "sonner";
import { updateTransactionAction, getUniqueTagsAction } from "@/app/actions/financial-transactions";
import { getInstitutionsAction, getAccountsAction, getCategoriesAction, getInstitutionTypesAction, updateInstitutionAction } from "@/app/actions/financial-settings";
import { InstitutionPicker, type PendingInstitutionEdit } from "./InstitutionPicker";
import { CategoryPicker } from "./CategoryPicker";
import { TransactionTypeChips } from "./TransactionTypeChips";
import { AmountHeroInput } from "./AmountHeroInput";
import { AccountSelect } from "./AccountSelect";
import { cn } from "@/lib/utils";
import { isoToWallClockInput, wallClockInputToISO } from "@/lib/date-range";
import { TagInput } from "@/components/ui/tag-input";

// ─── Helpers ──────────────────────────────────────────────────

/** Types for which "paid with credit card" is a meaningful, editable flag. */
const CREDIT_ELIGIBLE_TYPES: readonly FinancialTransactionType[] = ["EXPENSE"];

const TYPE_LABELS: Record<string, string> = {
    EXPENSE: "Gasto",
    INCOME: "Ingreso",
    TRANSFER: "Transferencias",
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
    const EXPENSE_TYPES = ["EXPENSE", "PAYMENT", "WITHDRAWAL", "FEE", "TAX"];
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

    const formRef = useRef<HTMLDivElement>(null);
    useScrollFieldIntoView(formRef);

    const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
    const [institutionTypes, setInstitutionTypes] = useState<FinancialInstitutionType[]>([]);
    const [accountsList, setAccountsList] = useState<string[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);

    const [institutionQuery, setInstitutionQuery] = useState("");
    const [categoryQuery, setCategoryQuery] = useState("");

    // Institution inline-edit (staged; persisted when the edit is confirmed).
    const [pendingInstitutionEdit, setPendingInstitutionEdit] = useState<PendingInstitutionEdit | null>(null);

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
                setCategories(catRes.filter(c => !c.isDeleted));
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
        paidWithCredit: transaction.paidWithCredit ?? false,
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
                paidWithCredit: transaction.paidWithCredit ?? false,
            });
            // Entering edit mode always starts with a blank search in the pickers.
            setInstitutionQuery("");
            setCategoryQuery("");
        }
        setIsEditing(!isEditing);
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
                paidWithCredit: editState.type === "EXPENSE" ? editState.paidWithCredit : undefined,
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
    const creditEligible = CREDIT_ELIGIBLE_TYPES.includes(editState.type as FinancialTransactionType);
    const canEdit = transaction.status !== "ARCHIVED";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">

                <DuplicateResolver
                    transactionId={transaction.id!}
                    isPossibleDuplicate={transaction.possibleDuplicate && transaction.status !== 'DUPLICATE'}
                    onResolved={handleDuplicateResolved}
                />

                {/* ── Main Details ──────────────────────────────── */}
                <div
                    ref={formRef}
                    className={cn(
                        "relative space-y-3 overflow-hidden rounded-3xl border border-border/50 bg-bg-secondary/30 p-4 sm:p-5",
                        isLoading && "pointer-events-none opacity-60",
                    )}
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-primary/60 to-accent-primary/10" aria-hidden="true" />

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusCfg.variant} className="rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                            {statusCfg.label}
                        </Badge>
                        {isEditing && (
                            <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.14em] border-accent-primary/50 text-accent-primary">
                                Modo Edición
                            </Badge>
                        )}
                    </div>

                    {/* Monto */}
                    {isEditing ? (
                        <AmountHeroInput
                            amount={editState.amount != null ? String(editState.amount) : ""}
                            onChange={(v) => updateEditState("amount", v ? parseFloat(v) : null)}
                            currency={transaction.currency}
                        />
                    ) : (
                        <div className="rounded-2xl border border-border/40 bg-bg-secondary/50 p-4">
                            <p className="text-xs font-medium text-text-tertiary">Monto ({transaction.currency})</p>
                            <div className={cn("mt-1 text-3xl font-bold tracking-tighter sm:text-4xl", isIncome && "text-emerald-500")}>
                                {isIncome ? "+" : ""}{formatAmount(transaction.amount, transaction.currency)}
                            </div>
                        </div>
                    )}

                    {/* Institución */}
                    <FieldCard icon={<Building2 className="h-4 w-4" />} iconClass="bg-blue-500/15 text-blue-500" label="Institución">
                        {isEditing ? (
                            <InstitutionPicker
                                institutions={institutions}
                                institutionTypes={institutionTypes}
                                value={editState.institutionName}
                                onSelect={(name) => { updateEditState("institutionName", name); updateEditState("merchant", name); }}
                                onInstitutionsChange={setInstitutions}
                                query={institutionQuery}
                                onQueryChange={setInstitutionQuery}
                                pendingEdit={pendingInstitutionEdit}
                                onPendingEditChange={setPendingInstitutionEdit}
                            />
                        ) : (
                            <p className="text-sm font-medium text-text-primary">{displayNames.institution || transaction.merchant || "Sin institución"}</p>
                        )}
                    </FieldCard>

                    {/* Descripción */}
                    <FieldCard icon={<FileText className="h-4 w-4" />} iconClass="bg-accent-primary/15 text-accent-primary" label="Descripción">
                        {isEditing ? (
                            <Input
                                value={editState.description}
                                onChange={(e) => updateEditState("description", e.target.value)}
                                placeholder="Descripción de la transacción"
                            />
                        ) : (
                            <p className="text-sm font-medium text-text-primary">{getTransactionDisplayTitle(transaction)}</p>
                        )}
                    </FieldCard>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Fecha y hora */}
                        <FieldCard icon={<Calendar className="h-4 w-4" />} iconClass="bg-accent-primary/15 text-accent-primary" label="Fecha y hora">
                            {isEditing ? (
                                <DateTimeStepInput value={editState.date} onChange={(v) => updateEditState("date", v)} minuteStep={5} />
                            ) : (
                                <p className="text-sm font-medium text-text-primary">{formatDate(transaction.date)}</p>
                            )}
                        </FieldCard>

                        {/* Tipo de operación */}
                        <FieldCard icon={<Wallet className="h-4 w-4" />} iconClass="bg-indigo-500/15 text-indigo-500" label="Tipo de operación">
                            {isEditing ? (
                                <TransactionTypeChips value={editState.type as FinancialTransactionType} onChange={(v) => updateEditState("type", v)} />
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={typeBadgeVariant} className="text-sm px-3">{typeLabel}</Badge>
                                    {transaction.type === "EXPENSE" && transaction.paidWithCredit && (
                                        <Badge variant="outline" className="text-sm px-3 gap-1.5">
                                            <CreditCard className="h-3.5 w-3.5" /> Tarjeta de crédito
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </FieldCard>
                    </div>

                    {/* Cuenta (con pagado-con-tarjeta dentro) */}
                    <FieldCard icon={<Landmark className="h-4 w-4" />} iconClass="bg-emerald-500/15 text-emerald-500" label="Cuenta">
                        {isEditing ? (
                            <>
                                <AccountSelect accounts={accountsList} value={editState.accountName} onChange={(v) => updateEditState("accountName", v)} />
                                {creditEligible && (
                                    <div className={cn(
                                        "mt-3 flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                                        editState.paidWithCredit ? "border-accent-primary/50 bg-accent-primary/5" : "border-border/40 bg-bg-secondary/40",
                                    )}>
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-primary/15 text-accent-primary">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm leading-tight text-text-primary">Pagado con<br />tarjeta de crédito</span>
                                        </div>
                                        <Switch checked={editState.paidWithCredit} onChange={(v) => updateEditState("paidWithCredit", v)} label="Pagado con tarjeta de crédito" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm font-medium text-text-primary">{displayNames.account || "Sin cuenta"}</p>
                        )}
                    </FieldCard>

                    {/* Categoría */}
                    <FieldCard icon={<Tag className="h-4 w-4" />} iconClass="bg-amber-500/15 text-amber-500" label="Categoría">
                        {isEditing ? (
                            <CategoryPicker
                                categories={categories}
                                value={editState.categoryName}
                                onSelect={(v) => updateEditState("categoryName", v)}
                                onCategoriesChange={setCategories}
                                query={categoryQuery}
                                onQueryChange={setCategoryQuery}
                            />
                        ) : (
                            <p className="text-sm font-medium text-text-primary">{displayNames.category || "Sin categoría"}</p>
                        )}
                    </FieldCard>

                    {/* Contexto */}
                    <FieldCard icon={<Sparkles className="h-4 w-4" />} iconClass="bg-accent-primary/15 text-accent-primary" label="Contexto">
                        {isEditing ? (
                            <Textarea
                                rows={3}
                                value={editState.notes}
                                onChange={(e) => updateEditState("notes", e.target.value)}
                                placeholder="Agrega notas o contexto..."
                            />
                        ) : (
                            <p className="w-full max-w-full overflow-hidden text-sm leading-relaxed text-text-secondary whitespace-pre-wrap break-words [word-break:break-word]">
                                {displayContext || "No hay notas o contexto disponible para esta transacción."}
                            </p>
                        )}
                    </FieldCard>

                    {/* Etiquetas */}
                    {(transaction.tags?.length || 0) > 0 || isEditing ? (
                        <FieldCard icon={<Tags className="h-4 w-4" />} iconClass="bg-pink-500/15 text-pink-500" label="Etiquetas">
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
                        </FieldCard>
                    ) : null}
                </div>

                {/* ── Floating actions — always reachable, no scrolling required ── */}
                {canEdit && (
                    <StickyActionBar>
                        {isEditing ? (
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={toggleEdit} disabled={isLoading} className="h-12 flex-1 rounded-xl">
                                    <Undo2 className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                                <Button onClick={handleSaveEdit} disabled={isLoading} className="h-12 flex-1 rounded-xl bg-accent-primary text-accent-primary-foreground shadow-lg shadow-accent-primary/25 hover:bg-accent-primary/90">
                                    <Check className="h-4 w-4 mr-2" /> {isLoading ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={toggleEdit}
                                className="h-12 w-full rounded-xl bg-accent-primary text-base font-semibold text-accent-primary-foreground shadow-lg shadow-accent-primary/25 hover:bg-accent-primary/90"
                            >
                                <Edit2 className="h-4 w-4 mr-2" /> Editar transacción
                            </Button>
                        )}
                    </StickyActionBar>
                )}

                {/* ── Audit Trail ──────────────────────────────── */}
                <div className="rounded-2xl border border-border/40 bg-bg-secondary/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-tertiary">
                        <History className="h-4 w-4 text-accent-primary/70" />
                        Historial de auditoría
                    </div>
                    <AuditTrail transactionId={transaction.id!} />
                </div>
            </div>

            {/* ── Sidebar ──────────────────────────────── */}
            <div className="space-y-6">
                <OriginStatsViewer originStats={transaction.originStats as Record<string, unknown>} />
            </div>
        </div>
    );
}

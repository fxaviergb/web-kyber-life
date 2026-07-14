"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTransactionAction } from "@/app/actions/financial-transactions";
import { getInstitutionsAction, getAccountsAction, getCategoriesAction, getInstitutionTypesAction, updateInstitutionAction, createCategoryAction } from "@/app/actions/financial-settings";
import { FinancialTransactionType, FinancialInstitution, FinancialInstitutionType, FinancialCategory } from "@/domain/entities/financial";
import { financialOfflineStore } from "@/infrastructure/offline/financial-offline-store";
import { InstitutionEditDialog, type PendingInstitutionEdit } from "./InstitutionEditDialog";
import { toDateTimeLocalValue, isoToWallClockInput, wallClockInputToISO } from "@/lib/date-range";
import {
    Building2, Landmark, FileText, Pencil, CreditCard, DollarSign, ShoppingCart, TrendingUp, TrendingDown,
    ArrowRightLeft, Wallet, Search, Calendar, MessageSquare, Tag, MoreHorizontal, ChevronDown, Lock, Loader2, Plus,
    PiggyBank, Utensils, Scissors, GraduationCap, Ticket, Dog, HelpCircle, Gift, Shirt, Banknote,
    HeartPulse, ShieldCheck, Lightbulb, Repeat, Car, Plane, Home,
    Pill, Fuel, Dumbbell, User, Wifi, UtensilsCrossed, Laptop, Store,
} from "lucide-react";

/** Types for which "paid with credit card" is a meaningful, editable flag. */
const CREDIT_ELIGIBLE_TYPES: readonly FinancialTransactionType[] = ["EXPENSE"];

/**
 * The four transaction types offered as quick-pick chips. Icons and colors mirror
 * the finance module's TransactionCard palette so a type reads the same everywhere.
 * Order: Ingreso · Gasto · Transferencia · Retiro.
 */
const TYPE_OPTIONS: { value: FinancialTransactionType; label: string; Icon: React.ElementType; color: string }[] = [
    { value: "INCOME", label: "Ingreso", Icon: TrendingUp, color: "text-emerald-500" },
    { value: "EXPENSE", label: "Gasto", Icon: TrendingDown, color: "text-rose-500" },
    { value: "TRANSFER", label: "Transferencia", Icon: ArrowRightLeft, color: "text-yellow-500" },
    { value: "WITHDRAWAL", label: "Retiro", Icon: Wallet, color: "text-indigo-500" },
];

// Lowercase type labels for natural-reading auto notes.
const NOTE_TYPE_LABELS: Record<string, string> = {
    EXPENSE: "gasto",
    INCOME: "ingreso",
    TRANSFER: "transferencia",
    WITHDRAWAL: "retiro",
};

/** Shared lucide icon resolver for category and institution-type icon names. */
const ICONS: Record<string, React.ElementType> = {
    // Category icons
    PiggyBank, Utensils, Landmark, Scissors, GraduationCap, Ticket, FileText, Dog, HelpCircle,
    CreditCard, Gift, Shirt, Banknote, HeartPulse, ShieldCheck, Lightbulb, ShoppingCart, Repeat,
    ArrowRightLeft, Car, Plane, Home,
    // Institution-type icons
    Wallet, Pill, Fuel, Dumbbell, Building2, User, Wifi, UtensilsCrossed, Laptop, Store,
};

const CATEGORY_FALLBACK_COLOR = "#64748b";
const MAX_DESCRIPTION = 120;
const MAX_NOTES = 200;
const INSTITUTION_SUGGESTIONS = 6;
const CATEGORY_PREVIEW = 7;

/** Accordion section ids. Only one may be expanded at a time (or none). */
type SectionId = "description" | "institution" | "account" | "category" | "date" | "notes";

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

/** Build the auto-generated notes sentence from the current form fields. */
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

// ─── Small switch (no extra dependency) ──────────────────────────────────────
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                checked ? "bg-accent-primary" : "bg-border",
            )}
        >
            <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
        </button>
    );
}

// ─── Collapsible accordion field ─────────────────────────────────────────────
function AccordionField({
    icon,
    iconClass,
    label,
    preview,
    hasValue,
    expanded,
    onToggle,
    children,
}: {
    icon: React.ReactNode;
    iconClass: string;
    label: string;
    preview: string;
    hasValue: boolean;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("rounded-2xl border bg-bg-secondary/50 transition-colors", expanded ? "border-accent-primary/40" : "border-border/40")}>
            <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", iconClass)}>{icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{label}</p>
                    {!expanded && (
                        <p className={cn("truncate text-xs", hasValue ? "text-text-secondary" : "text-text-tertiary")}>{preview}</p>
                    )}
                </div>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-text-tertiary transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}

export function TransactionForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Which accordion section is open (only one or none).
    const [expanded, setExpanded] = useState<SectionId | null>(null);
    const toggle = (id: SectionId) => setExpanded((cur) => (cur === id ? null : id));

    // Form State
    const [type, setType] = useState<FinancialTransactionType>("EXPENSE");
    const [amount, setAmount] = useState("");
    // Only USD is supported for now; the currency is locked.
    const currency = "USD";
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(toDateTimeLocalValue(new Date()));
    const [notes, setNotes] = useState("");
    const [notesEdited, setNotesEdited] = useState(false);
    const [institutionName, setInstitutionName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [paidWithCredit, setPaidWithCredit] = useState(false);

    const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
    const [institutionTypes, setInstitutionTypes] = useState<FinancialInstitutionType[]>([]);
    const [accountsList, setAccountsList] = useState<string[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);

    const [showAllInstitutions, setShowAllInstitutions] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [categoryQuery, setCategoryQuery] = useState("");
    const [creatingCategory, setCreatingCategory] = useState(false);

    // Institution inline-edit (staged; persisted on submit).
    const [pendingInstitutionEdit, setPendingInstitutionEdit] = useState<PendingInstitutionEdit | null>(null);
    const [instDialogOpen, setInstDialogOpen] = useState(false);

    const creditEligible = CREDIT_ELIGIBLE_TYPES.includes(type);

    // Load draft and lists on mount
    useEffect(() => {
        const loadDraftAndData = async () => {
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

    // Save draft when values change (debounced).
    useEffect(() => {
        const saveDraft = async () => {
            try {
                await financialOfflineStore.drafts.clear();
                if (amount || institutionName || notes || description) {
                    await financialOfflineStore.drafts.add("draft_transaction", {
                        type,
                        amount: Number(amount) || 0,
                        currency,
                        description,
                        date: wallClockInputToISO(date),
                        notes,
                        institutionName,
                        accountName,
                        categoryName,
                        paidWithCredit,
                        status: "MANUAL",
                    });
                }
            } catch (e) {
                console.error("Failed to save draft to offline store", e);
            }
        };

        const timeoutId = setTimeout(saveDraft, 500);
        return () => clearTimeout(timeoutId);
    }, [type, amount, currency, description, date, notes, institutionName, accountName, categoryName, paidWithCredit]);

    // Auto-generate the notes until the user customises them.
    const autoNotes = useMemo(
        () => buildAutoNotes({ type, description, institutionName, amount, date, accountName }),
        [type, description, institutionName, amount, date, accountName],
    );

    useEffect(() => {
        if (!notesEdited) setNotes(autoNotes);
    }, [autoNotes, notesEdited]);

    const matchedInstitution = useMemo(
        () => institutions.find(i => !i.isDeleted && i.name.trim().toLowerCase() === institutionName.trim().toLowerCase()) ?? null,
        [institutions, institutionName],
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
        setInstitutionName(edit.name);
        setInstitutions(prev => prev.map(i => i.id === edit.id
            ? { ...i, name: edit.name, institutionTypeId: edit.institutionTypeId, description: edit.description }
            : i));
    };

    const activeInstitutions = useMemo(() => institutions.filter(i => !i.isDeleted), [institutions]);

    const matchedInstitutionList = useMemo(() => {
        const q = institutionName.trim().toLowerCase();
        return q ? activeInstitutions.filter(i => i.name.toLowerCase().includes(q)) : activeInstitutions;
    }, [activeInstitutions, institutionName]);

    const filteredInstitutions = showAllInstitutions ? matchedInstitutionList : matchedInstitutionList.slice(0, INSTITUTION_SUGGESTIONS);
    const hiddenInstitutionCount = Math.max(0, matchedInstitutionList.length - INSTITUTION_SUGGESTIONS);

    // Category grid + search-or-create.
    const catQuery = categoryQuery.trim().toLowerCase();
    const matchedCategories = useMemo(
        () => (catQuery ? categories.filter(c => c.name.toLowerCase().includes(catQuery)) : categories),
        [categories, catQuery],
    );
    const gridCategories = catQuery ? matchedCategories : (showAllCategories ? categories : categories.slice(0, CATEGORY_PREVIEW));
    const categoryExactExists = categories.some(c => c.name.trim().toLowerCase() === catQuery);

    const handleCreateCategory = async () => {
        const name = categoryQuery.trim();
        if (!name || creatingCategory) return;
        setCreatingCategory(true);
        try {
            await createCategoryAction({ name });
            const cats = await getCategoriesAction();
            setCategories(cats.filter(c => !c.isDeleted));
            setCategoryName(name);
            setCategoryQuery("");
            toast.success(`Categoría "${name}" creada`);
        } catch (e) {
            toast.error("No se pudo crear la categoría");
        } finally {
            setCreatingCategory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!institutionName || institutionName.trim() === "") {
            toast.error("La institución es requerida");
            setExpanded("institution");
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Ingresa un monto válido mayor a 0");
            return;
        }
        if (!date) {
            toast.error("La fecha es requerida");
            setExpanded("date");
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
            currency,
            description: description.trim() || undefined,
            date: wallClockInputToISO(date)!,
            notes: notes || undefined,
            institutionName: institutionName || undefined,
            accountName: accountName || undefined,
            categoryName: categoryName || undefined,
            paidWithCredit: creditEligible ? paidWithCredit : undefined,
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

    // Collapsed previews
    const accountPreview = accountName
        ? (paidWithCredit && creditEligible ? `${accountName} · Tarjeta de crédito` : accountName)
        : "Ej. Ahorros Múltiple, Tarjeta Visa";
    const datePreview = formatNotesDateTime(date) || "Selecciona fecha y hora";

    return (
        <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-lg">
            <div className="space-y-3 pb-24">
                {/* Type chips */}
                <div className="grid grid-cols-4 gap-2">
                    {TYPE_OPTIONS.map((opt) => {
                        const active = type === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setType(opt.value)}
                                aria-pressed={active}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-3 transition-all",
                                    active
                                        ? "border-transparent bg-accent-primary text-accent-primary-foreground shadow-lg shadow-accent-primary/20"
                                        : "border-border/40 bg-bg-secondary/50 text-text-secondary hover:border-border",
                                )}
                            >
                                <opt.Icon className={cn("h-5 w-5", active ? "" : opt.color)} />
                                <span className="text-[11px] font-medium leading-none">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Amount hero (always visible) */}
                <div className="rounded-2xl border border-border/40 bg-bg-secondary/50 p-4">
                    <p className="text-xs font-medium text-text-tertiary">Monto ({currency})</p>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-primary/15 text-accent-primary">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            autoComplete="off"
                            className="min-w-0 flex-1 bg-transparent text-3xl font-bold text-text-primary outline-none placeholder:text-text-tertiary/60"
                        />
                        <div
                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border-base bg-bg-primary px-3 text-sm font-semibold text-text-primary"
                            title="Por ahora solo se admite dólar estadounidense (USD)"
                        >
                            <Lock className="h-3.5 w-3.5 text-text-tertiary" />
                            {currency}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <AccordionField
                    icon={<FileText className="h-4 w-4" />}
                    iconClass="bg-accent-primary/15 text-accent-primary"
                    label="Descripción"
                    preview={description || "Ej. Compra en supermercado"}
                    hasValue={!!description}
                    expanded={expanded === "description"}
                    onToggle={() => toggle("description")}
                >
                    <Input
                        id="description"
                        name="description"
                        type="text"
                        maxLength={MAX_DESCRIPTION}
                        placeholder="Ej. Compra en supermercado"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        autoComplete="off"
                        autoFocus
                    />
                    <div className="mt-1 text-right text-[11px] text-text-tertiary">{description.length}/{MAX_DESCRIPTION}</div>
                </AccordionField>

                {/* Institution */}
                <AccordionField
                    icon={<Building2 className="h-4 w-4" />}
                    iconClass="bg-blue-500/15 text-blue-500"
                    label="Institución"
                    preview={institutionName || "Ej. Banco de Chile, Sodexo, Amazon"}
                    hasValue={!!institutionName}
                    expanded={expanded === "institution"}
                    onToggle={() => toggle("institution")}
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                        <Input
                            id="institutionName"
                            value={institutionName}
                            onChange={(e) => setInstitutionName(e.target.value)}
                            placeholder="Buscar institución"
                            className="pl-9"
                            autoComplete="off"
                        />
                    </div>
                    {filteredInstitutions.length > 0 && (
                        <>
                            <p className="mt-3 text-xs text-text-tertiary">Sugerencias</p>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                {filteredInstitutions.map((inst) => {
                                    const iconName = inst.institutionTypeObj?.iconName;
                                    const Icon = (iconName && ICONS[iconName]) || Building2;
                                    const selected = inst.name.trim().toLowerCase() === institutionName.trim().toLowerCase();
                                    return (
                                        <button
                                            key={inst.id}
                                            type="button"
                                            onClick={() => setInstitutionName(inst.name)}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                                                selected ? "border-accent-primary bg-accent-primary/10" : "border-border/40 bg-bg-secondary/40 hover:border-border",
                                            )}
                                        >
                                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="line-clamp-2 text-center text-[11px] leading-tight text-text-secondary">{inst.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-2 flex items-center gap-4">
                                {!showAllInstitutions && hiddenInstitutionCount > 0 && (
                                    <button type="button" onClick={() => setShowAllInstitutions(true)} className="text-sm font-medium text-accent-primary hover:underline">
                                        Ver todas
                                    </button>
                                )}
                                {matchedInstitution && (
                                    <button type="button" onClick={() => setInstDialogOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
                                        <Pencil className="h-3.5 w-3.5" /> Editar
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </AccordionField>

                {/* Account (with paid-with-credit inside) */}
                <AccordionField
                    icon={<Landmark className="h-4 w-4" />}
                    iconClass="bg-emerald-500/15 text-emerald-500"
                    label="Cuenta"
                    preview={accountPreview}
                    hasValue={!!accountName}
                    expanded={expanded === "account"}
                    onToggle={() => toggle("account")}
                >
                    <div className="relative">
                        <select
                            id="accountName"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="h-10 w-full appearance-none rounded-lg border border-border-base bg-bg-primary px-3 pr-9 text-sm text-text-primary outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                        >
                            <option value="">Selecciona una cuenta</option>
                            {accountsList.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                    </div>

                    {creditEligible && (
                        <div className={cn(
                            "mt-3 flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                            paidWithCredit ? "border-accent-primary/50 bg-accent-primary/5" : "border-border/40 bg-bg-secondary/40",
                        )}>
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-primary/15 text-accent-primary">
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                <span className="text-sm leading-tight text-text-primary">Pagado con<br />tarjeta de crédito</span>
                            </div>
                            <Switch checked={paidWithCredit} onChange={setPaidWithCredit} label="Pagado con tarjeta de crédito" />
                        </div>
                    )}
                </AccordionField>

                {/* Category */}
                <AccordionField
                    icon={<Tag className="h-4 w-4" />}
                    iconClass="bg-amber-500/15 text-amber-500"
                    label="Categoría"
                    preview={categoryName || "Ej. Alimentación, Transporte, Servicios"}
                    hasValue={!!categoryName}
                    expanded={expanded === "category"}
                    onToggle={() => toggle("category")}
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                        <Input
                            value={categoryQuery}
                            onChange={(e) => setCategoryQuery(e.target.value)}
                            placeholder="Buscar o crear categoría"
                            className="pl-9"
                            autoComplete="off"
                        />
                    </div>

                    {gridCategories.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            {gridCategories.map((cat) => {
                                const Icon = (cat.icon && ICONS[cat.icon]) || Tag;
                                const color = cat.color || CATEGORY_FALLBACK_COLOR;
                                const selected = cat.name.trim().toLowerCase() === categoryName.trim().toLowerCase();
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategoryName(selected ? "" : cat.name)}
                                        className={cn(
                                            "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                                            selected ? "border-accent-primary bg-accent-primary/10" : "border-border/40 bg-bg-secondary/40 hover:border-border",
                                        )}
                                    >
                                        <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ color, backgroundColor: `${color}22` }}>
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="line-clamp-2 text-center text-[11px] leading-tight text-text-secondary">{cat.name}</span>
                                    </button>
                                );
                            })}
                            {!catQuery && categories.length > CATEGORY_PREVIEW && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllCategories((v) => !v)}
                                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-bg-secondary/40 p-2 transition-all hover:border-border"
                                >
                                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-bg-primary text-text-tertiary">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </span>
                                    <span className="text-center text-[11px] leading-tight text-text-secondary">{showAllCategories ? "Menos" : "Más"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {catQuery && !categoryExactExists && (
                        <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={creatingCategory}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent-primary/40 bg-accent-primary/5 px-3 py-2.5 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/10 disabled:opacity-60"
                        >
                            {creatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Crear &quot;{categoryQuery.trim()}&quot;
                        </button>
                    )}
                </AccordionField>

                {/* Date & time (single field) */}
                <AccordionField
                    icon={<Calendar className="h-4 w-4" />}
                    iconClass="bg-accent-primary/15 text-accent-primary"
                    label="Fecha y hora"
                    preview={datePreview}
                    hasValue={!!date}
                    expanded={expanded === "date"}
                    onToggle={() => toggle("date")}
                >
                    <Input
                        id="date"
                        name="date"
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        autoComplete="off"
                    />
                </AccordionField>

                {/* Notes */}
                <AccordionField
                    icon={<MessageSquare className="h-4 w-4" />}
                    iconClass="bg-accent-primary/15 text-accent-primary"
                    label="Notas (opcional)"
                    preview={notes || "Ej. Registro de gasto"}
                    hasValue={!!notes}
                    expanded={expanded === "notes"}
                    onToggle={() => toggle("notes")}
                >
                    <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        maxLength={MAX_NOTES}
                        placeholder="Se completa automáticamente con los datos del formulario. Puedes editarlo libremente."
                        value={notes}
                        onChange={(e) => {
                            const val = e.target.value;
                            setNotes(val);
                            setNotesEdited(val.trim().length > 0);
                        }}
                        autoComplete="off"
                    />
                    <div className="mt-1 text-right text-[11px] text-text-tertiary">{notes.length}/{MAX_NOTES}</div>
                </AccordionField>
            </div>

            {/* Floating save button — always visible */}
            <div className="sticky bottom-0 z-10 -mx-1 border-t border-border/40 bg-bg-primary/85 px-1 pb-4 pt-3 backdrop-blur-md">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-accent-primary text-base font-semibold text-accent-primary-foreground shadow-lg shadow-accent-primary/25 hover:bg-accent-primary/90"
                >
                    {isSubmitting ? "Guardando..." : "Guardar transacción"}
                </Button>
            </div>

            <InstitutionEditDialog
                open={instDialogOpen}
                onOpenChange={setInstDialogOpen}
                institution={institutionForDialog}
                types={institutionTypes}
                onApply={handleInstitutionEditApply}
            />
        </form>
    );
}

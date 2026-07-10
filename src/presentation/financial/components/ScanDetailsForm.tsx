"use client";

import { useState, useEffect } from "react";
import { FinancialScannerTransaction } from "@/domain/entities/financial";
import { mapInboxTransactionAction, dismissInboxTransactionAction } from "@/app/actions/financial-inbox";
import { getInstitutionsAction, getAccountsAction, getCategoriesAction } from "@/app/actions/financial-settings";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { TagInput } from "@/components/ui/tag-input";
import { getUniqueTagsAction } from "@/app/actions/financial-transactions";
import { InstitutionMatchBadge } from "./InstitutionMatchBadge";
import type { InstitutionMatchInfo } from "@/lib/institution-match";
import { isoToWallClockInput, wallClockInputToISO } from "@/lib/date-range";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CalendarDays, Check, CircleAlert, DollarSign, Store, Tag, Tags, X, FileJson, Info, Pencil, Building2, Landmark, FolderGit2, FileText, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const TYPE_OPTIONS = [
    { value: "EXPENSE", label: "Gasto" },
    { value: "INCOME", label: "Ingreso" },
    { value: "TRANSFER", label: "Transferencias propias" },
    { value: "WITHDRAWAL", label: "Retiro" },
] as const;

interface ScanDetailsFormProps {
    initialData: FinancialScannerTransaction;
    /** Institution name already resolved on the server (avoids a client-side flash). */
    resolvedInstitutionName?: string;
    /** Confidence of the scanned merchant → existing institution identification. */
    institutionMatch?: InstitutionMatchInfo;
}

function getBadgeVariant(type?: string | null) {
    switch (type?.toUpperCase()) {
        case "INCOME":
            return "success";
        case "EXPENSE":
        case "WITHDRAWAL":
            return "danger";
        case "TRANSFER":
            return "warning";
        default:
            return "outline";
    }
}

function normalizeType(type?: string | null) {
    if (!type) return "EXPENSE";
    const normalized = type.toUpperCase();
    return TYPE_OPTIONS.find(o => o.value === normalized)?.value || "EXPENSE";
}

function extractSummary(tx: FinancialScannerTransaction): string {
    const s = tx.summary?.trim();
    if (s && s !== "null" && s !== "undefined") {
        return s;
    }

    const stats = tx.originStats as Record<string, unknown> | null | undefined;

    const emailBody = typeof stats?.emailBody === "string" ? stats.emailBody.trim() : "";
    if (emailBody) return `[MAIL] ${emailBody}`;

    const snippet = typeof stats?.snippet === "string" ? stats.snippet.trim() : "";
    if (snippet) return `[SNIPPET] ${snippet}`;

    return "";
}

export function ScanDetailsForm({ initialData, resolvedInstitutionName, institutionMatch }: ScanDetailsFormProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const [formData, setFormData] = useState(() => {
        const defaultNotes = extractSummary(initialData) || "";

        return {
            description: initialData.description || "",
            type: normalizeType(initialData.type),
            amount: initialData.amount !== null ? String(initialData.amount) : "",
            date: isoToWallClockInput(initialData.date) ?? "",
            notes: defaultNotes,
            institutionName: resolvedInstitutionName || initialData.merchant || "",
            accountName: "",
            categoryName: initialData.category || "",
            tags: [] as string[],
            paidWithCredit: false,
        };
    });

    const [institutions, setInstitutions] = useState<string[]>([]);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;
        async function loadOptions() {
            try {
                const [insts, accs, cats, tagsRes] = await Promise.all([
                    getInstitutionsAction(),
                    getAccountsAction(),
                    getCategoriesAction(),
                    getUniqueTagsAction()
                ]);
                if (mounted) {
                    setInstitutions(insts.map(i => i.name));
                    setAccounts(accs.map(a => a.name));
                    setCategories(cats.map(c => c.name));
                    if (tagsRes.success && Array.isArray(tagsRes.data)) {
                        setTagSuggestions(tagsRes.data as string[]);
                    }
                }
            } catch (error) {
                console.error("Error loading options:", error);
            }
        }
        loadOptions();
        return () => { mounted = false; };
    }, []);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!formData.type) {
            toast.error("El tipo de transacción es requerido");
            return;
        }

        const parsedAmount = parseFloat(formData.amount);
        if (isNaN(parsedAmount)) {
            toast.error("El monto es requerido y debe ser un número válido");
            return;
        }

        if (!formData.description || formData.description.trim() === "") {
            toast.error("La descripción es requerida para confirmar");
            return;
        }

        if (!formData.institutionName || formData.institutionName.trim() === "") {
            toast.error("La institución es requerida");
            return;
        }

        try {
            setIsProcessing(true);

            const result = await mapInboxTransactionAction({
                scannerTransactionId: initialData.id,
                description: formData.description.trim(),
                type: formData.type,
                merchant: formData.institutionName || null,
                amount: isNaN(parsedAmount) ? null : parsedAmount,
                // The datetime-local value is a literal wall-clock; persist those
                // exact digits (as UTC) so saving never shifts the stored time.
                date: wallClockInputToISO(formData.date) ?? null,
                notes: formData.notes || null,
                institutionName: formData.institutionName || null,
                accountName: formData.accountName || null,
                categoryName: formData.categoryName || null,
                tags: formData.tags,
                paidWithCredit: formData.type === "EXPENSE" ? formData.paidWithCredit : null,
            });

            if (!result.success) {
                toast.error("Error al confirmar la transacción", { description: result.error, id: `scan-confirm-error-${initialData.id}` });
                return;
            }

            toast.success("Transacción guardada exitosamente", { id: `scan-confirm-success-${initialData.id}` });
            router.replace("/financial/scans");
        } catch (error) {
            toast.error("Ocurrió un error inesperado", { id: `scan-confirm-unexpected-${initialData.id}` });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDismiss = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!window.confirm("¿Estás seguro de que deseas descartar este registro?")) return;

        try {
            setIsProcessing(true);
            const result = await dismissInboxTransactionAction(initialData.id!);
            if (!result.success) {
                toast.error("Error al descartar la transacción", { description: result.error, id: `scan-dismiss-error-${initialData.id}` });
                return;
            }

            toast.success("Transacción descartada", { id: `scan-dismiss-success-${initialData.id}` });
            router.replace("/financial/scans");
        } catch (error) {
            toast.error("Ocurrió un error inesperado", { id: `scan-dismiss-unexpected-${initialData.id}` });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="w-full border-border/50 shadow-sm transition-all duration-200 bg-card">


            <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Columna Izquierda: Datos Editables */}
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-medium border-b border-border pb-2 mb-3 sm:mb-4 flex items-center gap-2 text-foreground/90">
                                <Pencil className="h-4 w-4 text-primary" />
                                Datos a Confirmar
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                    <Label htmlFor="description" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        Descripción
                                    </Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        className="h-9 bg-background border-border/50"
                                        placeholder="Ej. Compra en Supermercado"
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                    <Label htmlFor="institutionName" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                        <Building2 className="h-4 w-4 text-blue-500" />
                                        Institución <span className="text-destructive">*</span>
                                        {institutionMatch && (
                                            <InstitutionMatchBadge info={institutionMatch} size={16} className="ml-0.5" />
                                        )}
                                    </Label>
                                    <AutocompleteInput
                                        id="institutionName"
                                        value={formData.institutionName}
                                        onChange={(val) => handleChange("institutionName", val)}
                                        options={institutions}
                                        className="h-9 text-sm bg-background border-border/50"
                                        placeholder="Ej. Banco de Chile, Sodexo..."
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                    <Label htmlFor="type" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                        <Tag className="h-4 w-4 text-purple-500" />
                                        Tipo de Transacción <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => handleChange("type", val)}
                                    >
                                        <SelectTrigger className="h-9 bg-background border-border/50">
                                            <SelectValue placeholder="Seleccione un tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.type === "EXPENSE" && (
                                    <div className="flex items-center gap-2 p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                        <Checkbox
                                            id="paidWithCredit"
                                            checked={formData.paidWithCredit}
                                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, paidWithCredit: checked === true }))}
                                        />
                                        <Label htmlFor="paidWithCredit" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer">
                                            <CreditCard className="h-4 w-4 text-orange-500" />
                                            Pagado con tarjeta de crédito
                                        </Label>
                                    </div>
                                )}

                                <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                    <Label htmlFor="amount" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                        <DollarSign className="h-4 w-4 text-green-500" />
                                        Monto <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">$</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => handleChange("amount", e.target.value)}
                                            className="h-9 bg-background border-border/50 pl-7"
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                    <Label htmlFor="categoryName" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                        <FolderGit2 className="h-4 w-4 text-amber-500" />
                                        Categoría
                                    </Label>
                                    <AutocompleteInput
                                        id="categoryName"
                                        value={formData.categoryName}
                                        onChange={(val) => handleChange("categoryName", val)}
                                        options={categories}
                                        className="h-9 text-sm bg-background border-border/50"
                                        placeholder="Ej. Supermercado, Transporte..."
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                    <Label htmlFor="accountName" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                        <Landmark className="h-4 w-4 text-emerald-500" />
                                        Cuenta
                                    </Label>
                                    <AutocompleteInput
                                        id="accountName"
                                        value={formData.accountName}
                                        onChange={(val) => handleChange("accountName", val)}
                                        options={accounts}
                                        className="h-9 text-sm bg-background border-border/50"
                                        placeholder="Ej. Cuenta Corriente, Tarjeta de Crédito..."
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-bg-primary/50 border border-border/30">
                                    <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                        <Tags className="h-4 w-4 text-pink-500" />
                                        Etiquetas
                                    </Label>
                                    <TagInput
                                        value={formData.tags}
                                        onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                                        suggestions={tagSuggestions}
                                        placeholder="Escribe y presiona Enter, o elige una existente..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date" className="flex items-center gap-1.5 text-muted-foreground">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        Fecha y Hora
                                    </Label>
                                    <Input
                                        id="date"
                                        type="datetime-local"
                                        value={formData.date}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("date", e.target.value)}
                                        className="bg-background border-border/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="flex items-center gap-1.5 text-muted-foreground">
                                        <Info className="h-3.5 w-3.5" />
                                        Contexto Extraído
                                    </Label>
                                    <textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("notes", e.target.value)}
                                        className="flex min-h-[120px] w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                        placeholder="Descripción o contexto de la transacción..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Datos Originales (Solo Lectura) */}
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-medium border-b border-border pb-2 mb-3 sm:mb-4 flex items-center gap-2 text-foreground/90">
                                <FileJson className="h-4 w-4 text-primary" />
                                Datos Originales Extraídos
                            </h3>

                            <div className="rounded-xl bg-bg-primary/30 border border-border/50 p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Monto Original</span>
                                        <span className="font-mono">{initialData.amount !== null ? `${initialData.amount} ${initialData.currency || 'USD'}` : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Categoría</span>
                                        <span>{initialData.category || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Hash / Ref</span>
                                        <span className="font-mono text-xs break-all text-muted-foreground">{initialData.hash || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">ID Ejecución</span>
                                        <span className="font-mono text-xs break-all text-muted-foreground">{initialData.executionId || 'N/A'}</span>
                                    </div>
                                </div>

                                {initialData.originStats?.origin === "email" && (
                                    <div className="pt-2 border-t border-border/50 space-y-3">
                                        <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Detalles del Correo</span>
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            {initialData.originStats?.from && (
                                                <div>
                                                    <span className="block text-xs font-medium text-muted-foreground tracking-wider mb-1">De:</span>
                                                    <span className="font-mono text-xs break-all">{initialData.originStats.from}</span>
                                                </div>
                                            )}
                                            {initialData.originStats?.to && (
                                                <div>
                                                    <span className="block text-xs font-medium text-muted-foreground tracking-wider mb-1">Para:</span>
                                                    <span className="font-mono text-xs break-all">{initialData.originStats.to}</span>
                                                </div>
                                            )}
                                            {initialData.originStats?.subject && (
                                                <div>
                                                    <span className="block text-xs font-medium text-muted-foreground tracking-wider mb-1">Asunto:</span>
                                                    <span className="text-xs">{initialData.originStats.subject}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-border/50">
                                    <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Payload (Origin Stats)</span>
                                    <pre className="bg-background/50 p-3 rounded-lg text-[11px] font-mono overflow-x-auto text-foreground/80 whitespace-pre-wrap max-h-[300px] overflow-y-auto border border-border/30">
                                        {initialData.originStats ? JSON.stringify(initialData.originStats, null, 2) : "Sin datos adicionales"}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-border/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-bg-primary/10">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/financial/scans")}
                    disabled={isProcessing}
                    className="w-full sm:w-auto text-muted-foreground"
                >
                    Volver
                </Button>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-lg sm:w-auto hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        onClick={handleDismiss}
                        disabled={isProcessing}
                    >
                        <X className="mr-1.5 h-4 w-4" />
                        Descartar
                    </Button>
                    <Button
                        type="button"
                        className="w-full rounded-lg sm:w-auto"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        <Check className="mr-1.5 h-4 w-4" />
                        {isProcessing ? "Procesando..." : "Confirmar"}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

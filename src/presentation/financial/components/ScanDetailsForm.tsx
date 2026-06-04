"use client";

import { useState, useEffect } from "react";
import { FinancialScannerTransaction } from "@/domain/entities/financial";
import { mapInboxTransactionAction, dismissInboxTransactionAction } from "@/app/actions/financial-inbox";
import { getInstitutionsAction, getAccountsAction, getCategoriesAction } from "@/app/actions/financial-settings";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarDays, Check, CircleAlert, DollarSign, Store, Tag, X, FileJson, Info, Pencil, Building2, Landmark, FolderGit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const TYPE_OPTIONS = [
    { value: "EXPENSE", label: "Gasto" },
    { value: "INCOME", label: "Ingreso" },
    { value: "TRANSFER", label: "Transferencias propias" },
] as const;

interface ScanDetailsFormProps {
    initialData: FinancialScannerTransaction;
}

function getBadgeVariant(type?: string | null) {
    switch (type?.toUpperCase()) {
        case "INCOME":
            return "success";
        case "EXPENSE":
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

const normalizeForMatch = (str?: string | null) => {
    if (!str) return "";
    try {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    } catch {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    }
};

export function ScanDetailsForm({ initialData }: ScanDetailsFormProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const [formData, setFormData] = useState(() => {
        const originContext = initialData.originStats?.emailBody || initialData.originStats?.snippet || "";
        const fallbackContext = initialData.description || "";
        const defaultNotes = originContext || fallbackContext;

        return {
            type: normalizeType(initialData.type),
            amount: initialData.amount !== null ? String(initialData.amount) : "",
            date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 16) : "",
            notes: defaultNotes,
            institutionName: initialData.merchant || "",
            accountName: "",
            categoryName: initialData.category || "",
        };
    });

    const [institutions, setInstitutions] = useState<string[]>([]);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;
        async function loadOptions() {
            try {
                const [insts, accs, cats] = await Promise.all([
                    getInstitutionsAction(),
                    getAccountsAction(),
                    getCategoriesAction()
                ]);
                if (mounted) {
                    const instNames = insts.map(i => i.name);
                    setInstitutions(instNames);
                    setAccounts(accs.map(a => a.name));
                    setCategories(cats.map(c => c.name));

                    if (initialData.merchant) {
                        const normalizedMerchant = normalizeForMatch(initialData.merchant);
                        
                        // Try exact match first
                        let matched = instNames.find(name => normalizeForMatch(name) === normalizedMerchant);
                        
                        // Fallback to fuzzy match (contains)
                        if (!matched) {
                            matched = instNames.find(name => {
                                const nName = normalizeForMatch(name);
                                return nName.includes(normalizedMerchant) || normalizedMerchant.includes(nName);
                            });
                        }

                        if (matched) {
                            setFormData(prev => {
                                // Only override if the user hasn't changed it from the original yet
                                if (prev.institutionName === initialData.merchant) {
                                    return { ...prev, institutionName: matched };
                                }
                                return prev;
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading options:", error);
            }
        }
        loadOptions();
        return () => { mounted = false; };
    }, [initialData.merchant]);

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

        if (!formData.institutionName || formData.institutionName.trim() === "") {
            toast.error("La institución es requerida");
            return;
        }

        try {
            setIsProcessing(true);
            
            const result = await mapInboxTransactionAction({
                scannerTransactionId: initialData.id,
                type: formData.type,
                merchant: formData.institutionName || null,
                amount: isNaN(parsedAmount) ? null : parsedAmount,
                date: formData.date ? new Date(formData.date).toISOString() : null,
                notes: formData.notes || null,
                institutionName: formData.institutionName || null,
                accountName: formData.accountName || null,
                categoryName: formData.categoryName || null,
            });

            if (!result.success) {
                toast.error("Error al confirmar la transacción", { description: result.error });
                return;
            }

            toast.success("Transacción guardada exitosamente");
            router.replace("/financial/scans");
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
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
                toast.error("Error al descartar la transacción", { description: result.error });
                return;
            }

            toast.success("Transacción descartada");
            router.replace("/financial/scans");
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="w-full border-border/50 shadow-sm transition-all duration-200 bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            Registro de Escaneo
                            <Badge variant="outline" className="ml-2 font-mono text-xs">
                                {initialData.id?.slice(0, 8)}...
                            </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1.5 flex items-center gap-2">
                            Estado actual: <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{initialData.status}</Badge>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Datos Editables */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium border-b border-border pb-2 mb-4 flex items-center gap-2 text-foreground/90">
                                <Pencil className="h-4 w-4 text-primary" />
                                Datos a Confirmar
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="institutionName" className="flex items-center gap-1.5 text-muted-foreground">
                                        <Building2 className="h-3.5 w-3.5" />
                                        Institución (Comercio / Origen) <span className="text-destructive">*</span>
                                    </Label>
                                    <AutocompleteInput
                                        id="institutionName"
                                        value={formData.institutionName}
                                        onChange={(val) => handleChange("institutionName", val)}
                                        options={institutions}
                                        className="bg-background border-border/50"
                                        placeholder="Ej. Banco de Chile, Sodexo..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type" className="flex items-center gap-1.5 text-muted-foreground">
                                        <Tag className="h-3.5 w-3.5" />
                                        Tipo de Transacción <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={formData.type} onValueChange={(val) => handleChange("type", val)}>
                                        <SelectTrigger className="w-full bg-background border-border/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={getBadgeVariant(opt.value)} className="w-2 h-2 rounded-full p-0" />
                                                        {opt.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="flex items-center gap-1.5 text-muted-foreground">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        Monto ({initialData.currency || "USD"}) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("amount", e.target.value)}
                                        className="bg-background border-border/50 font-mono"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="accountName" className="flex items-center gap-1.5 text-muted-foreground">
                                        <Landmark className="h-3.5 w-3.5" />
                                        Cuenta
                                    </Label>
                                    <AutocompleteInput
                                        id="accountName"
                                        value={formData.accountName}
                                        onChange={(val) => handleChange("accountName", val)}
                                        options={accounts}
                                        className="bg-background border-border/50"
                                        placeholder="Ej. Cuenta Corriente, Tarjeta de Crédito..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="categoryName" className="flex items-center gap-1.5 text-muted-foreground">
                                        <FolderGit2 className="h-3.5 w-3.5" />
                                        Categoría
                                    </Label>
                                    <AutocompleteInput
                                        id="categoryName"
                                        value={formData.categoryName}
                                        onChange={(val) => handleChange("categoryName", val)}
                                        options={categories}
                                        className="bg-background border-border/50"
                                        placeholder="Ej. Supermercado, Transporte..."
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
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium border-b border-border pb-2 mb-4 flex items-center gap-2 text-foreground/90">
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
                        Descartar Registro
                    </Button>
                    <Button
                        type="button"
                        className="w-full rounded-lg sm:w-auto"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        <Check className="mr-1.5 h-4 w-4" />
                        {isProcessing ? "Procesando..." : "Confirmar y Guardar"}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

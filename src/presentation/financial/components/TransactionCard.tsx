"use client";

import { useState } from "react";
import NextLink from "next/link";

import { FinancialTransaction } from "@/domain/entities/financial";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Archive,
    Trash2,
    Eye,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    reviewTransactionAction,
    archiveTransactionAction,
    softDeleteTransactionAction,
} from "@/app/actions/financial-transactions";

// ─── Types ────────────────────────────────────────────────────

interface TransactionCardProps {
    transaction: FinancialTransaction;
    onStatusChange?: (status: FinancialTransaction["status"]) => void;
    onDeleted?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────

// Per-type visual style: concise label, badge color, and amount color.
interface TypeStyle {
    label: string;
    badge: string;
    amount: string;
}

const TYPE_STYLE: Record<string, TypeStyle> = {
    EXPENSE:      { label: "Gasto",         badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",          amount: "text-rose-500" },
    INCOME:       { label: "Ingreso",       badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", amount: "text-emerald-500" },
    TRANSFER:     { label: "Transferencia", badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",             amount: "text-sky-400" },
    WITHDRAWAL:   { label: "Retiro",        badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",    amount: "text-indigo-400" },
    SUBSCRIPTION: { label: "Suscripción",   badge: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20", amount: "text-rose-500" },
    PAYMENT:      { label: "Pago",          badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",          amount: "text-rose-500" },
    REFUND:       { label: "Reembolso",     badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", amount: "text-emerald-500" },
    DEPOSIT:      { label: "Depósito",      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", amount: "text-emerald-500" },
    FEE:          { label: "Comisión",      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",       amount: "text-amber-500" },
    TAX:          { label: "Impuesto",      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",       amount: "text-amber-500" },
    OTHER:        { label: "Otro",          badge: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",          amount: "text-zinc-300" },
};

const DEFAULT_TYPE_STYLE: TypeStyle = TYPE_STYLE.OTHER;


function formatAmount(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatTime(dateStr: string): string {
    return new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

/**
 * Extract the best available context from a transaction.
 * Priority: notes → originStats.emailBody → originStats.snippet
 */
function extractContext(tx: FinancialTransaction): string {
    if (tx.notes) return tx.notes;
    const stats = tx.originStats as Record<string, unknown> | null | undefined;
    const emailBody = stats?.emailBody as string | undefined;
    const snippet = stats?.snippet as string | undefined;
    
    if (emailBody) return `[MAIL] ${emailBody}`;
    if (snippet) return `[MAIL] ${snippet}`;
    
    return "";
}

function getFallbackDescription(tx: FinancialTransaction, typeLabel: string): string {
    if (tx.description && tx.description.trim() !== "") return tx.description;
    
    // Attempt to extract from originStats if available
    const stats = tx.originStats as Record<string, unknown> | null | undefined;
    const emailSubject = stats?.emailSubject as string | undefined;
    if (emailSubject && emailSubject.trim() !== "") {
        return emailSubject;
    }

    const merchantStr = tx.merchant ? ` en ${tx.merchant}` : "";
    return `${typeLabel}${merchantStr}`;
}

// ─── Component ────────────────────────────────────────────────

export function TransactionCard({
    transaction,
    onStatusChange,
    onDeleted,
}: TransactionCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const isIncome = ["INCOME", "DEPOSIT", "REFUND"].includes(transaction.type);
    const isExpense = ["EXPENSE", "PAYMENT", "FEE", "TAX", "SUBSCRIPTION"].includes(transaction.type);
    // Retiro y transferencia son neutros: no llevan signo + / -.
    const amountSign = isIncome ? "+" : isExpense ? "-" : "";
    const style = TYPE_STYLE[transaction.type] ?? DEFAULT_TYPE_STYLE;
    const typeLabel = style.label;
    const displayContext = extractContext(transaction);
    const hasContext = displayContext.trim().length > 0;
    const displayTitle = getFallbackDescription(transaction, typeLabel);

    const handleAction = async (
        actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
        successMessage: string,
        statusUpdate?: FinancialTransaction["status"],
        isDelete = false,
    ) => {
        setIsLoading(true);
        try {
            const res = await actionFn(transaction.id!);
            if (res.success) {
                toast.success(successMessage, { id: `tx-action-success-${transaction.id}` });
                if (statusUpdate && onStatusChange) onStatusChange(statusUpdate);
                if (isDelete && onDeleted) onDeleted();
            } else {
                toast.error(res.error || "Ocurrió un error", { id: `tx-action-error-${transaction.id}` });
            }
        } catch {
            toast.error("Error inesperado", { id: `tx-action-unexpected-${transaction.id}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card
            className={cn(
                "group relative overflow-hidden rounded-[1.75rem] border-border/60 bg-bg-secondary py-0 shadow-sm shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                "flex flex-col h-full",
                isLoading && "opacity-60 pointer-events-none",
            )}
        >
            {/* Decorative gradient line */}
            <div
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent"
                aria-hidden="true"
            />

            {/* ── Nivel 1: Resumen (Siempre visible) ───────────────── */}
            <CardHeader
                className={cn(
                    "flex flex-col flex-1 w-full min-h-0 !space-y-0 !px-4 !py-4 sm:!px-5 select-none bg-bg-secondary/50 transition-colors",
                    isExpanded && "border-b border-border/50",
                    hasContext && "cursor-pointer hover:bg-bg-secondary"
                )}
                onClick={() => hasContext && setIsExpanded(!isExpanded)}
            >
                {/* Main Content */}
                <div className="flex-1 w-full min-w-0 pb-3 flex flex-col gap-2">
                    {/* Row 1: Type badge (left) + Amount (right) */}
                    <div className="flex items-center justify-between gap-3 w-full">
                        <span
                            className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight whitespace-nowrap shrink-0",
                                style.badge
                            )}
                        >
                            {typeLabel}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {transaction.possibleDuplicate && transaction.status !== "DUPLICATE" && (
                                <AlertCircle className="h-4 w-4 text-warning-text shrink-0" />
                            )}
                            <span
                                className={cn(
                                    "text-sm sm:text-base font-bold tracking-tight whitespace-nowrap",
                                    style.amount
                                )}
                                title={formatAmount(transaction.amount, transaction.currency)}
                            >
                                {amountSign}{formatAmount(transaction.amount, transaction.currency)}
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Title (Description) — full width, up to 3 lines */}
                    <CardTitle
                        className={cn(
                            "text-base sm:text-lg tracking-tight line-clamp-3 font-semibold break-words transition-colors leading-tight w-full",
                            hasContext && "group-hover/card:text-accent-primary"
                        )}
                        title={displayTitle}
                    >
                        {displayTitle}
                    </CardTitle>

                    {/* Row 3: Subtitle (Institution / Merchant) — full width, up to 3 lines */}
                    <span className="line-clamp-3 break-words text-sm font-medium text-zinc-300 w-full" title={transaction.merchant || typeLabel}>
                        {transaction.merchant || typeLabel}
                    </span>
                </div>

                {/* Separator - Pushed to bottom by flex-1 on Main Content */}
                <div className="w-full h-px bg-border/80 shrink-0 mt-auto" />

                {/* Footer */}
                <div className="flex w-full items-center justify-between gap-3 min-w-0 pt-3 shrink-0">
                    <div className="flex items-center gap-x-3 text-xs text-muted-foreground shrink-0">
                            <span className="flex items-center gap-1 shrink-0">
                                <Clock className="h-3.5 w-3.5 opacity-70" />
                                {formatTime(transaction.date)}
                            </span>

                            {hasContext && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                                    <span className="flex items-center gap-1 font-medium hover:text-foreground transition-colors truncate">
                                        {isExpanded ? (
                                            <><ChevronUp className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Ocultar</span></>
                                        ) : (
                                            <><ChevronDown className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Resumen</span></>
                                        )}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:bg-bg-primary hover:text-foreground shrink-0"
                                disabled={isLoading}
                                asChild
                            >
                                <NextLink href={`/financial/transactions/${transaction.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Detalles</span>
                                </NextLink>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:bg-bg-primary hover:text-foreground shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Opciones</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                    {transaction.status === "DETECTED" && (
                                        <DropdownMenuItem
                                            onClick={() => handleAction(reviewTransactionAction, "Transacción marcada como revisada", "REVIEWED")}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Revisar
                                        </DropdownMenuItem>
                                    )}
                                    {transaction.status !== "ARCHIVED" && (
                                        <DropdownMenuItem
                                            onClick={() => handleAction(archiveTransactionAction, "Transacción archivada", "ARCHIVED")}
                                        >
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archivar
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => handleAction(softDeleteTransactionAction, "Transacción eliminada", "DELETED", true)}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
            </CardHeader>

            {/* ── Nivel 2: Detalles Extensos (Desplegable) ──────────────────── */}
            {isExpanded && (
                <CardContent className="space-y-4 px-4 py-3 sm:px-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="rounded-xl bg-bg-primary/50 p-3.5 border-none">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-accent-primary shrink-0" />
                            Resumen
                        </div>
                        <div className="w-full max-w-full overflow-hidden">
                            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words [word-break:break-word]">
                                {displayContext || "Sin resumen disponible para esta transacción."}
                            </p>
                        </div>
                    </div>

                    {/* Tags */}
                    {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {transaction.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="rounded-full text-[10px] px-2 py-0"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

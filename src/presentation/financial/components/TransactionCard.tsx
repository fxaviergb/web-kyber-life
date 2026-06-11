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

// Removed STATUS_CONFIG as it is no longer used


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
    const isWithdrawal = transaction.type === "WITHDRAWAL";
    const isNegative = isExpense || isWithdrawal;
    const typeLabel = TYPE_LABELS[transaction.type] ?? transaction.type;
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
                <div className="flex-1 w-full min-w-0 pb-3 block">
                    {/* Amount & Duplicate Icon (Floated Right) */}
                    <div className="float-right ml-3 mb-1 flex flex-col items-end shrink-0 mt-0.5">
                        <span
                            className={cn(
                                "text-sm sm:text-base font-bold tracking-tight whitespace-nowrap",
                                isIncome ? "text-emerald-500" : isExpense ? "text-rose-500" : isWithdrawal ? "text-indigo-400" : "text-amber-500"
                            )}
                            title={formatAmount(transaction.amount, transaction.currency)}
                        >
                            {isIncome ? "+" : isNegative ? "-" : ""}
                            {formatAmount(transaction.amount, transaction.currency)}
                        </span>
                        {transaction.possibleDuplicate && transaction.status !== "DUPLICATE" && (
                            <AlertCircle className="h-4 w-4 text-warning-text shrink-0 mt-1" />
                        )}
                    </div>

                    {/* Title (Description) */}
                    <CardTitle
                        className={cn(
                            "text-base sm:text-lg tracking-tight line-clamp-3 font-semibold break-words transition-colors leading-tight mt-0.5",
                            hasContext && "group-hover/card:text-accent-primary"
                        )}
                        title={displayTitle}
                    >
                        {displayTitle}
                    </CardTitle>

                    {/* Subtitle (Institution / Merchant) */}
                    <div className="mt-1">
                        <span className="line-clamp-3 break-words text-sm font-medium text-zinc-300" title={transaction.merchant || typeLabel}>
                            {transaction.merchant || typeLabel}
                        </span>
                    </div>
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

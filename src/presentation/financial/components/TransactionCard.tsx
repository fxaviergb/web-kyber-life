"use client";

import { useState } from "react";
import NextLink from "next/link";

import { FinancialTransaction } from "@/domain/entities/financial";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    CalendarDays,
    Wallet,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Archive,
    Trash2,
    Eye,
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
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

/**
 * Extract the best available context from a transaction.
 * Priority: originStats.emailBody → originStats.snippet → notes
 */
function extractContext(tx: FinancialTransaction): string {
    const stats = tx.originStats as Record<string, unknown> | null | undefined;
    const emailBody = stats?.emailBody as string | undefined;
    const snippet = stats?.snippet as string | undefined;
    return emailBody || snippet || tx.notes || "";
}

// ─── Component ────────────────────────────────────────────────

export function TransactionCard({
    transaction,
    onStatusChange,
    onDeleted,
}: TransactionCardProps) {
    const [isLoading, setIsLoading] = useState(false);

    const isIncome = ["INCOME", "DEPOSIT", "REFUND"].includes(transaction.type);
    const statusCfg = STATUS_CONFIG[transaction.status] ?? STATUS_CONFIG.DETECTED;
    const typeLabel = TYPE_LABELS[transaction.type] ?? transaction.type;
    const typeBadgeVariant = getTypeBadgeVariant(transaction.type);
    const displayContext = extractContext(transaction);

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
                toast.success(successMessage);
                if (statusUpdate && onStatusChange) onStatusChange(statusUpdate);
                if (isDelete && onDeleted) onDeleted();
            } else {
                toast.error(res.error || "Ocurrió un error");
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card
            className={cn(
                "group relative overflow-hidden rounded-[1.75rem] border-border/60 bg-bg-secondary py-0 shadow-sm shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                isLoading && "opacity-60 pointer-events-none",
            )}
        >
            {/* Decorative gradient line */}
            <div
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent"
                aria-hidden="true"
            />

            {/* ── Header ───────────────────────────────────── */}
            <CardHeader className="gap-3 border-b border-border/50 px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-3">
                    {/* Top row: Checkbox + Status badge + Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant={statusCfg.variant}
                            className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] shrink-0"
                        >
                            {statusCfg.label}
                        </Badge>
                        {transaction.possibleDuplicate && transaction.status !== "DUPLICATE" && (
                            <Badge
                                variant="warning"
                                className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] shrink-0 gap-1"
                            >
                                <AlertCircle className="h-3 w-3" />
                                Posible Duplicado
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-row items-start justify-between gap-3">
                        {/* Left: Info */}
                        <div className="space-y-2 min-w-0 flex-1">
                            {/* Merchant name */}
                            <div className="space-y-1">
                                <CardTitle className="text-lg tracking-tight sm:text-xl truncate">
                                    {transaction.merchant || typeLabel}
                                </CardTitle>
                            </div>

                            {/* Date + Type badges */}
                            <CardDescription className="flex flex-col gap-1.5 text-xs sm:text-sm pt-1">
                                <div className="flex items-center gap-1.5 w-full">
                                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{formatDate(transaction.date)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 w-full">
                                    <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="text-muted-foreground shrink-0">Tipo:</span>
                                    <Badge
                                        variant={typeBadgeVariant}
                                        className="text-[10px] sm:text-xs px-2 py-0.5 shrink-0 truncate max-w-[120px]"
                                    >
                                        {typeLabel}
                                    </Badge>
                                </div>
                            </CardDescription>
                        </div>

                        {/* Right: Amount pill */}
                        <div className="flex min-w-[90px] shrink-0 flex-col rounded-2xl bg-bg-primary/50 px-3 py-2.5 text-right border-none justify-center">
                            <div className="flex items-center justify-end gap-3">
                                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                    Monto
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-end gap-1">
                                <span
                                    className={cn(
                                        "text-base sm:text-lg font-semibold tracking-tight",
                                        isIncome && "text-emerald-500",
                                    )}
                                >
                                    {isIncome ? "+" : ""}
                                    {formatAmount(transaction.amount, transaction.currency)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            {/* ── Content: Notes / Context ──────────────────── */}
            <CardContent className="space-y-4 px-5 py-3 sm:px-6">
                <div className="rounded-[1.35rem] bg-bg-primary/50 p-4 border-none">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                        Contexto extraído
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
                        {displayContext || "Sin contexto disponible para esta transacción."}
                    </p>
                </div>

                {/* Tags */}
                {transaction.tags && transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {transaction.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className="rounded-full text-[10px] px-2 py-0.5"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* ── Footer ───────────────────────────────────── */}
            <CardFooter className="flex flex-row items-center w-full gap-1.5 sm:gap-2 border-t border-border/50 px-3 py-3 sm:px-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 shrink text-muted-foreground hover:text-foreground px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                    disabled={isLoading}
                    asChild
                >
                    <NextLink href={`/financial/transactions/${transaction.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span className="truncate">Detalles</span>
                    </NextLink>
                </Button>

                {transaction.status === "DETECTED" && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 shrink rounded-xl border-border/50 hover:bg-bg-primary px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                        onClick={() =>
                            handleAction(
                                reviewTransactionAction,
                                "Transacción marcada como revisada",
                                "REVIEWED",
                            )
                        }
                        disabled={isLoading}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="truncate">Revisar</span>
                    </Button>
                )}
                {transaction.status !== "ARCHIVED" && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 shrink rounded-xl border-border/50 hover:bg-bg-primary px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                        onClick={() =>
                            handleAction(
                                archiveTransactionAction,
                                "Transacción archivada",
                                "ARCHIVED",
                            )
                        }
                        disabled={isLoading}
                    >
                        <Archive className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="truncate">Archivar</span>
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 shrink rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                    onClick={() =>
                        handleAction(
                            softDeleteTransactionAction,
                            "Transacción eliminada",
                            "DELETED",
                            true,
                        )
                    }
                    disabled={isLoading}
                >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span className="truncate">Eliminar</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

"use client";

import { useState } from "react";
import NextLink from "next/link";

import { FinancialTransaction } from "@/domain/entities/financial";
import { Badge } from "@/components/ui/badge";
import {
    ArrowDownRight,
    ArrowUpRight,
    RefreshCw,
    CreditCard,
    MoreHorizontal,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    reviewTransactionAction,
    archiveTransactionAction,
    softDeleteTransactionAction,
    updateTransactionAction
} from "@/app/actions/financial-transactions";

interface TransactionCardProps {
    transaction: FinancialTransaction;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    onEdit?: () => void;
    onStatusChange?: (status: FinancialTransaction['status']) => void;
    onDeleted?: () => void;
}

export function TransactionCard({
    transaction,
    isSelected = false,
    onToggleSelect,
    onEdit,
    onStatusChange,
    onDeleted
}: TransactionCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isIncome = transaction.type === 'INCOME' || transaction.type === 'DEPOSIT' || transaction.type === 'REFUND';
    const isExpense = transaction.type === 'EXPENSE' || transaction.type === 'PAYMENT' || transaction.type === 'WITHDRAWAL' || transaction.type === 'FEE' || transaction.type === 'TAX';

    // Status visual indicators
    const statusConfig = {
        DETECTED: { color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: AlertCircle, label: "Nueva" },
        REVIEWED: { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: CheckCircle2, label: "Revisada" },
        CONFIRMED: { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2, label: "Confirmada" },
        REJECTED: { color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertCircle, label: "Rechazada" },
        DUPLICATE: { color: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: AlertCircle, label: "Duplicada" },
        ARCHIVED: { color: "bg-slate-500/10 text-slate-600 dark:text-slate-400", icon: CheckCircle2, label: "Archivada" },
        MANUAL: { color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", icon: CheckCircle2, label: "Manual" },
        DELETED: { color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertCircle, label: "Eliminada" }
    };

    const config = statusConfig[transaction.status] || statusConfig.DETECTED;
    const StatusIcon = config.icon;

    const handleAction = async (
        actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
        successMessage: string,
        statusUpdate?: FinancialTransaction['status'],
        isDelete = false
    ) => {
        setIsLoading(true);
        try {
            const res = await actionFn(transaction.id!);
            if (res.success) {
                toast.success(successMessage);
                if (statusUpdate && onStatusChange) {
                    onStatusChange(statusUpdate);
                }
                if (isDelete && onDeleted) {
                    onDeleted();
                }
            } else {
                toast.error(res.error || "Ocurrió un error");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn(
            "group relative flex items-center justify-between p-4 rounded-xl bg-card border transition-all duration-200 hover:shadow-sm",
            isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-border",
            isLoading && "opacity-60 pointer-events-none"
        )}>
            <div className="flex items-center gap-4">
                {onToggleSelect && (
                    <div className="pl-1">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelect}
                            className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
                        />
                    </div>
                )}
                <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full",
                    isIncome ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        isExpense ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                            "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                )}>
                    {isIncome ? <ArrowDownRight className="w-6 h-6" /> :
                        isExpense ? <ArrowUpRight className="w-6 h-6" /> :
                            transaction.type === 'TRANSFER' ? <RefreshCw className="w-6 h-6" /> :
                                <CreditCard className="w-6 h-6" />}
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-foreground text-base">
                        {transaction.merchant || transaction.type}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                            {transaction.notes || "Sin categoría"}
                        </span>
                        {['DETECTED', 'MANUAL', 'DUPLICATE', 'REJECTED', 'REVIEWED'].includes(transaction.status) && (
                            <Badge variant="outline" className={cn("text-[10px] uppercase h-5 px-1.5", config.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
                            </Badge>
                        )}
                        {transaction.possibleDuplicate && transaction.status !== 'DUPLICATE' && (
                            <Badge variant="outline" className="text-[10px] uppercase h-5 px-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Posible Duplicado
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "font-semibold text-base",
                        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    )}>
                        {isIncome ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase mt-1">
                        {transaction.currency}
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acciones</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {transaction.status === 'DETECTED' && (
                            <DropdownMenuItem onClick={() => handleAction(reviewTransactionAction, "Transacción marcada como revisada", "REVIEWED")}>
                                Revisar
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <NextLink href={`/financial/transactions/${transaction.id}`}>
                                Ver detalles
                            </NextLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onEdit}>
                            Editar detalles rápido
                        </DropdownMenuItem>
                        {transaction.status !== 'ARCHIVED' && (
                            <DropdownMenuItem onClick={() => handleAction(archiveTransactionAction, "Transacción archivada", "ARCHIVED")}>
                                Archivar
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleAction(softDeleteTransactionAction, "Transacción eliminada", "DELETED", true)}
                        >
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

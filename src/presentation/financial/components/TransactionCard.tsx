"use client";

import { useState } from "react";
import { FinancialTransaction, FinancialTransactionType, FinancialTransactionStatus } from "@/domain/entities/financial";
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
import { cn } from "@/lib/utils";

interface TransactionCardProps {
    transaction: FinancialTransaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
    const isIncome = transaction.type === 'INCOME' || transaction.type === 'DEPOSIT' || transaction.type === 'REFUND';
    const isExpense = transaction.type === 'EXPENSE' || transaction.type === 'PAYMENT' || transaction.type === 'WITHDRAWAL' || transaction.type === 'FEE' || transaction.type === 'TAX';
    
    // Status visual indicators
    const statusConfig = {
        DETECTED: { color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: AlertCircle, label: "New" },
        REVIEWED: { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: CheckCircle2, label: "Reviewed" },
        CONFIRMED: { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2, label: "Confirmed" },
        REJECTED: { color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertCircle, label: "Rejected" },
        DUPLICATE: { color: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: AlertCircle, label: "Duplicate" },
        ARCHIVED: { color: "bg-slate-500/10 text-slate-600 dark:text-slate-400", icon: CheckCircle2, label: "Archived" },
        MANUAL: { color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", icon: CheckCircle2, label: "Manual" },
        DELETED: { color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertCircle, label: "Deleted" }
    };

    const config = statusConfig[transaction.status] || statusConfig.DETECTED;
    const StatusIcon = config.icon;

    return (
        <div className="group relative flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center gap-4">
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
                            {transaction.notes || "No category"}
                        </span>
                        {transaction.status === 'DETECTED' && (
                            <Badge variant="outline" className={cn("text-[10px] uppercase h-5 px-1.5", config.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
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
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Review</DropdownMenuItem>
                        <DropdownMenuItem>Edit Category</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Mark as Duplicate</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Archive, Trash2, Edit } from "lucide-react";
import { FinancialTransaction } from "@/domain/entities/financial";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
    reviewTransactionAction, 
    archiveTransactionAction, 
    softDeleteTransactionAction,
    updateTransactionAction
} from "@/app/actions/financial-transactions";
import { TransactionEditModal } from "./TransactionEditModal";

interface TransactionActionButtonsProps {
    transaction: FinancialTransaction;
}

export function TransactionActionButtons({ transaction }: TransactionActionButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const handleAction = async (actionFn: (id: string) => Promise<any>, successMessage: string) => {
        setIsLoading(true);
        try {
            const res = await actionFn(transaction.id!);
            if (res.success) {
                toast.success(successMessage);
                router.refresh();
            } else {
                toast.error(res.error || "Ocurrió un error");
            }
        } catch (e) {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-2 mt-4">
                {transaction.status === 'DETECTED' && (
                    <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => handleAction(reviewTransactionAction, "Transacción marcada como revisada")}
                        disabled={isLoading}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Revisar
                    </Button>
                )}
                <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditModalOpen(true)}
                    disabled={isLoading}
                >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                </Button>
                {transaction.status !== 'ARCHIVED' && (
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAction(archiveTransactionAction, "Transacción archivada")}
                        disabled={isLoading}
                    >
                        <Archive className="w-4 h-4 mr-2" />
                        Archivar
                    </Button>
                )}
                {transaction.status !== 'DELETED' && (
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleAction(softDeleteTransactionAction, "Transacción eliminada")}
                        disabled={isLoading}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                    </Button>
                )}
            </div>

            {isEditModalOpen && (
                <TransactionEditModal
                    isOpen={isEditModalOpen}
                    transaction={transaction}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        router.refresh();
                    }}
                />
            )}
        </>
    );
}

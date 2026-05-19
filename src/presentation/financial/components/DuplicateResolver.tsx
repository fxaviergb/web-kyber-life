"use client";

import { useState } from "react";
import { markAsDuplicateAction, resolveDuplicateAction } from "@/app/actions/financial-transactions";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface DuplicateResolverProps {
    transactionId: string;
    isPossibleDuplicate: boolean;
    onResolved?: () => void;
}

export function DuplicateResolver({ transactionId, isPossibleDuplicate, onResolved }: DuplicateResolverProps) {
    const [processing, setProcessing] = useState(false);

    if (!isPossibleDuplicate) return null;

    const handleConfirmDuplicate = async () => {
        setProcessing(true);
        const result = await markAsDuplicateAction(transactionId, transactionId);
        if (result.success) {
            toast.success("Transaction marked as duplicate");
            onResolved?.();
        } else {
            toast.error(result.error ?? "Failed to mark as duplicate");
        }
        setProcessing(false);
    };

    const handleNotDuplicate = async () => {
        setProcessing(true);
        const result = await resolveDuplicateAction(transactionId);
        if (result.success) {
            toast.success("Duplicate flag resolved — transaction confirmed");
            onResolved?.();
        } else {
            toast.error(result.error ?? "Failed to resolve duplicate");
        }
        setProcessing(false);
    };

    return (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Possible Duplicate Detected
                </p>
            </div>
            <p className="text-xs text-muted-foreground">
                This transaction has the same amount, date, merchant, and type as another existing transaction.
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConfirmDuplicate}
                    disabled={processing}
                    className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Yes, it&apos;s a duplicate
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNotDuplicate}
                    disabled={processing}
                    className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Not a duplicate
                </Button>
            </div>
        </div>
    );
}

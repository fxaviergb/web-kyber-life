"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditTrail } from "./AuditTrail";
import { DuplicateResolver } from "./DuplicateResolver";
import { History } from "lucide-react";
import { useRouter } from "next/navigation";

interface TransactionDetailClientProps {
    transactionId: string;
    isPossibleDuplicate: boolean;
}

export function TransactionDetailClient({ transactionId, isPossibleDuplicate }: TransactionDetailClientProps) {
    const router = useRouter();

    const handleDuplicateResolved = () => {
        router.refresh();
    };

    return (
        <>
            {/* Duplicate Resolution Banner */}
            <DuplicateResolver
                transactionId={transactionId}
                isPossibleDuplicate={isPossibleDuplicate}
                onResolved={handleDuplicateResolved}
            />

            {/* Audit Trail Card */}
            <Card className="shadow-sm border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-primary/70" />
                        Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AuditTrail transactionId={transactionId} />
                </CardContent>
            </Card>
        </>
    );
}

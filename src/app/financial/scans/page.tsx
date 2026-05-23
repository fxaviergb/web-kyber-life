import { Metadata } from "next";
import { FinancialInbox } from "@/presentation/financial/components/FinancialInbox";
import { Suspense } from "react";
import { Inbox as InboxIcon } from "lucide-react";

export const metadata: Metadata = {
    title: "Bandeja de escaneos financieros - KyberLife",
    description: "Revisa y asigna transacciones financieras escaneadas",
};

export default function ScansInboxPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <InboxIcon className="h-8 w-8 text-primary" />
                        Bandeja de escaneos
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Revisa las transacciones extraídas por escaneos automáticos y asígnalas a tus cuentas.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <Suspense fallback={<div className="p-8 text-center animate-pulse">Cargando bandeja...</div>}>
                    <FinancialInbox />
                </Suspense>
            </div>
        </div>
    );
}

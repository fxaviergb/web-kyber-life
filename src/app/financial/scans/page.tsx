import { Metadata } from "next";
import { FinancialInbox } from "@/presentation/financial/components/FinancialInbox";
import { Suspense } from "react";
import { Inbox as InboxIcon, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInstitutionsAction, getAccountsAction, getCategoriesAction } from "@/app/actions/financial-settings";

export const metadata: Metadata = {
    title: "Bandeja de escaneos financieros - KyberLife",
    description: "Revisa y asigna transacciones financieras escaneadas",
};

export default async function ScansInboxPage() {
    // Obtener configuración para pasarla a la bandeja
    const [institutions, accounts, categories] = await Promise.all([
        getInstitutionsAction(),
        getAccountsAction(),
        getCategoriesAction()
    ]);

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
                
                <Link href="/financial/scanner">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-medium shadow-sm transition-all">
                        <Search className="w-4 h-4" />
                        Iniciar Escaneo
                    </Button>
                </Link>
            </div>

            <div className="mt-8">
                <Suspense fallback={<div className="p-8 text-center animate-pulse">Cargando bandeja...</div>}>
                    <FinancialInbox 
                        institutions={institutions}
                        accounts={accounts}
                        categories={categories}
                    />
                </Suspense>
            </div>
        </div>
    );
}

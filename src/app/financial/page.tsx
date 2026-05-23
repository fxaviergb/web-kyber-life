import { Suspense } from "react";
import { FinancialDashboard } from "@/presentation/financial/components/FinancialDashboard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Inbox as InboxIcon, Plus } from "lucide-react";
import Link from "next/link";

export default function FinancialOverviewPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resumen financiero</h1>
                    <p className="text-muted-foreground mt-1">
                        Controla tus ingresos, gastos y salud financiera de un vistazo.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/financial/scans">
                            <InboxIcon className="mr-2 h-4 w-4" />
                            Bandeja
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/financial/transactions">
                            Transacciones
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/financial/transactions/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar
                        </Link>
                    </Button>
                </div>
            </div>

            <Suspense fallback={
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                        ))}
                    </div>
                    <div className="h-96 rounded-lg bg-muted animate-pulse" />
                </div>
            }>
                <FinancialDashboard />
            </Suspense>
        </div>
    );
}

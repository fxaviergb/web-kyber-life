import { Suspense } from "react";
import { TransactionTimeline } from "@/presentation/financial/components/TransactionTimeline";
import { TransactionFilters } from "@/presentation/financial/components/TransactionFilters";
import { searchPaginatedTransactionsAction } from "@/app/actions/financial-transactions";
import { Button } from "@/components/ui/button";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import Link from "next/link";
import { TransactionTabs } from "@/presentation/financial/components/TransactionTabs";

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const query = typeof params.query === 'string' ? params.query : undefined;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const type = typeof params.type === 'string' ? params.type : undefined;
    const currency = typeof params.currency === 'string' ? params.currency : undefined;
    const dateFrom = typeof params.dateFrom === 'string' ? params.dateFrom : undefined;
    const dateTo = typeof params.dateTo === 'string' ? params.dateTo : undefined;

    // Server-side paginated first page
    const initialResult = await searchPaginatedTransactionsAction({
        query,
        status,
        type,
        currency,
        dateFrom,
        dateTo,
        page: 1,
        pageSize: 20,
    });

    const initialTransactions = initialResult.success && initialResult.data
        ? initialResult.data.data
        : [];

    // Pass URL filters so the infinite-scroll can re-apply them
    const searchFilters = { query, status, type, currency, dateFrom, dateTo };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
                    <p className="text-muted-foreground mt-2">
                        Revisa y gestiona tus transacciones financieras.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 mt-4 sm:mt-0">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/financial/scans">
                            <InboxIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">Bandeja de escaneos</span>
                        </Link>
                    </Button>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/financial/transactions/new">
                            <Plus className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">Agregar transacción</span>
                        </Link>
                    </Button>
                </div>
            </div>

            <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded-md" />}>
                <TransactionTabs>
                    <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded-md" />}>
                        <TransactionFilters />
                    </Suspense>

                    <Suspense fallback={<div className="h-40 flex items-center justify-center">Cargando transacciones...</div>}>
                        <TransactionTimeline
                            key={JSON.stringify(params)}
                            initialTransactions={initialTransactions}
                            searchFilters={searchFilters}
                        />
                    </Suspense>
                </TransactionTabs>
            </Suspense>
        </div>
    );
}

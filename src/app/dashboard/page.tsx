
import { analyticsService, initializeContainer, purchaseRepository, genericItemRepository } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TrendingUp, CreditCard, Plus } from "lucide-react";
import { MetricCard } from "@/presentation/components/dashboard/metric-card";
import { SalesBarChart } from "@/presentation/components/dashboard/sales-bar-chart";
import { TopProductsChart } from "@/presentation/components/dashboard/top-products-chart";
import { RecentPurchasesCard } from "@/presentation/components/dashboard/recent-purchases-card";
import { TopExpensesCard } from "@/presentation/components/dashboard/top-expenses-card";
import { PriceHistoryCard } from "@/presentation/components/dashboard/price-history-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value;

    if (!userId) {
        redirect("/auth/login");
    }

    // Fetch Data: Get 7 months (Current + 6 previous)
    const monthlyData = await analyticsService.getMonthlyExpenses(userId, 7);
    const frequentProducts = await analyticsService.getFrequentProducts(userId, 'count', 6);

    // Bottom Row Data
    const recentPurchases = await purchaseRepository.findRecent(userId, 5);
    const topSpending = await analyticsService.getTopSpendingProducts(userId, 5);
    const allProducts = (await genericItemRepository.findByOwnerId(userId))
        .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName))
        .map(p => ({ id: p.id, name: p.canonicalName }));

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthEntry = monthlyData.history.find(h => h.month === currentMonthKey);
    const currentMonthSpending = currentMonthEntry ? currentMonthEntry.total : 0;

    // Calculate Average (Last 6 months, excluding current)
    const pastMonths = monthlyData.history.filter(h => h.month !== currentMonthKey);
    const totalPast = pastMonths.reduce((sum, h) => sum + h.total, 0);
    const averageSpending = pastMonths.length > 0 ? totalPast / pastMonths.length : 0;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Panel General</h1>
                    <p className="text-text-tertiary text-sm">Resumen de tu actividad y métricas clave.</p>
                </div>
                <Button asChild className="bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/20 rounded-full px-6">
                    <Link href="/market/purchases/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Compra
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Left Column Group */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Top Row: Metrics (Height controlled to match Target Chart visually if possible, or just standard) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <MetricCard
                            title="Promedio (6 meses)"
                            value={`$${averageSpending.toFixed(2)} `}
                            icon={TrendingUp}
                            iconClassName="text-accent-info"
                            trend={{ value: 5.2, label: "vs Año pas.", positive: true }}
                        />
                        <MetricCard
                            title="Gasto Mes Actual"
                            value={`$${currentMonthSpending.toFixed(2)} `}
                            icon={CreditCard}
                            iconClassName="text-accent-primary"
                            trend={{ value: 0, label: "En curso", positive: true }}
                        />
                    </div>
                    {/* Middle Row: Sales Bar Chart */}
                    <div className="h-[320px]">
                        <SalesBarChart data={monthlyData.history} />
                    </div>
                </div>

                {/* Right Column: Top Products */}
                <div className="lg:col-span-1 h-full min-h-[464px]">
                    <TopProductsChart data={frequentProducts.generics} />
                </div>
            </div>

            {/* Bottom Row: 3 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[400px]">
                <RecentPurchasesCard purchases={recentPurchases} />
                <TopExpensesCard products={topSpending} />
                <PriceHistoryCard initialProducts={allProducts} />
            </div>
        </div>
    );
}


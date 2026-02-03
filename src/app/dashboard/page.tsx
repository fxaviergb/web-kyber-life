
import { analyticsService, initializeContainer, purchaseRepository, genericItemRepository } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TrendingUp, CreditCard, Plus } from "lucide-react";
import { MetricsCarousel } from "@/presentation/components/dashboard/metrics-carousel";
import { SalesBarChart } from "@/presentation/components/dashboard/sales-bar-chart";
import { TopProductsChart } from "@/presentation/components/dashboard/top-products-chart";
import { RecentPurchasesCard } from "@/presentation/components/dashboard/recent-purchases-card";
import { TopExpensesCard } from "@/presentation/components/dashboard/top-expenses-card";
import { PriceHistoryCard } from "@/presentation/components/dashboard/price-history-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
    await initializeContainer();

    let userId: string | undefined;

    if (process.env.DATA_SOURCE === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
    } else {
        const cookieStore = await cookies();
        userId = cookieStore.get("kyber_session")?.value;
    }

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

    // Metric 1: Average vs Previous Month (Trend)
    const previousMonthEntry = pastMonths.length > 0 ? pastMonths[pastMonths.length - 1] : null;
    const previousMonthTotal = previousMonthEntry ? previousMonthEntry.total : 0;
    const avgTrendValue = averageSpending > 0 ? ((averageSpending - previousMonthTotal) / previousMonthTotal) * 100 : 0; // Growth of average? Or diff?
    // Let's do: (Last Month - Average) / Average -> "Last month was X% above average"
    const lastMonthVsAvg = averageSpending > 0 && previousMonthEntry ? ((previousMonthEntry.total - averageSpending) / averageSpending) * 100 : 0;

    // Metric 2: Current Month vs Average
    // If current > average, it's "red" usually (spending more), but user might see "green" as "active".
    // Let's standard: Higher spending = Red/Warning? Or just Neutral?
    // Let's use standard: +% is "vs Promedio".
    const currentVsAvg = averageSpending > 0 ? ((currentMonthSpending - averageSpending) / averageSpending) * 100 : 0;

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
                {/* 1. Metrics (Mobile: Top, Desktop: Top-Left) */}
                <div className="lg:col-span-2">
                    <MetricsCarousel
                        averageSpending={averageSpending}
                        currentMonthSpending={currentMonthSpending}
                        avgTrend={lastMonthVsAvg}
                        currentTrend={currentVsAvg}
                    />
                </div>

                {/* 2. Top Products (Mobile: Middle, Desktop: Right Side spanning 2 rows) */}
                <div className="lg:col-span-1 lg:row-span-2 h-full min-h-[464px]">
                    <TopProductsChart data={frequentProducts.generics} />
                </div>

                {/* 3. Sales Bar Chart (Mobile: Bottom, Desktop: Bottom-Left) */}
                <div className="lg:col-span-2 h-[320px]">
                    <SalesBarChart data={monthlyData.history} />
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


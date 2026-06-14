import { type ComponentProps } from "react";
import { MetricsCarousel } from "@/presentation/components/dashboard/metrics-carousel";
import { SalesBarChart } from "@/presentation/components/dashboard/sales-bar-chart";
import { TopProductsChart } from "@/presentation/components/dashboard/top-products-chart";
import { RecentPurchasesCard } from "@/presentation/components/dashboard/recent-purchases-card";
import { TopExpensesCard } from "@/presentation/components/dashboard/top-expenses-card";
import { TopCategoriesCard } from "@/presentation/components/dashboard/top-categories-card";
import { PriceHistoryCard } from "@/presentation/components/dashboard/price-history-card";
import { DashboardEmptyState } from "@/presentation/components/dashboard/empty-state";

interface MarketOverviewProps {
    monthly: { month: string; total: number }[];
    frequentProducts: { id: string; name: string; value: number }[];
    topCategories: { id: string; name: string; value: number; percentage: number }[];
    topSpending: { id: string; name: string; value: number }[];
    recentPurchases: ComponentProps<typeof RecentPurchasesCard>["purchases"];
    allProducts: { id: string; name: string }[];
    userFirstName?: string;
}

/**
 * Market overview grid — the widgets that previously lived on the main
 * dashboard, relocated here as the default "Resumen" tab of Market analytics.
 */
export function MarketOverview({
    monthly,
    frequentProducts,
    topCategories,
    topSpending,
    recentPurchases,
    allProducts,
    userFirstName,
}: MarketOverviewProps) {
    if (recentPurchases.length === 0) {
        return <DashboardEmptyState userFirstName={userFirstName} />;
    }

    // Metrics derived from the monthly history (current month + previous months).
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthEntry = monthly.find((h) => h.month === currentMonthKey);
    const currentMonthSpending = currentMonthEntry ? currentMonthEntry.total : 0;

    const pastMonths = monthly.filter((h) => h.month !== currentMonthKey);
    const totalPast = pastMonths.reduce((sum, h) => sum + h.total, 0);
    const averageSpending = pastMonths.length > 0 ? totalPast / pastMonths.length : 0;

    const previousMonthEntry = pastMonths.length > 0 ? pastMonths[pastMonths.length - 1] : null;
    const lastMonthVsAvg =
        averageSpending > 0 && previousMonthEntry
            ? ((previousMonthEntry.total - averageSpending) / averageSpending) * 100
            : 0;
    const currentVsAvg = averageSpending > 0 ? ((currentMonthSpending - averageSpending) / averageSpending) * 100 : 0;

    return (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Row 1: Metrics + Top products (spans two rows) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
                <MetricsCarousel
                    averageSpending={averageSpending}
                    currentMonthSpending={currentMonthSpending}
                    avgTrend={lastMonthVsAvg}
                    currentTrend={currentVsAvg}
                />
            </div>

            <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 h-full min-h-[300px]">
                <TopProductsChart data={frequentProducts} />
            </div>

            {/* Row 2: Categories + Top expenses */}
            <div className="col-span-1 min-h-[320px]">
                <TopCategoriesCard categories={topCategories} />
            </div>
            <div className="col-span-1 min-h-[320px]">
                <TopExpensesCard products={topSpending} />
            </div>

            {/* Row 3: Recent purchases + Monthly spend + Price history */}
            <div className="col-span-1 h-[400px]">
                <RecentPurchasesCard purchases={recentPurchases} />
            </div>
            <div className="col-span-1 h-[400px]">
                <SalesBarChart data={monthly} />
            </div>
            <div className="col-span-1 h-[400px]">
                <PriceHistoryCard initialProducts={allProducts} />
            </div>
        </div>
    );
}

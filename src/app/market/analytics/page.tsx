import { analyticsService, productService, purchaseRepository, masterDataService, userRepository, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseAnalytics } from "@/presentation/components/analytics/ExpenseAnalytics";
import { CategoryAnalytics } from "@/presentation/components/analytics/CategoryAnalytics";
import { ProductAnalytics } from "@/presentation/components/analytics/ProductAnalytics";
import { PriceAnalytics } from "@/presentation/components/analytics/PriceAnalytics";
import { MarketOverview } from "@/presentation/components/analytics/MarketOverview";
import { MarketDateFilterBar } from "@/presentation/components/analytics/MarketDateFilterBar";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AnalyticsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const startDate = typeof resolvedSearchParams.startDate === 'string' ? resolvedSearchParams.startDate : undefined;
    const endDate = typeof resolvedSearchParams.endDate === 'string' ? resolvedSearchParams.endDate : undefined;
    await initializeContainer();

    let userId: string | undefined;
    let userFirstName: string | undefined;

    if (process.env.DATA_SOURCE === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        userFirstName = user?.user_metadata?.first_name;
    } else {
        const cookieStore = await cookies();
        userId = cookieStore.get("kyber_session")?.value;
        if (userId) {
            const user = await userRepository.findById(userId);
            userFirstName = user?.firstName || undefined;
        }
    }

    if (!userId) {
        return <div className="p-8 text-white">Inicia sesión para ver analíticas.</div>;
    }

    const [
        monthlyData,
        categoryData,
        freqCountData,
        freqUnitsData,
        allBrandProducts,
        allGenericItems,
        overviewMonthly,
        topCategories,
        topSpending,
        recentPurchases,
        supermarkets,
    ] = await Promise.all([
        analyticsService.getMonthlyExpenses(userId, 6, startDate, endDate),
        analyticsService.getCategorySpending(userId, startDate, endDate),
        analyticsService.getFrequentProducts(userId, 'count', 6, startDate, endDate),
        analyticsService.getFrequentProducts(userId, 'units', 6, startDate, endDate),
        productService.getAllBrandProducts(userId),
        productService.getGenericItems(userId),
        analyticsService.getMonthlyExpenses(userId, 7, startDate, endDate),
        analyticsService.getTopCategories(userId, 5, startDate, endDate),
        analyticsService.getTopSpendingProducts(userId, 5, startDate, endDate),
        purchaseRepository.findRecent(userId, 5, startDate, endDate),
        masterDataService.getSupermarkets(userId),
    ]);

    const recentPurchasesMapped = recentPurchases.map(p => ({
        ...p,
        supermarketName: supermarkets.find(s => s.id === p.supermarketId)?.name || 'Sin supermercado'
    }));

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-text-1">Analítica</h1>
                <p className="text-text-3">Tu panel de Market: resumen e insights de tus compras y gastos.</p>
            </div>

            <MarketDateFilterBar />

            <Tabs defaultValue="resumen" className="space-y-6">
                <TabsList className="bg-bg-2 border border-border w-full p-1 h-auto flex flex-wrap">
                    <TabsTrigger value="resumen" className="flex-1">Resumen</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1">Gastos</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1">Categorías</TabsTrigger>
                    <TabsTrigger value="products" className="flex-1">Productos</TabsTrigger>
                </TabsList>

                {/* Flow 18: Global metrics */}
                <TabsContent value="resumen" className="animate-in fade-in duration-500">
                    <MarketOverview
                        monthly={overviewMonthly.history}
                        frequentProducts={freqCountData.generics}
                        topCategories={topCategories}
                        topSpending={topSpending}
                        recentPurchases={recentPurchasesMapped as any}
                        userFirstName={userFirstName}
                    />
                </TabsContent>

                {/* Flow 19: Expenses + Price Analysis */}
                <TabsContent value="expenses" className="animate-in fade-in duration-500 space-y-6">
                    <ExpenseAnalytics
                        data={monthlyData.history}
                        average={monthlyData.average}
                    />
                    <PriceAnalytics
                        searchableProducts={allBrandProducts}
                        searchableGenericItems={allGenericItems}
                    />
                </TabsContent>

                {/* Flow 20: Categories */}
                <TabsContent value="categories" className="animate-in fade-in duration-500">
                    <CategoryAnalytics data={categoryData} />
                </TabsContent>

                {/* Flow 21 & 22: Products */}
                <TabsContent value="products" className="animate-in fade-in duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProductAnalytics data={freqCountData} mode="count" />
                        <ProductAnalytics data={freqUnitsData} mode="units" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

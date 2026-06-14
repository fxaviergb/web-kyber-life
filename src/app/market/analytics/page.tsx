
import { analyticsService, productService, purchaseRepository, genericItemRepository, userRepository, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseAnalytics } from "@/presentation/components/analytics/ExpenseAnalytics";
import { CategoryAnalytics } from "@/presentation/components/analytics/CategoryAnalytics";
import { ProductAnalytics } from "@/presentation/components/analytics/ProductAnalytics";
import { PriceAnalytics } from "@/presentation/components/analytics/PriceAnalytics";
import { MarketOverview } from "@/presentation/components/analytics/MarketOverview";

export default async function AnalyticsPage() {
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
        genericItems,
    ] = await Promise.all([
        analyticsService.getMonthlyExpenses(userId, 6),
        analyticsService.getCategorySpending(userId),
        analyticsService.getFrequentProducts(userId, 'count'),
        analyticsService.getFrequentProducts(userId, 'units'),
        productService.getAllBrandProducts(userId),
        productService.getGenericItems(userId),
        analyticsService.getMonthlyExpenses(userId, 7),
        analyticsService.getTopCategories(userId, 5),
        analyticsService.getTopSpendingProducts(userId, 5),
        purchaseRepository.findRecent(userId, 5),
        genericItemRepository.findByOwnerId(userId),
    ]);

    const allProducts = genericItems
        .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName))
        .map(p => ({ id: p.id, name: p.canonicalName }));

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-text-1">Analítica</h1>
                <p className="text-text-3">Tu panel de Market: resumen e insights de tus compras y gastos.</p>
            </div>

            <Tabs defaultValue="resumen" className="space-y-6">
                <TabsList className="bg-bg-2 border border-border w-full md:w-auto p-1 h-auto flex flex-wrap justify-start md:inline-flex">
                    <TabsTrigger value="resumen" className="flex-1 md:flex-none">Resumen</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1 md:flex-none">Gastos</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1 md:flex-none">Categorías</TabsTrigger>
                    <TabsTrigger value="products" className="flex-1 md:flex-none">Productos</TabsTrigger>
                    <TabsTrigger value="prices" className="flex-1 md:flex-none">Precios</TabsTrigger>
                </TabsList>

                {/* Resumen: relocated dashboard overview (Market's own dashboard) */}
                <TabsContent value="resumen" className="animate-in fade-in duration-500">
                    <MarketOverview
                        monthly={overviewMonthly.history}
                        frequentProducts={freqCountData.generics}
                        topCategories={topCategories}
                        topSpending={topSpending}
                        recentPurchases={recentPurchases}
                        allProducts={allProducts}
                        userFirstName={userFirstName}
                    />
                </TabsContent>

                {/* Flow 19: Expenses */}
                <TabsContent value="expenses" className="animate-in fade-in duration-500">
                    <ExpenseAnalytics
                        data={monthlyData.history}
                        average={monthlyData.average}
                    />
                </TabsContent>

                {/* Flow 20: Categories */}
                <TabsContent value="categories" className="animate-in fade-in duration-500">
                    <CategoryAnalytics data={categoryData} />
                </TabsContent>

                {/* Flow 21: Products */}
                <TabsContent value="products" className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProductAnalytics data={freqCountData} mode="count" />
                        <ProductAnalytics data={freqUnitsData} mode="units" />
                    </div>
                </TabsContent>

                {/* Flow 22 & 23: Prices */}
                <TabsContent value="prices" className="animate-in fade-in duration-500">
                    <PriceAnalytics
                        searchableProducts={allBrandProducts}
                        searchableGenericItems={allGenericItems}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}


import { analyticsService, productService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseAnalytics } from "@/presentation/components/analytics/ExpenseAnalytics";
import { CategoryAnalytics } from "@/presentation/components/analytics/CategoryAnalytics";
import { ProductAnalytics } from "@/presentation/components/analytics/ProductAnalytics";
import { PriceAnalytics } from "@/presentation/components/analytics/PriceAnalytics";

export default async function AnalyticsPage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");

    // Redirect or show error if no session (middleware usually handles this, but for safety)
    if (!session || !session.value) {
        return <div className="p-8 text-white">Inicia sesión para ver analíticas.</div>;
    }
    const userId = session.value;

    const [
        monthlyData,
        categoryData,
        freqCountData,
        freqUnitsData,
        allBrandProducts,
        allGenericItems
    ] = await Promise.all([
        analyticsService.getMonthlyExpenses(userId, 6),
        analyticsService.getCategorySpending(userId),
        analyticsService.getFrequentProducts(userId, 'count'),
        analyticsService.getFrequentProducts(userId, 'units'),
        productService.getAllBrandProducts(userId),
        productService.getGenericItems(userId)
    ]);

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-text-1">Analítica</h1>
                <p className="text-text-3">Insights de tus compras y gastos.</p>
            </div>

            <Tabs defaultValue="expenses" className="space-y-6">
                <TabsList className="bg-bg-2 border border-border w-full md:w-auto p-1 h-auto flex flex-wrap justify-start md:inline-flex">
                    <TabsTrigger value="expenses" className="flex-1 md:flex-none">Gastos</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1 md:flex-none">Categorías</TabsTrigger>
                    <TabsTrigger value="products" className="flex-1 md:flex-none">Productos</TabsTrigger>
                    <TabsTrigger value="prices" className="flex-1 md:flex-none">Precios</TabsTrigger>
                </TabsList>

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
                    {/* For V1, showing two separate cards or toggable? 
                         Let's put them side by side on large screens or stacked. 
                         Or allow "ProductAnalytics" to take props.
                         Let's render two cards for clear comparison.
                     */}
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

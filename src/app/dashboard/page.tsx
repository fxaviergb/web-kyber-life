import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsService, purchaseService, initializeContainer } from "@/infrastructure/container"; // Assuming services exported
import { cookies } from "next/headers";
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from "lucide-react";
import { ExpenseChart } from "@/presentation/components/analytics/ExpenseChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value!;

    const monthlyData = await analyticsService.getMonthlyExpenses(userId, 6);
    const avgMonthly = monthlyData.average;

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthEntry = monthlyData.history.find(h => h.month === currentMonthKey);
    const currentMonthSpending = currentMonthEntry ? currentMonthEntry.total : 0;

    // Get recent purchases for list
    // purchaseRepo needed or add getRecent to purchaseService?
    // I added findRecent to repo but service doesn't expose it. 
    // I'll grab all purchases via repo (exported in container?) 
    // Container exports 'purchaseRepository'.
    // But cleaner to use service.
    // I'll assume purchaseService has a method or I export repo. Container exports repo constants.
    // I'll use purchaseService for cleanliness if possible, but I didn't add getRecent to service.
    // I'll cast/hack for V1 or use repo directly. Using repo directly in Page is OK for Server Components in this arch level.
    const { purchaseRepository } = await import("@/infrastructure/container");
    const recentPurchases = await purchaseRepository.findRecent(userId, 5);

    return (
        <div className="space-y-6 p-6 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button asChild className="bg-accent-violet hover:bg-accent-violet/90">
                        <Link href="/market/purchases/new">Nueva Compra</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-bg-1 border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-2">Gasto este mes</CardTitle>
                        <DollarSign className="h-4 w-4 text-accent-mint" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-text-1">${currentMonthSpending.toFixed(2)}</div>
                        <p className="text-xs text-text-3">
                            +0% respecto al mes pasado (Mock)
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-bg-1 border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-2">Promedio Mensual</CardTitle>
                        <TrendingUp className="h-4 w-4 text-accent-cyan" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-text-1">${avgMonthly.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-bg-1 border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-2">Compras Recientes</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-accent-coral" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-text-1">{recentPurchases.length}</div>
                        <p className="text-xs text-text-3">Últimas 5 mostradas</p>
                    </CardContent>
                </Card>
                <Card className="bg-bg-1 border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-2">Fecha</CardTitle>
                        <Calendar className="h-4 w-4 text-accent-magenta" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-text-1">{new Date().toLocaleDateString()}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-bg-1 border-border">
                    <CardHeader>
                        <CardTitle className="text-text-1">Resumen de Gastos</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* OverviewChart Component Placeholder */}
                        <div className="h-[200px]">
                            <ExpenseChart data={monthlyData.history} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-bg-1 border-border">
                    <CardHeader>
                        <CardTitle className="text-text-1">Últimas Compras</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentPurchases.length === 0 ? <p className="text-sm text-text-3">No hay compras recientes</p> : null}
                            {recentPurchases.map(p => (
                                <div key={p.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-text-1">{p.date}</p>
                                        <p className="text-xs text-text-3 leading-none capitalize">{p.status}</p>
                                    </div>
                                    <div className="font-bold text-accent-mint">
                                        ${(p.totalPaid || 0).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { analyticsService, purchaseService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from "lucide-react";
import { ExpenseChart } from "@/presentation/components/analytics/ExpenseChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value!;

    const monthlyData = await analyticsService.getMonthlyExpenses(userId, 6);
    const avgMonthly = monthlyData.average;

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthEntry = monthlyData.history.find(h => h.month === currentMonthKey);
    const currentMonthSpending = currentMonthEntry ? currentMonthEntry.total : 0;

    const { purchaseRepository } = await import("@/infrastructure/container");
    const recentPurchases = await purchaseRepository.findRecent(userId, 5);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Dashboard</h1>
                    <p className="text-text-tertiary mt-1">Bienvenido a tu panel de control</p>
                </div>
                <Button asChild>
                    <Link href="/market/purchases/new">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Nueva Compra
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Gasto este mes"
                    value={`$${currentMonthSpending.toFixed(2)}`}
                    icon={DollarSign}
                    description="Mes actual"
                    iconClassName="text-accent-success"
                />
                <StatCard
                    title="Promedio Mensual"
                    value={`$${avgMonthly.toFixed(2)}`}
                    icon={TrendingUp}
                    description="Últimos 6 meses"
                    iconClassName="text-accent-info"
                />
                <StatCard
                    title="Compras Recientes"
                    value={recentPurchases.length}
                    icon={ShoppingBag}
                    description="Últimas 5 compras"
                    iconClassName="text-accent-warning"
                />
                <StatCard
                    title="Fecha"
                    value={new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    icon={Calendar}
                    description={new Date().toLocaleDateString('es-ES', { weekday: 'long' })}
                    iconClassName="text-accent-danger"
                />
            </div>

            {/* Charts & Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Expense Chart */}
                <Card className="col-span-full lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-text-primary">Resumen de Gastos</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ExpenseChart data={monthlyData.history} />
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Purchases */}
                <Card className="col-span-full lg:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-text-primary">Últimas Compras</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/market/purchases">Ver todas</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentPurchases.length === 0 ? (
                                <p className="text-sm text-text-tertiary text-center py-8">
                                    No hay compras recientes
                                </p>
                            ) : null}
                            {recentPurchases.map(p => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between border-b border-border-base pb-3 last:border-0 last:pb-0 hover:bg-bg-hover/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                                >
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-medium text-text-primary">
                                            {new Date(p.date).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    p.status === 'completed' ? 'success' :
                                                        p.status === 'in_progress' ? 'warning' :
                                                            p.status === 'draft' ? 'info' :
                                                                'default'
                                                }
                                                className="text-xs"
                                            >
                                                {p.status === 'completed' ? 'Completada' :
                                                    p.status === 'in_progress' ? 'En progreso' :
                                                        p.status === 'draft' ? 'Borrador' :
                                                            'Planificada'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-accent-success">
                                            ${(p.totalPaid || 0).toFixed(2)}
                                        </div>
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

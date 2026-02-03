import { purchaseService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, ShoppingCart, Calendar, Package } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function PurchasesListPage() {
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

    const { purchaseRepository, supermarketRepository } = await import("@/infrastructure/container");
    const purchases = await purchaseRepository.findByOwnerId(userId);
    const supermarkets = await supermarketRepository.findByOwnerId(userId);
    const smMap = new Map(supermarkets.map(s => [s.id, s.name]));

    const draftPurchases = purchases.filter(p => p.status === 'draft').sort((a, b) => b.date.localeCompare(a.date));
    const completedPurchases = purchases.filter(p => p.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Compras</h1>
                    <p className="text-text-tertiary mt-1">Gestiona tus compras planificadas y completadas</p>
                </div>
                <Button asChild>
                    <Link href="/market/purchases/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Compra
                    </Link>
                </Button>
            </div>

            <div className="space-y-8">
                {/* Draft Purchases */}
                {draftPurchases.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-text-secondary mb-4">Planificadas</h2>
                        <div className="grid gap-4">
                            {draftPurchases.map(p => (
                                <Link key={p.id} href={`/market/purchases/${p.id}`}>
                                    <Card className="p-4 hover:shadow-xl transition-all duration-200 cursor-pointer border-l-4 border-l-accent-info">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-accent-info/10 rounded-full text-accent-info">
                                                    <ShoppingCart className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-text-primary">{smMap.get(p.supermarketId) || "Supermercado"}</h3>
                                                    <p className="text-sm text-text-tertiary flex items-center mt-1">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <Badge variant="info">Planificada</Badge>
                                                <p className="text-xl font-bold text-text-primary">
                                                    {p.totalPaid ? `$${p.totalPaid.toFixed(2)}` : "--"}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Purchases */}
                <div>
                    <h2 className="text-lg font-semibold text-text-secondary mb-4">Completadas</h2>
                    {completedPurchases.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No hay compras completadas"
                            description="Las compras finalizadas aparecerán aquí"
                        />
                    ) : (
                        <div className="grid gap-4">
                            {completedPurchases.map(p => (
                                <Link key={p.id} href={`/market/purchases/${p.id}`}>
                                    <Card className="p-4 hover:shadow-xl transition-all duration-200 cursor-pointer border-l-4 border-l-accent-success">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-accent-success/10 rounded-full text-accent-success">
                                                    <ShoppingCart className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-text-primary">{smMap.get(p.supermarketId) || "Supermercado"}</h3>
                                                    <p className="text-sm text-text-tertiary flex items-center mt-1">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <Badge variant="success">Completada</Badge>
                                                <p className="text-xl font-bold text-accent-success">
                                                    {p.totalPaid ? `$${p.totalPaid.toFixed(2)}` : "--"}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Empty state for no purchases at all */}
                {purchases.length === 0 && (
                    <EmptyState
                        icon={ShoppingCart}
                        title="No tienes compras registradas"
                        description="Comienza creando tu primera compra"
                        action={
                            <Button asChild>
                                <Link href="/market/purchases/new">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nueva Compra
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>
        </div>
    );
}

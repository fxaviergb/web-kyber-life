import { purchaseService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Calendar } from "lucide-react";

export default async function PurchasesListPage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value!;

    // We need findAll for user. I only exposed findRecent. Using PurchaseRepo directly is okay.
    const { purchaseRepository, supermarketRepository } = await import("@/infrastructure/container");
    const purchases = await purchaseRepository.findByOwnerId(userId);
    const supermarkets = await supermarketRepository.findByOwnerId(userId);
    const smMap = new Map(supermarkets.map(s => [s.id, s.name]));

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Historial de Compras</h2>
                <Link href="/market/purchases/new">
                    <Button className="bg-accent-violet"><Plus className="w-4 h-4 mr-2" /> Nueva Compra</Button>
                </Link>
            </div>

            <div className="space-y-8">
                {/* Active Purchases (Draft) */}
                <div>
                    <h3 className="text-lg font-semibold text-text-2 mb-4">En curso</h3>
                    <div className="grid gap-4">
                        {purchases.filter(p => p.status === 'draft').sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                            <Link key={p.id} href={`/market/purchases/${p.id}`}>
                                <div className="p-4 bg-bg-1 border border-border rounded-xl hover:border-accent-violet transition-colors group cursor-pointer relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-accent-gold" />
                                    <div className="flex justify-between items-center pl-3">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-secondary/20 rounded-full text-accent-gold group-hover:text-white transition-colors">
                                                <ShoppingCart className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-1">{smMap.get(p.supermarketId) || "Supermercado"}</h3>
                                                <p className="text-sm text-text-3 flex items-center mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" /> {p.date}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-accent-gold bg-accent-gold/10 px-2 py-1 rounded mb-1 inline-block">EN CURSO</span>
                                            <p className="text-xl font-bold text-text-1">
                                                {p.totalPaid ? `$${p.totalPaid.toFixed(2)}` : "--"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {purchases.filter(p => p.status === 'draft').length === 0 && (
                            <div className="py-8 text-center text-text-3 border border-dashed border-border rounded-xl text-sm">
                                No tienes compras activas.
                            </div>
                        )}
                    </div>
                </div>

                {/* History (Completed) */}
                <div>
                    <h3 className="text-lg font-semibold text-text-2 mb-4">Historial</h3>
                    <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                        {purchases.filter(p => p.status === 'completed').sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                            <Link key={p.id} href={`/market/purchases/${p.id}`}>
                                <div className="p-4 bg-bg-1 border border-border rounded-xl hover:border-accent-mint transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-secondary/10 rounded-full text-text-3 group-hover:text-accent-mint transition-colors">
                                                <ShoppingCart className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-1">{smMap.get(p.supermarketId) || "Supermercado"}</h3>
                                                <p className="text-sm text-text-3 flex items-center mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" /> {p.date}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-accent-mint bg-accent-mint/10 px-2 py-1 rounded mb-1 inline-block">COMPLETADA</span>
                                            <p className="text-xl font-bold text-text-1">
                                                {p.totalPaid ? `$${p.totalPaid.toFixed(2)}` : "--"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {purchases.filter(p => p.status === 'completed').length === 0 && (
                            <div className="py-8 text-center text-text-3 border border-dashed border-border rounded-xl text-sm">
                                No hay compras finalizadas.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

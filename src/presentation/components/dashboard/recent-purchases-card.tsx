import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Purchase {
    id: string;
    date: string;
    totalPaid: number | null;
    status: string;
}

interface RecentPurchasesCardProps {
    purchases: Purchase[];
}

export function RecentPurchasesCard({ purchases }: RecentPurchasesCardProps) {
    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-primary">Compras Recientes</h3>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-text-tertiary">
                    <Link href="/market/purchases">
                        <ArrowRight size={16} />
                    </Link>
                </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-bg-secondary">
                {purchases.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-8">No hay compras</p>
                ) : (
                    purchases.map((p) => {
                        const isCompleted = p.status.toLowerCase() === 'completed';
                        return (
                            <div key={p.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            {new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </p>
                                        <p className="text-xs text-text-tertiary">
                                            {new Date(p.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-text-primary">${(p.totalPaid || 0).toFixed(2)}</p>
                                    <Badge
                                        variant={isCompleted ? 'success' : 'warning'}
                                        className="text-[10px] h-5 px-1.5"
                                    >
                                        {isCompleted ? 'Completa' : 'En Curso'}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="pt-6 mt-2 border-t border-border-base">
                <Button variant="outline" className="w-full text-xs text-text-tertiary" asChild>
                    <Link href="/market/purchases">Ver reporte completo</Link>
                </Button>
            </div>
        </div>
    );
}

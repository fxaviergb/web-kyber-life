import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopExpensesCardProps {
    products: { id: string; name: string; value: number }[];
}

export function TopExpensesCard({ products }: TopExpensesCardProps) {
    const maxVal = Math.max(...products.map(p => p.value), 1);

    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Mayor Gasto</h3>
                    <p className="text-xs text-text-tertiary">Productos con más inversión</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary">
                    <MoreVertical size={16} />
                </Button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pr-2 scrollbar-thin">
                {products.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-8">Sin datos</p>
                ) : (
                    products.map((p) => (
                        <div key={p.id} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-text-primary truncate max-w-[150px]">{p.name}</span>
                                <span className="font-bold text-text-primary">${p.value.toFixed(2)}</span>
                            </div>
                            <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent-primary rounded-full"
                                    style={{ width: `${(p.value / maxVal) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>


        </div>
    );
}

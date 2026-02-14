import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopCategoriesCardProps {
    categories: { id: string; name: string; value: number; percentage: number }[];
}

const COLORS = [
    'bg-accent-primary',   // Blue/Indigo
    'bg-accent-success',   // Green
    'bg-accent-violet',    // Violet
    'bg-accent-danger',    // Red
    'bg-accent-warning',   // Orange/Yellow
    'bg-[#FF6B6B]',       // Coral
    'bg-[#4ECDC4]',       // Teal
    'bg-[#45B7D1]',       // Light Blue
];

export function TopCategoriesCard({ categories }: TopCategoriesCardProps) {
    const maxVal = Math.max(...categories.map(c => c.value), 1);

    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Categorías Top</h3>
                    <p className="text-xs text-text-tertiary">Mayor gasto por categoría</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary">
                    <MoreVertical size={16} />
                </Button>
            </div>

            <div className="flex-1 space-y-5">
                {categories.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-8">Sin datos</p>
                ) : (
                    categories.map((c, index) => {
                        const colorClass = COLORS[index % COLORS.length];

                        return (
                            <div key={c.id} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-text-primary truncate max-w-[150px]">{c.name}</span>
                                    <span className="font-bold text-text-primary">${c.value.toFixed(2)}</span>
                                </div>
                                <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${colorClass}`}
                                        style={{ width: `${(c.value / maxVal) * 100}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

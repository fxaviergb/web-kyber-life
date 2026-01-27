"use client";

import { useTransition, useState } from "react";
import { addTemplateItemAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Check } from "lucide-react";
import { GenericItem, Unit } from "@/domain/entities";
import { cn } from "@/lib/utils";

interface AddItemFormProps {
    templateId: string;
    genericItems: GenericItem[];
    units: Unit[]; // Kept for future detailed edit if needed
    onSuccess?: () => void;
}

export function AddItemForm({ templateId, genericItems, units, onSuccess }: AddItemFormProps) {
    const [search, setSearch] = useState("");
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const handleQuickAdd = (itemId: string) => {
        setPendingIds(prev => new Set(prev).add(itemId));
        startTransition(async () => {
            const formData = new FormData();
            formData.append("genericItemId", itemId);
            formData.append("defaultQty", "1"); // Default to 1
            // Default unit will be handled by backend logic if omitted, or we can pass null.

            const res = await addTemplateItemAction(templateId, null, formData);

            setPendingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });

            if (res.success) {
                setAddedIds(prev => new Set(prev).add(itemId));
                // Optional: Clear search or keep it focus?
                // keeping focus allows adding multiple items
            } else {
                console.error(res.error);
                // Maybe show error toast?
            }
        });
    };

    const filteredItems = genericItems
        .filter(item =>
            item.canonicalName.toLowerCase().includes(search.toLowerCase()) ||
            item.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
        ).slice(0, 10);

    return (
        <div className="space-y-4 py-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <Input
                    placeholder="Buscar producto (ej. Leche)..."
                    className="pl-9 bg-bg-2 border-border"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {filteredItems.map(item => {
                    const isAdded = addedIds.has(item.id);
                    const isItemPending = pendingIds.has(item.id);

                    return (
                        <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-between items-center text-text-1 hover:bg-bg-2",
                                isAdded && "text-accent-mint bg-accent-mint/5"
                            )}
                            onClick={() => !isAdded && !isItemPending && handleQuickAdd(item.id)}
                            disabled={isAdded || isItemPending}
                        >
                            <span className="truncate">{item.canonicalName}</span>

                            {isItemPending ? (
                                <Loader2 className="w-4 h-4 animate-spin text-accent-violet" />
                            ) : isAdded ? (
                                <span className="flex items-center text-xs text-accent-mint font-medium">
                                    <Check className="w-4 h-4 mr-1" /> Agregado
                                </span>
                            ) : (
                                <Plus className="w-4 h-4 text-text-3 opacity-50 group-hover:opacity-100" />
                            )}
                        </Button>
                    );
                })}
                {search && filteredItems.length === 0 && (
                    <p className="text-center py-4 text-sm text-text-3">No hay resultados</p>
                )}
                {!search && (
                    <p className="text-xs text-text-3 text-center pt-2">Escribe para buscar productos</p>
                )}
            </div>
        </div>
    );
}

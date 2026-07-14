"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { withSelectedFirst } from "@/lib/utils";
import { resolveFinancialIcon } from "@/presentation/financial/lib/financial-icons";
import { getCategoriesAction, createCategoryAction } from "@/app/actions/financial-settings";
import type { FinancialCategory } from "@/domain/entities/financial";
import { PickerGridTile, PickerMoreTile, PickerCreateButton, PickerEmptyHint } from "./picker-tiles";

const PREVIEW_COUNT = 7;
const FALLBACK_COLOR = "#64748b";

export interface CategoryPickerProps {
    /** The owner's categories (already excluding deleted ones). */
    categories: FinancialCategory[];
    /** Selected category name (the actual form value). Empty string = none. */
    value: string;
    onSelect: (name: string) => void;
    /** Called after creating a new category so the parent's copy stays in sync. */
    onCategoriesChange: (categories: FinancialCategory[]) => void;
    /** Search text, controlled by the parent so it can reset it on re-entry into this field. */
    query: string;
    onQueryChange: (query: string) => void;
}

/**
 * Search + grid picker for a "which category" field: shows the most relevant
 * categories as tappable, color-coded tiles (selected one first), lets the
 * user search, or create a brand-new category on the fly. Clicking the
 * already-selected tile again clears the selection.
 */
export function CategoryPicker({ categories, value, onSelect, onCategoriesChange, query, onQueryChange }: CategoryPickerProps) {
    const [showAll, setShowAll] = useState(false);
    const [creating, setCreating] = useState(false);

    const ordered = useMemo(() => withSelectedFirst(categories, value), [categories, value]);

    const q = query.trim().toLowerCase();
    const matched = useMemo(
        () => (q ? ordered.filter((c) => c.name.toLowerCase().includes(q)) : ordered),
        [ordered, q],
    );
    const visible = q ? matched : (showAll ? ordered : ordered.slice(0, PREVIEW_COUNT));
    const exactExists = categories.some((c) => c.name.trim().toLowerCase() === q);

    const handleSelect = (name: string, selected: boolean) => {
        onSelect(selected ? "" : name);
        onQueryChange("");
    };

    const handleCreate = async () => {
        const name = query.trim();
        if (!name || creating) return;
        setCreating(true);
        try {
            await createCategoryAction({ name });
            const fresh = await getCategoriesAction();
            onCategoriesChange(fresh.filter((c) => !c.isDeleted));
            onSelect(name);
            onQueryChange("");
            toast.success(`Categoría "${name}" creada`);
        } catch {
            toast.error("No se pudo crear la categoría");
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Buscar o crear categoría"
                    className="pl-9"
                    autoComplete="off"
                />
            </div>

            {visible.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                    {visible.map((cat) => {
                        const selected = cat.name.trim().toLowerCase() === value.trim().toLowerCase();
                        const color = cat.color || FALLBACK_COLOR;
                        return (
                            <PickerGridTile
                                key={cat.id}
                                label={cat.name}
                                Icon={resolveFinancialIcon(cat.icon, Tag)}
                                iconStyle={{ color, backgroundColor: `${color}22` }}
                                selected={selected}
                                onClick={() => handleSelect(cat.name, selected)}
                            />
                        );
                    })}
                    {!q && categories.length > PREVIEW_COUNT && (
                        <PickerMoreTile expanded={showAll} onClick={() => setShowAll((v) => !v)} />
                    )}
                </div>
            )}

            {visible.length === 0 && !q && (
                <PickerEmptyHint text="Aún no tienes categorías guardadas. Escribe un nombre arriba para crear la primera." />
            )}

            {q && !exactExists && <PickerCreateButton name={query.trim()} creating={creating} onClick={handleCreate} />}
        </>
    );
}

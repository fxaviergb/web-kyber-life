import { productService, masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Package } from "lucide-react";
import { GenericItemCard } from "./generic-item-card";
import { CreateProductButton } from "./create-product-button";
import { ProductCategoryGroup } from "./product-category-group";

initializeContainer();

export default async function ItemsPage() {
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

    if (!userId) return null;

    const items = await productService.searchGenericItems(userId, "");
    const categories = await masterDataService.getCategories(userId);

    // Create a map for quick category lookup and grouping
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const groupedItems = new Map<string, typeof items>();

    // Initial grouping
    items.forEach(item => {
        const catName = item.primaryCategoryId ? categoryMap.get(item.primaryCategoryId) || "Sin categoría" : "Sin categoría";
        if (!groupedItems.has(catName)) {
            groupedItems.set(catName, []);
        }
        groupedItems.get(catName)!.push(item);
    });

    // Sort categories alphabetically
    const sortedCategories = Array.from(groupedItems.keys()).sort((a, b) => {
        if (a === "Sin categoría") return -1;
        if (b === "Sin categoría") return 1;
        return a.localeCompare(b);
    });

    // Sort items within groups alphabetically
    sortedCategories.forEach(cat => {
        groupedItems.get(cat)!.sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Productos</h1>
                    <p className="text-text-tertiary mt-1">Tu catálogo personal de productos</p>
                </div>
                <CreateProductButton categories={categories} />
            </div>

            {/* Product List */}
            {items.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="No tienes productos aún"
                    description="Empieza agregando items genéricos para tus compras"
                    action={<CreateProductButton categories={categories} />}
                />
            ) : (
                <div className="space-y-8">
                    {sortedCategories.map(categoryName => (
                        <ProductCategoryGroup
                            key={categoryName}
                            categoryName={categoryName}
                            items={groupedItems.get(categoryName)!}
                            categories={categories}
                        />
                    ))}
                </div>
            )}
        </div>
    );

}

import { productService, masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Package } from "lucide-react";
import { GenericItemCard } from "./generic-item-card";
import { CreateProductButton } from "./create-product-button";

initializeContainer();

export default async function ItemsPage() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("kyber_session")?.value;

    if (!sessionId) return null;

    const items = await productService.searchGenericItems(sessionId, "");
    const categories = await masterDataService.getCategories(sessionId);

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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <GenericItemCard
                            key={item.id}
                            item={item}
                            categories={categories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

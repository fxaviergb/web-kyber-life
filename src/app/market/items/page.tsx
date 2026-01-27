import { productService, masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { GenericItemDialog } from "./generic-item-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { GenericItemCard } from "./generic-item-card";

initializeContainer();

export default async function ItemsPage() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("kyber_session")?.value;

    if (!sessionId) return null;

    // Fetch items logic (currently searchGenericItems returns by query, we might need a findAll or empty query)
    // ProductService searchGenericItems calls repo.search.
    // Let's assume empty query returns all for now, or we'll need to update repo signature. 
    // Wait, InMemoryGenericItemRepository.search implementation: if (!query) return items.filter(i => i.ownerUserId === userId && !i.isDeleted);
    // So passing empty query should work.
    const items = await productService.searchGenericItems(sessionId, "");

    // We need categories for the dialog
    const categories = await masterDataService.getCategories(sessionId);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-1">Productos Genéricos</h1>
                    <p className="text-text-2 mt-1">Tu catálogo personal de productos base.</p>
                </div>
                <GenericItemDialog
                    mode="create"
                    categories={categories}
                    trigger={
                        <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white shadow-lg shadow-accent-violet/20">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                        </Button>
                    }
                />
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg bg-bg-1/50">
                    <Package className="w-12 h-12 text-text-3 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-1">No tienes productos aún</h3>
                    <p className="text-text-2 mb-4">Empieza agregando items genéricos para tus compras.</p>
                    <GenericItemDialog
                        mode="create"
                        categories={categories}
                        trigger={
                            <Button variant="outline" className="text-accent-violet border-accent-violet hover:bg-accent-violet/10">
                                Crear primer producto
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
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

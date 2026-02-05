import { purchaseService, productService, masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PurchaseChecklist } from "@/presentation/components/purchase/PurchaseChecklist";
import { PurchaseCompletedView } from "@/presentation/components/purchase/PurchaseCompletedView";
import { PurchaseLine, BrandProduct, GenericItem } from "@/domain/entities";

import { ProductSearch } from "../../items/product-search";

interface PurchaseDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PurchaseDetailPage({ params, searchParams }: PurchaseDetailPageProps) {
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
    const { id } = await params;
    const resolvedParams = await searchParams;
    const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;

    const result = await purchaseService.getPurchase(userId, id);
    if (!result) notFound();

    const { purchase, lines } = result;

    // Fetch missing data for UI
    const supermarket = (await masterDataService.getSupermarkets(userId)).find(s => s.id === purchase.supermarketId);
    const units = await masterDataService.getUnits(userId);

    const categories = await masterDataService.getCategories(userId);

    // Generic Items Map
    const uniqueItemIds = Array.from(new Set(lines.map(l => l.genericItemId)));
    const genericItemsMap: Record<string, GenericItem> = {};
    const brandOptionsMap: Record<string, BrandProduct[]> = {};

    await Promise.all(uniqueItemIds.map(async (itemId) => {
        const g = await productService.getGenericItem(userId, itemId);
        if (g) {
            genericItemsMap[itemId] = g;
            const brands = await productService.getBrandProducts(userId, itemId);
            brandOptionsMap[itemId] = brands;
        }
    }));

    // Fetch templates for Unplanned Item Modal
    const userTemplates = await import("@/infrastructure/container").then(m => m.templateService.getTemplates(userId));

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Lista de Compras</h1>
                    <p className="text-text-3">
                        {supermarket ? `${supermarket.name} - ` : ''}
                        {new Date(purchase.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </p>
                </div>

                <div className="flex gap-2">
                    <ProductSearch />
                </div>
            </div>

            {purchase.status === 'completed' ? (
                <PurchaseCompletedView
                    purchase={purchase}
                    lines={lines}
                    brandOptionsMap={brandOptionsMap}
                    units={units}
                    genericItemsMap={genericItemsMap}
                />
            ) : (
                <PurchaseChecklist
                    purchase={purchase}
                    initialLines={lines}
                    brandOptionsMap={brandOptionsMap}
                    units={units}
                    genericItemsMap={genericItemsMap}
                    categories={categories}
                    userTemplates={userTemplates}
                    searchQuery={query}
                />
            )}
        </div>
    );
}

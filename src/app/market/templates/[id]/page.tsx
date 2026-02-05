import { templateService, productService, masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingBasket, LayoutList, Edit, Search, Plus } from "lucide-react";
import Link from "next/link";
import { AddItemDialog } from "./add-item-dialog";
import { TemplateCategoryGroup } from "./template-category-group";
import { Badge } from "@/components/ui/badge";
import { EditTemplateDialog } from "../edit-template-dialog";
// Import shared search component, adjusting path since we are in [id]
import { ProductSearch } from "../../items/product-search";

interface TemplateDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TemplateDetailPage({ params, searchParams }: TemplateDetailPageProps) {
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

    // Parse Search Params
    const resolvedParams = await searchParams;
    const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;

    const template = await templateService.getTemplate(userId, id);
    if (!template) notFound();

    const templateItems = await templateService.getTemplateItems(userId, id);
    const units = await masterDataService.getUnits(userId);
    const categories = await masterDataService.getCategories(userId);
    const genericItems = await productService.getGenericItems(userId);

    // Fetch details for template items
    let itemsWithDetails = await Promise.all(templateItems.map(async (ti) => {
        const generic = await productService.getGenericItem(userId, ti.genericItemId);
        const unit = ti.defaultUnitId ? units.find(u => u.id === ti.defaultUnitId) : null;
        return { ...ti, generic, unit };
    }));

    // Filter in memory
    if (query) {
        const lowerQuery = query.toLowerCase();
        itemsWithDetails = itemsWithDetails.filter(i =>
            i.generic?.canonicalName.toLowerCase().includes(lowerQuery) ||
            (i.generic?.aliases || []).some(a => a.toLowerCase().includes(lowerQuery))
        );
    }

    const totalEstimated = itemsWithDetails.reduce((sum, item) => {
        if (item.generic?.globalPrice && item.defaultQty) {
            return sum + (item.generic.globalPrice * item.defaultQty);
        }
        return sum;
    }, 0);

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/market/templates">
                        <Button variant="ghost" size="icon" className="text-text-2 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-text-1">{template.name}</h1>
                            <div className="flex gap-1">
                                {template.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-[10px] py-0 border-accent-violet/30 text-accent-violet">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm mt-1">
                            <p className="text-text-3 flex items-center gap-1">
                                <LayoutList className="w-4 h-4" /> {templateItems.length} productos
                            </p>
                            {totalEstimated > 0 && (
                                <p className="text-accent-mint font-medium">
                                    ~${totalEstimated.toFixed(2)} USD
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <ProductSearch />

                    <div className="flex gap-2 w-full sm:w-auto">
                        <EditTemplateDialog
                            template={{ id: template.id, name: template.name, tags: template.tags }}
                            trigger={
                                <Button variant="outline" className="flex-1 sm:flex-none border-border text-text-1 hover:bg-bg-2">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                </Button>
                            }
                        />
                        <AddItemDialog
                            templateId={id}
                            genericItems={genericItems}
                            units={units}
                            categories={categories}
                            existingItemIds={templateItems.map(ti => ti.genericItemId)}
                        />
                    </div>
                </div>
            </div>

            {itemsWithDetails.length === 0 ? (
                query ? (
                    <Card className="bg-bg-1 border-border p-12 text-center text-text-3">
                        <Search className="w-12 h-12 mx-auto opacity-10 mb-2" />
                        <p>No encontramos "{query}" en esta plantilla.</p>
                        <div className="mt-4">
                            <AddItemDialog
                                templateId={id}
                                genericItems={genericItems}
                                units={units}
                                categories={categories}
                                existingItemIds={templateItems.map(ti => ti.genericItemId)}
                                initialSearch={query}
                                trigger={
                                    <Button variant="outline" className="text-accent-violet border-accent-violet/20 hover:bg-accent-violet/5">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agregar "{query}" a la plantilla
                                    </Button>
                                }
                            />
                        </div>
                    </Card>
                ) : (
                    <Card className="bg-bg-1 border-border p-12 text-center text-text-3 italic">
                        <ShoppingBasket className="w-12 h-12 mx-auto opacity-10 mb-2" />
                        <p>No hay productos en esta plantilla.</p>
                        <p className="text-xs not-italic">Empieza añadiendo productos con el botón de arriba.</p>
                    </Card>
                )
            ) : (
                <div className="space-y-8">
                    {(() => {
                        // Prepare data for grouping
                        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

                        const itemsForDisplay = itemsWithDetails.map(item => ({
                            id: item.id,
                            genericName: item.generic?.canonicalName || "Producto",
                            defaultQty: item.defaultQty,
                            defaultUnitId: item.defaultUnitId,
                            genericItemId: item.genericItemId,
                            globalPrice: item.generic?.globalPrice || null,
                            currencyCode: item.generic?.currencyCode || "USD",
                            categoryId: item.generic?.primaryCategoryId || null,
                            imageUrl: item.generic?.imageUrl || null,
                            unit: item.unit
                        }));

                        const groupedItems = new Map<string, typeof itemsForDisplay>();

                        // Grouping
                        itemsForDisplay.forEach(item => {
                            const catName = item.categoryId ? categoryMap.get(item.categoryId) || "Sin categoría" : "Sin categoría";
                            if (!groupedItems.has(catName)) {
                                groupedItems.set(catName, []);
                            }
                            groupedItems.get(catName)!.push(item);
                        });

                        // Sort Categories
                        const sortedCategories = Array.from(groupedItems.keys()).sort((a, b) => {
                            if (a === "Sin categoría") return -1;
                            if (b === "Sin categoría") return 1;
                            return a.localeCompare(b);
                        });

                        // Sort Items within categories
                        sortedCategories.forEach(cat => {
                            groupedItems.get(cat)!.sort((a, b) => a.genericName.localeCompare(b.genericName));
                        });

                        return sortedCategories.map(categoryName => (
                            <TemplateCategoryGroup
                                key={categoryName}
                                categoryName={categoryName}
                                items={groupedItems.get(categoryName)!}
                                templateId={id}
                                units={units}
                                categories={categories}
                            />
                        ));
                    })()}
                </div>
            )}
            {/* Legacy Grid removed in favor of Groups */}
            <div className="hidden">
                {/* Keeping this just in case anything breaks momentarily, but practically removed */}
            </div>
        </div>
    );
}

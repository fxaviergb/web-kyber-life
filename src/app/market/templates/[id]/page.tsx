import { templateService, productService, masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingBasket, LayoutList, Edit } from "lucide-react";
import Link from "next/link";
import { AddItemDialog } from "./add-item-dialog";
import { TemplateItemCard } from "./template-item-card";
import { Badge } from "@/components/ui/badge";
import { EditTemplateDialog } from "../edit-template-dialog";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value;

    if (!userId) {
        redirect("/auth/login");
    }
    const { id } = await params;

    const template = await templateService.getTemplate(userId, id);
    if (!template) notFound();

    const templateItems = await templateService.getTemplateItems(userId, id);
    const units = await masterDataService.getUnits(userId);
    const categories = await masterDataService.getCategories(userId);
    const genericItems = await productService.getGenericItems(userId);

    // Fetch details for template items
    const itemsWithDetails = await Promise.all(templateItems.map(async (ti) => {
        const generic = await productService.getGenericItem(userId, ti.genericItemId);
        const unit = ti.defaultUnitId ? units.find(u => u.id === ti.defaultUnitId) : null;
        return { ...ti, generic, unit };
    }));

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

                <div className="flex gap-2">
                    <EditTemplateDialog
                        template={{ id: template.id, name: template.name, tags: template.tags }}
                        trigger={
                            <Button variant="outline" className="border-border text-text-1 hover:bg-bg-2">
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Plantilla
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

            {itemsWithDetails.length === 0 ? (
                <Card className="bg-bg-1 border-border p-12 text-center text-text-3 italic">
                    <ShoppingBasket className="w-12 h-12 mx-auto opacity-10 mb-2" />
                    <p>No hay productos en esta plantilla.</p>
                    <p className="text-xs not-italic">Empieza añadiendo productos con el botón de arriba.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {itemsWithDetails.map(item => (
                        <TemplateItemCard
                            key={item.id}
                            templateId={id}
                            item={{
                                id: item.id,
                                genericName: item.generic?.canonicalName || "Producto",
                                defaultQty: item.defaultQty,
                                defaultUnitId: item.defaultUnitId,
                                genericItemId: item.genericItemId,
                                globalPrice: item.generic?.globalPrice || null,
                                currencyCode: item.generic?.currencyCode || "USD",
                                categoryId: item.generic?.primaryCategoryId,
                                imageUrl: item.generic?.imageUrl
                            }}
                            unit={item.unit}
                            units={units}
                            categories={categories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

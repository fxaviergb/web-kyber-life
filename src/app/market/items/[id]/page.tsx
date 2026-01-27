import { productService, masterDataService } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EditProductButton } from "../edit-product-button";
import { BrandProductDialog } from "../brand-product-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Plus, Trash2, Tag, ArrowLeft, Package, DollarSign, Globe } from "lucide-react";
import Link from "next/link";
import { DeleteBrandProductIconButton } from "../delete-brand-product-icon-button";
import { deleteBrandProductAction } from "@/app/actions/product";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getUserId() {
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");
    if (!session || !session.value) return null;
    return session.value;
}

export default async function GenericItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) redirect("/auth/login");
    const { id } = await params;

    const item = await productService.getGenericItem(userId, id);
    if (!item) redirect("/market/items");

    const categories = await masterDataService.getCategories(userId);
    const brandProducts = await productService.getBrandProducts(userId, id);
    const supermarkets = await masterDataService.getSupermarkets(userId);

    // Fetch prices for all brand products
    const productWithPrices = await Promise.all(brandProducts.map(async (p) => {
        const prices = await productService.getLatestPrices(userId, p.id);
        return { ...p, prices };
    }));

    const categoryName = categories.find(c => c.id === item.primaryCategoryId)?.name || "Sin categoría";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Navigation */}
            <div className="flex items-center gap-4">
                <Link href="/market/items">
                    <Button variant="ghost" size="icon" className="hover:bg-accent-violet/10 hover:text-accent-violet transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-text-1">Detalle del Producto</h1>
                    <p className="text-text-2 text-sm">Gestiona la información genérica y sus variantes de marca.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Generic Item Details */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="overflow-hidden border-border/60 bg-bg-1 shadow-lg">
                        {item.imageUrl ? (
                            <div className="w-full bg-bg-2 relative">
                                <img
                                    src={item.imageUrl}
                                    alt={item.canonicalName}
                                    className="w-full h-auto block"
                                />
                                <div className="absolute top-4 right-4">
                                    <Badge variant="default" className="bg-bg-1/80 backdrop-blur text-text-1 shadow-sm">
                                        <Tag className="w-3 h-3 mr-1 text-accent-blue" />
                                        {categoryName}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full aspect-square bg-bg-2 flex flex-col items-center justify-center text-text-3">
                                <Package className="w-16 h-16 mb-2 opacity-20" />
                                <span className="text-sm">Sin imagen</span>
                            </div>
                        )}
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-3">
                                <CardTitle className="text-2xl font-bold text-text-1 break-words flex-1">
                                    {item.canonicalName}
                                </CardTitle>
                                <EditProductButton
                                    item={item}
                                    categories={categories}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 text-text-2 border-border hover:text-accent-violet hover:border-accent-violet hover:bg-accent-violet/5"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {item.aliases.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Alias / Sinónimos</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {item.aliases.map(alias => (
                                            <Badge key={alias} variant="outline" className="border-border text-text-2 font-normal">
                                                {alias}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-bg-2/50 rounded-lg p-3 border border-border/50">
                                <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Precio Global Ref.
                                </h4>
                                {item.globalPrice ? (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-accent-mint">${item.globalPrice.toFixed(2)}</span>
                                        <span className="text-sm text-text-3 font-medium">{item.currencyCode}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-text-3 italic">No definido</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Brand Products */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <div>
                            <h2 className="text-xl font-bold text-text-1">Opciones de Marca</h2>
                            <p className="text-sm text-text-2">Productos específicos que encuentras en el súper.</p>
                        </div>
                        <BrandProductDialog
                            mode="create"
                            genericItemId={item.id}
                            supermarkets={supermarkets}
                            trigger={
                                <Button className="bg-accent-violet text-white hover:bg-accent-violet/90 shadow-lg shadow-accent-violet/20">
                                    <Plus className="h-4 w-4 mr-2" /> Nueva Opción
                                </Button>
                            }
                        />
                    </div>

                    <div className="space-y-4">
                        {productWithPrices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl bg-bg-1/30">
                                <div className="p-4 bg-bg-2 rounded-full mb-3">
                                    <Package className="w-8 h-8 text-text-3" />
                                </div>
                                <h3 className="text-lg font-medium text-text-1">No hay opciones registradas</h3>
                                <p className="text-text-2 text-center max-w-sm mb-6">
                                    Agrega marcas y presentaciones específicas (ej. "Bimbo 600g") para rastrear precios exactos.
                                </p>
                                <BrandProductDialog
                                    mode="create"
                                    genericItemId={item.id}
                                    supermarkets={supermarkets}
                                    trigger={
                                        <Button variant="outline" className="text-accent-violet border-accent-violet hover:bg-accent-violet/10">
                                            Crear primera opción
                                        </Button>
                                    }
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                                {productWithPrices.map(bp => (
                                    <div key={bp.id} className="group flex bg-bg-1 border border-border rounded-xl overflow-hidden hover:border-accent-violet/50 hover:shadow-lg hover:shadow-accent-violet/5 transition-all duration-300">
                                        <div className="w-24 h-full bg-bg-2 relative shrink-0">
                                            {bp.imageUrl ? (
                                                <img src={bp.imageUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-text-3/30" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-text-1 text-lg leading-tight group-hover:text-accent-violet transition-colors">{bp.brand}</h4>

                                                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <BrandProductDialog
                                                            mode="edit"
                                                            product={bp}
                                                            supermarkets={supermarkets}
                                                            observations={bp.prices}
                                                            trigger={
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-bg-2 text-text-2">
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                            }
                                                        />
                                                        <DeleteBrandProductIconButton id={bp.id} />
                                                    </div>
                                                </div>
                                                <p className="text-sm text-text-2 font-medium">{bp.presentation}</p>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {bp.globalPrice && (
                                                    <Badge variant="outline" className="text-xs border-accent-blue/30 text-accent-blue bg-accent-blue/5 font-normal">
                                                        Ref: {bp.globalPrice} {bp.currencyCode}
                                                    </Badge>
                                                )}
                                                {bp.prices.length > 0 ? (
                                                    <Badge variant="secondary" className="text-xs bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border-0">
                                                        {bp.prices.length} precios locales
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-text-3 px-2 py-0.5">Sin precios</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

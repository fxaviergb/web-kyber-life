import { masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { CategoryDialog } from "./category-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteCategoryButton } from "./delete-category-button";
import { EditCategoryButton } from "./edit-category-button";
import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Initialize container
initializeContainer();

export default async function CategoriesPage() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("kyber_session")?.value;

    if (!sessionId) return null;

    const categories = await masterDataService.getCategories(sessionId);

    // Filter to know which are personal (assuming base categories have a special ownerId or we can check logic)
    // In our logic: if ownerUserId == sessionId -> Personal. Else -> Base.
    // However, the getCategories returns all. We need to distinguish.
    // Let's assume for now we check against sessionId.
    const personalCategories = categories.filter(c => c.ownerUserId === sessionId);
    const baseCategories = categories.filter(c => c.ownerUserId !== sessionId);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-1">Categorías</h1>
                    <p className="text-text-2 mt-1">Organiza tus productos y obtén análisis detallados.</p>
                </div>
                <CategoryDialog
                    mode="create"
                    trigger={
                        <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white shadow-lg shadow-accent-violet/20">
                            <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
                        </Button>
                    }
                />
            </div>

            {/* Personal Categories */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-text-1 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-accent-cyan" /> Mis Categorías
                </h2>
                {personalCategories.length === 0 ? (
                    <div className="text-text-3 italic text-sm border border-dashed border-border p-4 rounded-lg bg-bg-1/50">
                        No has creado categorías personalizadas aún.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {personalCategories.map((c) => (
                            <Card key={c.id} className="bg-bg-1 border-border hover:border-accent-cyan/30 transition-colors group">
                                <CardContent className="p-5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-text-1">{c.name}</span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-3 hover:text-text-1">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-bg-2 border-border">
                                            <EditCategoryButton category={c} />
                                            <DeleteCategoryButton id={c.id} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Base Categories */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-text-1 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-text-3" /> Categorías del Sistema
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {baseCategories.map((c) => (
                        <Card key={c.id} className="bg-bg-1 border-border opacity-75">
                            <CardContent className="p-5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-bg-2 flex items-center justify-center text-text-3">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-text-2">{c.name}</span>
                                </div>
                                <Badge variant="secondary" className="bg-bg-2 text-text-3 hover:bg-bg-2">
                                    Sistema
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

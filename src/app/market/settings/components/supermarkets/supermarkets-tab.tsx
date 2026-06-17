import { masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { SupermarketDialog } from "./supermarket-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Store, MapPin, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteSupermarketButton } from "./delete-supermarket-button";
import { EditSupermarketButton } from "./edit-supermarket-button";

// Initialize container
initializeContainer();

export default async function SupermarketsPage() {
    await initializeContainer();
    let sessionId: string | undefined;

    if (process.env.DATA_SOURCE === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        sessionId = user?.id; // Using sessionId variable name to match existing code
    } else {
        const cookieStore = await cookies();
        sessionId = cookieStore.get("kyber_session")?.value;
    }

    if (!sessionId) return null;

    const supermarkets = await masterDataService.getSupermarkets(sessionId);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-1">Supermercados</h1>
                    <p className="text-text-2 mt-1">Gestiona tus lugares de compra frecuentes.</p>
                </div>
                <SupermarketDialog
                    mode="create"
                    trigger={
                        <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white shadow-lg shadow-accent-violet/20">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Supermercado
                        </Button>
                    }
                />
            </div>

            {supermarkets.length === 0 ? (
                <Card className="bg-bg-1 border-dashed border-2 border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-accent-violet/10 flex items-center justify-center mb-4">
                            <Store className="w-8 h-8 text-accent-violet" />
                        </div>
                        <h3 className="text-xl font-medium text-text-1 mb-2">No hay supermercados</h3>
                        <p className="text-text-2 max-w-sm mb-6">
                            Agrega tu primer supermercado para comenzar a registrar precios y crear listas de compra.
                        </p>
                        <SupermarketDialog
                            mode="create"
                            trigger={
                                <Button variant="outline" className="border-accent-violet text-accent-violet hover:bg-accent-violet/10">
                                    <Plus className="w-4 h-4 mr-2" /> Crear ahora
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supermarkets.map((s) => (
                        <Card key={s.id} className="bg-bg-1 border-border hover:border-accent-violet/30 transition-colors group">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-violet/20 to-accent-magenta/20 flex items-center justify-center text-accent-violet shrink-0">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-1 group-hover:text-accent-violet transition-colors">
                                                {s.name}
                                            </h3>
                                            {s.address && (
                                                <div className="flex items-center gap-1 text-xs text-text-3 mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{s.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-3 hover:text-text-1 -mr-2">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-bg-2 border-border">
                                            <EditSupermarketButton supermarket={s} />
                                            {/* Separation for delete */}
                                            <DeleteSupermarketButton id={s.id} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

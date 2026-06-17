import { masterDataService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { UnitDialog } from "./unit-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Scale, Lock, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteUnitButton } from "./delete-unit-button";
import { EditUnitButton } from "./edit-unit-button";
import { Badge } from "@/components/ui/badge";

initializeContainer();

export default async function UnitsPage() {
    const cookieStore = await cookies();
    let sessionId: string | undefined;

    if (process.env.DATA_SOURCE === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        sessionId = user?.id;
    } else {
        sessionId = cookieStore.get("kyber_session")?.value;
    }

    if (!sessionId) return null;

    const units = await masterDataService.getUnits(sessionId);

    const personalUnits = units.filter(u => u.ownerUserId === sessionId);
    const baseUnits = units.filter(u => u.ownerUserId !== sessionId);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-1">Unidades</h1>
                    <p className="text-text-2 mt-1">Gestiona las unidades de medida para tus productos.</p>
                </div>
                <UnitDialog
                    mode="create"
                    trigger={
                        <Button className="bg-accent-violet hover:bg-accent-violet/90 text-white shadow-lg shadow-accent-violet/20">
                            <Plus className="w-4 h-4 mr-2" /> Nueva Unidad
                        </Button>
                    }
                />
            </div>

            {/* Personal Units */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-text-1 flex items-center">
                    <Scale className="w-5 h-5 mr-2 text-accent-cyan" /> Mis Unidades
                </h2>
                {personalUnits.length === 0 ? (
                    <div className="text-text-3 italic text-sm border border-dashed border-border p-4 rounded-lg bg-bg-1/50">
                        No has creado unidades personalizadas aún.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {personalUnits.map((u) => (
                            <Card key={u.id} className="bg-bg-1 border-border hover:border-accent-cyan/30 transition-colors group">
                                <CardContent className="p-5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
                                            <Scale className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-text-1">{u.name}</span>
                                            {u.symbol && <span className="text-xs text-text-3">({u.symbol})</span>}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-3 hover:text-text-1">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-bg-2 border-border">
                                            <EditUnitButton unit={u} />
                                            <DeleteUnitButton id={u.id} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Base Units */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-text-1 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-text-3" /> Unidades del Sistema
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {baseUnits.map((u) => (
                        <Card key={u.id} className="bg-bg-1 border-border opacity-75">
                            <CardContent className="p-5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-bg-2 flex items-center justify-center text-text-3">
                                        <Scale className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-text-2">{u.name}</span>
                                        {u.symbol && <span className="text-xs text-text-3">({u.symbol})</span>}
                                    </div>
                                </div>
                                <Badge variant="default" className="bg-bg-2 text-text-3 hover:bg-bg-2">
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

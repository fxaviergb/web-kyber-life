import Link from "next/link";
import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RobotLoader } from "@/components/ui/RobotLoader";

/**
 * Friendly loading state for the main dashboard hub: the animated system
 * robot, a reassuring message, and quick actions so the user can jump to
 * transactions or start a purchase while the data is being gathered.
 */
export function DashboardLoading() {
    return (
        <div className="flex min-h-[75vh] w-full flex-col items-center justify-center gap-7 px-4 text-center animate-in fade-in duration-500">
            <RobotLoader size={120} text="Cargando tus datos" />

            <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-bold tracking-tight text-text-primary">
                    Estamos preparando tu panel
                </h2>
                <p className="text-sm leading-relaxed text-text-tertiary">
                    Reuniendo tu actividad financiera y de compras. Esto toma solo un momento;
                    mientras tanto, puedes:
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                    asChild
                    className="rounded-xl bg-accent-info hover:bg-accent-info/90 text-white gap-2 px-6 h-11 shadow-lg shadow-accent-info/25 transition-all hover:scale-105"
                >
                    <Link href="/financial/transactions">
                        <Receipt className="h-4 w-4" />
                        Ver transacciones
                    </Link>
                </Button>
                <Button
                    asChild
                    className="rounded-xl bg-accent-success hover:bg-accent-success/90 text-white gap-2 px-6 h-11 shadow-lg shadow-accent-success/25 transition-all hover:scale-105"
                >
                    <Link href="/market/purchases/new">
                        <Plus className="h-4 w-4" />
                        Nueva compra
                    </Link>
                </Button>
            </div>
        </div>
    );
}

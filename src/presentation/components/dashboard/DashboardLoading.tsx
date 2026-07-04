import { RobotLoader } from "@/components/ui/RobotLoader";

/**
 * Friendly loading state for the main dashboard hub: the animated system
 * robot, a reassuring message, and quick actions so the user can jump to
 * transactions or start a purchase while the data is being gathered.
 */
export function DashboardLoading() {
    return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-7 px-4 text-center animate-in fade-in duration-500">
            <RobotLoader size={120} text="Cargando tus datos" />

            <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-bold tracking-tight text-text-primary">
                    Preparando tu panel
                </h2>
                <p className="text-sm leading-relaxed text-text-tertiary">
                    Reuniendo tu actividad financiera y de compras. Esto toma solo un momento.
                </p>
            </div>
        </div>
    );
}

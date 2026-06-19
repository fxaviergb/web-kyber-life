import { RobotLoader } from "@/components/ui/RobotLoader";

/**
 * Generic full-section loading state for route transitions (App Router
 * `loading.tsx`). The animated KyberLife robot + a friendly message, with no
 * action buttons — it only appears while a segment is genuinely waiting to
 * render. The main dashboard uses its own richer loader instead.
 */
export function RouteLoading({ text = "Cargando" }: { text?: string }) {
    return (
        <div className="flex min-h-[70vh] w-full items-center justify-center px-4">
            <RobotLoader size={104} text={text} />
        </div>
    );
}

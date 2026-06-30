'use server'

import { createClient } from "@/infrastructure/supabase/server";
import { financialScanExecutionRepository } from "@/infrastructure/container";
import { revalidatePath } from "next/cache";

export async function triggerFinancialScanAction(startDate: string, endDate: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "No autorizado" };
        }

        // Validate max 15 days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 15) {
            return { success: false, error: "El rango no puede superar los 15 días para no saturar el servicio." };
        }

        const webhookUrl = process.env.N8N_SCANNER_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("Missing N8N_SCANNER_WEBHOOK_URL environment variable.");
            return { success: false, error: "Configuración de sistema incompleta. Contacte soporte." };
        }

        // The exact n8n payload from the prompt
        // { "startDate": "2026-05-01", "endDate": "2026-05-14", "user": "4aba0e45-..." }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startDate,
                endDate,
                user: user.id
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            const truncatedDetail = errorText.length > 200 ? errorText.substring(0, 200) + "..." : errorText;
            console.error(`Error triggering N8N webhook: ${response.status} - ${response.statusText}. Details: ${truncatedDetail}`);
            return { success: false, error: `Error al iniciar el escaneo en el sistema remoto. Detalles: ${truncatedDetail || response.statusText}` };
        }

        revalidatePath("/financial/scanner");
        revalidatePath("/financial/scans");

        return { success: true };
    } catch (error: any) {
        console.error("Error in triggerFinancialScanAction:", error);

        let errorMessage = "Error interno del servidor";
        if (error?.cause?.code === 'ECONNREFUSED' || error?.message === 'fetch failed') {
            errorMessage = "No se pudo conectar con el escáner. Verifique que el servicio esté en línea.";
        } else if (error?.message) {
            errorMessage = error.message;
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Returns, for a single calendar day, how many scanner transactions each scan
 * found that are DATED on that day, keyed by the external execution id
 * (`financial_scanner_transactions.execution_id`, e.g. `LOCAL_xxx`).
 *
 * A range scan finds transactions spread across several days, so the per-day
 * count differs from the scan's grand total. The day boundary is interpreted in
 * UTC to match how stored dates are displayed verbatim (literal wall-clock).
 */
export async function getScannerDayCountsAction(dateStr: string) {
    try {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return { success: false, error: "Fecha inválida" };
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "No autorizado" };
        }

        const { data, error } = await supabase
            .from("financial_scanner_transactions")
            .select("execution_id")
            .eq("owner_user_id", user.id)
            .gte("date", `${dateStr}T00:00:00.000Z`)
            .lte("date", `${dateStr}T23:59:59.999Z`);

        if (error) {
            console.error("Error in getScannerDayCountsAction:", error);
            return { success: false, error: error.message };
        }

        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
            const execId = (row as { execution_id: string | null }).execution_id;
            if (execId) counts[execId] = (counts[execId] || 0) + 1;
        }

        return { success: true, data: counts };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error al obtener conteos";
        console.error("Error in getScannerDayCountsAction:", error);
        return { success: false, error: message };
    }
}

export async function getScanExecutionsAction(
    page: number = 1,
    limit: number = 10,
    dateFrom?: string,
    dateTo?: string
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "No autorizado" };
        }

        const dateFilter = dateFrom && dateTo ? { dateFrom, dateTo } : undefined;

        const result = await financialScanExecutionRepository.findPaginatedByOwnerId(
            user.id,
            { page, pageSize: limit },
            dateFilter
        );



        // Force plain JSON round-trip to prevent RSC flight protocol from
        // silently stripping optional/nested properties like requestPayload.
        const safeResult = JSON.parse(JSON.stringify(result)) as typeof result;



        return { success: true, data: safeResult };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error al obtener historial";
        console.error("Error in getScanExecutionsAction:", error);
        return { success: false, error: message };
    }
}

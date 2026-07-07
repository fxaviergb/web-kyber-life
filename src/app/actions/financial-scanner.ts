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

        // Encode the selected calendar dates as precise Ecuador-day (America/Guayaquil,
        // UTC-5, no DST) boundaries so the remote scanner searches exactly
        // 00:00:00.000–23:59:59.999 of each chosen day in Ecuador local time — any
        // email received within that window is included — independent of where n8n or
        // the mailbox runs. We keep the explicit "-05:00" offset instead of a
        // Z-normalized UTC instant on purpose: the literal date part stays the Ecuador
        // calendar date (start "2026-07-06T00:00:00.000-05:00", end
        // "2026-07-06T23:59:59.999-05:00"), so an n8n step that reads only the date
        // still gets the correct day for BOTH bounds, while the full value remains an
        // unambiguous instant for time-aware steps.
        const startDay = startDate.split('T')[0];
        const endDay = endDate.split('T')[0];
        const startInstant = `${startDay}T00:00:00.000-05:00`;
        const endInstant = `${endDay}T23:59:59.999-05:00`;
        if (isNaN(new Date(startInstant).getTime()) || isNaN(new Date(endInstant).getTime())) {
            return { success: false, error: "Fechas inválidas" };
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startDate: startInstant,
                endDate: endInstant,
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
 * found that are DATED on that day, keyed by the execution's UUID
 * (`financial_scanner_executions.id`, i.e. the UI's `exec.id`).
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

        const { data: txRows, error: txError } = await supabase
            .from("financial_scanner_transactions")
            .select("execution_id")
            .eq("owner_user_id", user.id)
            .gte("date", `${dateStr}T00:00:00.000Z`)
            .lte("date", `${dateStr}T23:59:59.999Z`);

        if (txError) {
            console.error("Error in getScannerDayCountsAction (transactions):", txError);
            return { success: false, error: txError.message };
        }

        // Count per external (n8n LOCAL) execution id.
        const localCounts: Record<string, number> = {};
        for (const row of txRows ?? []) {
            const ext = (row as { execution_id: string | null }).execution_id;
            if (ext) localCounts[ext] = (localCounts[ext] || 0) + 1;
        }

        const localIds = Object.keys(localCounts);
        if (localIds.length === 0) return { success: true, data: {} };

        // Re-key by the execution's stable UUID (`financial_scanner_executions.id`),
        // which the UI already has as `exec.id`. Avoids depending on the entity's
        // external id, which can be stale behind the cached repository singleton.
        const { data: execRows, error: execError } = await supabase
            .from("financial_scanner_executions")
            .select("id, execution_id")
            .eq("owner_user_id", user.id)
            .in("execution_id", localIds);

        if (execError) {
            console.error("Error in getScannerDayCountsAction (executions):", execError);
            return { success: false, error: execError.message };
        }

        const counts: Record<string, number> = {};
        for (const row of execRows ?? []) {
            const r = row as { id: string; execution_id: string | null };
            if (r.execution_id && localCounts[r.execution_id] != null) {
                counts[r.id] = localCounts[r.execution_id];
            }
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

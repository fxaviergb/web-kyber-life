"use server";

import { z } from "zod";
import { FinancialTransactionType } from "@/domain/entities/financial";

const voiceParseResultSchema = z.object({
    type: z.enum([
        "EXPENSE", "INCOME", "TRANSFER", "SUBSCRIPTION",
        "PAYMENT", "REFUND", "WITHDRAWAL", "DEPOSIT", "FEE", "TAX", "OTHER",
    ] as [FinancialTransactionType, ...FinancialTransactionType[]]).optional(),
    amount: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    description: z.string().max(2000).optional(),
    merchant: z.string().max(255).optional(),
    institutionName: z.string().max(255).optional(),
    categoryName: z.string().max(255).optional(),
    date: z.string().optional(),
});

export type VoiceParseResult = z.infer<typeof voiceParseResultSchema>;

export async function parseVoiceTransactionAction(
    text: string,
): Promise<{ success: true; data: VoiceParseResult } | { success: false; error: string }> {
    const webhookUrl = process.env.VOICE_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
        return { success: false, error: "La función de voz no está configurada (falta VOICE_N8N_WEBHOOK_URL)" };
    }

    const trimmed = text?.trim();
    if (!trimmed) {
        return { success: false, error: "No se recibió texto de audio" };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed }),
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            return { success: false, error: `Error del procesador de voz (${response.status})` };
        }

        const raw = await response.json();

        // n8n may wrap the output in an array
        const payload = Array.isArray(raw) ? raw[0] : raw;

        const parsed = voiceParseResultSchema.safeParse(payload);
        if (!parsed.success) {
            return { success: false, error: "El procesador devolvió un formato inesperado" };
        }

        return { success: true, data: parsed.data };
    } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
            return { success: false, error: "El procesador de voz tardó demasiado. Intenta de nuevo." };
        }
        return { success: false, error: "No se pudo conectar al procesador de voz" };
    }
}

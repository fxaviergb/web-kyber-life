import { z } from "zod";

export const createPurchaseSchema = z.object({
    supermarketId: z.string().nullable().optional().or(z.literal("")).transform(v => v === "" || v === undefined ? null : v),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    templateIds: z.array(z.string()).optional().default([])
});

import { z } from "zod";

export const createTemplateSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(50),
    tags: z.array(z.string()).optional().default([]),
});

export const updateTemplateSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "El nombre es requerido").max(50).optional(),
    tags: z.array(z.string()).optional(),
});

export const addTemplateItemSchema = z.object({
    templateId: z.string().uuid(),
    genericItemId: z.string().uuid(),
    defaultQty: z.number().positive().nullable().optional(),
    defaultUnitId: z.string().uuid().nullable().optional(),
});

export const updateTemplateItemSchema = z.object({
    id: z.string().uuid(),
    defaultQty: z.number().positive().nullable().optional(),
    defaultUnitId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().optional(),
    // Global price update fields
    globalPrice: z.number().positive().nullable().optional(),
    currencyCode: z.string().length(3).optional(),
    genericItemId: z.string().uuid().optional(),
    // Extended editing fields
    name: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional().nullable(),
});

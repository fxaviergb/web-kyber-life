import { z } from "zod";

export const createTemplateSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(50),
    tags: z.array(z.string()).optional().default([]),
});

export const updateTemplateSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "El nombre es requerido").max(50).optional(),
    tags: z.array(z.string()).optional(),
});

export const addTemplateItemSchema = z.object({
    templateId: z.string(),
    genericItemId: z.string(),
    defaultQty: z.number().positive().nullable().optional(),
    defaultUnitId: z.string().nullable().optional(),
    globalPrice: z.number().positive().nullable().optional(),
});

export const updateTemplateItemSchema = z.object({
    id: z.string(),
    defaultQty: z.number().positive().nullable().optional(),
    defaultUnitId: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    // Global price update fields
    globalPrice: z.number().positive().nullable().optional(),
    currencyCode: z.string().length(3).optional(),
    genericItemId: z.string().optional(),
    // Extended editing fields
    name: z.string().min(1).optional(),
    categoryId: z.string().optional(),
    imageUrl: z.string().url().nullable().optional().or(z.literal("")),
});

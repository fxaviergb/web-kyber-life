import { z } from "zod";

export const createGenericItemSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    primaryCategoryId: z.string().optional().nullable(),
    secondaryCategoryIds: z.array(z.string()).optional().default([]),
    imageUrl: z.string().url().optional().or(z.literal("")),
    globalPrice: z.coerce.number().min(0).optional(),
    currencyCode: z.string().min(3).max(3).optional().default("USD"),
});

export const updateGenericItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "El nombre es requerido"),
    primaryCategoryId: z.string().optional().nullable(),
    secondaryCategoryIds: z.array(z.string()).optional().default([]),
    imageUrl: z.string().url().optional().or(z.literal("")),
    aliases: z.array(z.string()).optional(),
    globalPrice: z.coerce.number().min(0).optional(),
    currencyCode: z.string().min(3).max(3).optional().default("USD"),
});

export const deleteGenericItemSchema = z.object({
    id: z.string(),
});

export const createBrandProductSchema = z.object({
    genericItemId: z.string(),
    brand: z.string().min(1, "La marca es requerida"),
    presentation: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    globalPrice: z.coerce.number().min(0).optional(),
    currencyCode: z.string().min(3).max(3).optional().default("USD"),
});

export const updateBrandProductSchema = z.object({
    id: z.string(),
    brand: z.string().min(1, "La marca es requerida"),
    presentation: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    globalPrice: z.coerce.number().min(0).optional(),
    currencyCode: z.string().min(3).max(3).optional().default("USD"),
});

export const deleteBrandProductSchema = z.object({
    id: z.string(),
});

export const addPriceObservationSchema = z.object({
    brandProductId: z.string(),
    supermarketId: z.string(),
    unitPrice: z.coerce.number().min(0).optional().nullable(),
    currencyCode: z.string().min(3).max(3).default("USD"),
});

export const createSupermarketSchema = z.object({
    name: z.string().min(1, "Nombre requerido"),
});

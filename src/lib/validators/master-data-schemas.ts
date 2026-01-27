import { z } from "zod";

export const createSupermarketSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    address: z.string().optional(),
});

export const updateSupermarketSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "El nombre es requerido"),
    address: z.string().optional(),
});

export const deleteSupermarketSchema = z.object({
    id: z.string().uuid(),
});

export const createCategorySchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
});

export const updateCategorySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "El nombre es requerido"),
});

export const deleteCategorySchema = z.object({
    id: z.string().uuid(),
});

export const createUnitSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    symbol: z.string().optional(),
});

export const updateUnitSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "El nombre es requerido"),
    symbol: z.string().optional(),
});

export const deleteUnitSchema = z.object({
    id: z.string().uuid(),
});

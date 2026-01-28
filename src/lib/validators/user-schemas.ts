import { z } from "zod";

export const updateProfileSchema = z.object({
    defaultCurrencyCode: z.string().min(3, "Código de moneda inválido").max(3).toUpperCase().optional(),
    image: z.union([z.literal(""), z.string().trim().url("URL de imagen inválida")]).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    country: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    parish: z.string().optional(),
    neighborhood: z.string().optional(),
    primaryStreet: z.string().optional(),
    secondaryStreet: z.string().optional(),
    addressReference: z.string().optional(),
    postalCode: z.string().optional(),
    socials: z.object({
        facebook: z.union([z.literal(""), z.string().trim().url("URL de Facebook inválida")]).optional(),
        twitter: z.union([z.literal(""), z.string().trim().url("URL de X (Twitter) inválida")]).optional(),
        linkedin: z.union([z.literal(""), z.string().trim().url("URL de LinkedIn inválida")]).optional(),
        instagram: z.union([z.literal(""), z.string().trim().url("URL de Instagram inválida")]).optional(),
    }).optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

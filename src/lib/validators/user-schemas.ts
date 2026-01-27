import { z } from "zod";

export const updateProfileSchema = z.object({
    defaultCurrencyCode: z.string().min(3, "Código de moneda inválido").max(3).toUpperCase(),
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

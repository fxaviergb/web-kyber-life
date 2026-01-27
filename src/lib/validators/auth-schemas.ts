import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Ingresa tu contraseña"),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token requerido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Loader2, ArrowLeft, Mail, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialState: any = {
    error: undefined,
    success: false,
    message: ""
};

export default function RecoverPasswordPage() {
    const [state, action, pending] = useActionState(forgotPasswordAction, initialState);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: state.error,
            });
        }
        if (state?.success) {
            toast({
                title: "Correo enviado",
                description: state.message || "Revisa tu bandeja de entrada.",
            });
        }
    }, [state, toast]);

    return (
        <div className="w-full">
            <div className="mb-10 flex flex-col items-center text-center">
                {/* Logo */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/20">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                        <h1 className="text-4xl font-bold tracking-tight text-text-primary">
                            Kyber<span className="font-light text-text-tertiary">Life</span>
                        </h1>
                    </div>
                </div>
            </div>

            {state?.success ? (
                <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-accent-success/20 text-accent-success rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary">Correo enviado</h2>
                    <p className="type-secondary text-text-tertiary max-w-xs mx-auto">
                        Hemos enviado un enlace de recuperación a tu correo.
                    </p>
                    {state.message && (
                        <p className="text-xs text-text-tertiary opacity-70">({state.message})</p>
                    )}
                    <Button asChild className="w-full h-11 type-button bg-accent-violet hover:bg-accent-violet/90 text-white rounded-lg mt-6" variant="default">
                        <Link href="/auth/login">Volver al inicio de sesión</Link>
                    </Button>
                </div>
            ) : (
                <form action={action} className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-medium text-text-primary">Recuperar Contraseña</h2>
                        <p className="type-secondary text-text-tertiary mt-1">Ingresa tu email para recibir un enlace de recuperación</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="type-label text-text-primary">Correo Electrónico</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            required
                            className="h-11 type-body bg-transparent border-border-base focus:border-accent-violet rounded-lg hover:border-gray-400 transition-colors"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-11 type-button bg-accent-violet hover:bg-accent-violet/90 text-white rounded-lg shadow-lg shadow-accent-violet/25 hover:shadow-accent-violet/40 transition-all duration-300"
                        disabled={pending}
                    >
                        {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Enviar Enlace"}
                    </Button>

                    <div className="type-secondary text-center text-text-tertiary pt-2">
                        <Link href="/auth/login" className="type-button text-text-secondary hover:text-text-primary flex items-center justify-center gap-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </Link>
                    </div>
                </form>
            )}
        </div>
    );
}

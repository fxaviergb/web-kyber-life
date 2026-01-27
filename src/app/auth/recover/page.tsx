"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
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
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
            <Card className="w-full max-w-md border-border-base bg-bg-secondary shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/auth/login" className="text-text-tertiary hover:text-text-primary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <CardTitle className="text-xl text-text-primary">Recuperar Contraseña</CardTitle>
                    </div>
                    <CardDescription>
                        Ingresa tu email para recibir un enlace de recuperación.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {state?.success ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-12 h-12 bg-accent-success/20 text-accent-success rounded-full flex items-center justify-center mx-auto">
                                <Mail className="w-6 h-6" />
                            </div>
                            <p className="text-text-secondary">
                                Hemos enviado un enlace de recuperación a tu correo.
                                <br />
                                (Modo Demo: Revisa la consola del servidor/Vercel Logs)
                            </p>
                            <Button asChild className="w-full mt-4" variant="outline">
                                <Link href="/auth/login">Volver al Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <form action={action} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="nombre@ejemplo.com"
                                    required
                                    className="bg-bg-tertiary/50 border-border-base"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-accent-primary hover:bg-accent-primary/90"
                                disabled={pending}
                            >
                                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Enlace"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

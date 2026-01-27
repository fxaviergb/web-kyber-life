"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation"; // Added import for redirect

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, null);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            router.push("/dashboard");
        }
    }, [state, router]);

    return (
        <Card className="bg-bg-1 border-border shadow-2xl">
            <CardHeader>
                <CardTitle className="text-2xl text-center text-text-1">Iniciar Sesión</CardTitle>
                <CardDescription className="text-center text-text-2">
                    Ingresa tus credenciales para continuar
                </CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            required
                            className="bg-bg-2 border-input focus:border-accent-violet"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="bg-bg-2 border-input focus:border-accent-violet"
                        />
                    </div>
                    {state?.error && (
                        <div className="text-sm text-destructive font-medium text-center">
                            {state.error}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <div className="w-full flex justify-end">
                        <Link href="/auth/recover" className="text-sm text-text-tertiary hover:text-accent-primary hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-accent-violet hover:bg-accent-violet/90 text-white"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ingresar"}
                    </Button>
                    <div className="text-sm text-center text-text-3">
                        ¿No tienes cuenta?{" "}
                        <Link href="/auth/register" className="text-accent-mint hover:underline">
                            Regístrate aquí
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

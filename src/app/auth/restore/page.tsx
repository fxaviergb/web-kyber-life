"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPasswordAction } from "@/app/actions/auth";
import { Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialState = {
    error: undefined,
    success: false,
};

export default function RestorePasswordPage() {
    const [state, action, pending] = useActionState(resetPasswordAction, initialState);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

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
                title: "Éxito",
                description: "Contraseña actualizada. Redirigiendo...",
            });
            setTimeout(() => router.push("/auth/login"), 2000);
        }
    }, [state, toast, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
            <Card className="w-full max-w-md border-border-base bg-bg-secondary shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/auth/login" className="text-text-tertiary hover:text-text-primary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <CardTitle className="text-xl text-text-primary">Restablecer Contraseña</CardTitle>
                    </div>
                    <CardDescription>
                        Ingresa una nueva contraseña para tu cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        <input type="hidden" name="token" value={token} />

                        <div className="space-y-2">
                            <Label htmlFor="password">Nueva Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                className="bg-bg-tertiary/50 border-border-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                className="bg-bg-tertiary/50 border-border-base"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-accent-primary hover:bg-accent-primary/90"
                            disabled={pending}
                        >
                            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cambiar Contraseña"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

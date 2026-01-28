"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerAction, null);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            router.push("/dashboard");
        }
    }, [state, router]);

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

            <form action={formAction} className="space-y-6">
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

                <div className="space-y-2">
                    <Label htmlFor="password" className="type-label text-text-primary">Contraseña</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        className="h-11 type-body bg-transparent border-border-base focus:border-accent-violet rounded-lg hover:border-gray-400 transition-colors"
                    />
                    <p className="text-[10px] text-text-tertiary">Mínimo 8 caracteres</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="type-label text-text-primary">Confirmar Contraseña</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className="h-11 type-body bg-transparent border-border-base focus:border-accent-violet rounded-lg hover:border-gray-400 transition-colors"
                    />
                </div>

                {state?.error && (
                    <div className="type-secondary text-destructive bg-destructive/10 p-3 rounded-lg flex items-center justify-center gap-2 text-center">
                        {state.error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-11 type-button bg-accent-violet hover:bg-accent-violet/90 text-white rounded-lg shadow-lg shadow-accent-violet/25 hover:shadow-accent-violet/40 transition-all duration-300"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrarse"}
                </Button>

                <div className="type-secondary text-center text-text-tertiary pt-2">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/auth/login" className="type-button text-accent-violet hover:underline">
                        Ingresa aquí
                    </Link>
                </div>
            </form>
        </div>
    );
}

"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, null);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

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
                    <Label htmlFor="email" className="type-label text-text-primary">Correo Electrónico*</Label>
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
                    <Label htmlFor="password" className="type-label text-text-primary">Contraseña*</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingresa tu contraseña"
                            required
                            className="h-11 type-body bg-transparent border-border-base focus:border-accent-violet rounded-lg hover:border-gray-400 transition-colors pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="keep-logged-in" className="border-border-base data-[state=checked]:bg-accent-violet data-[state=checked]:border-accent-violet" />
                        <label
                            htmlFor="keep-logged-in"
                            className="type-secondary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-secondary"
                        >
                            Recordarme
                        </label>
                    </div>
                    <Link href="/auth/recover" className="type-button text-accent-violet hover:text-accent-violet/80 transition-colors">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {state?.error && (
                    <div className="type-secondary text-destructive bg-destructive/10 p-3 rounded-lg flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                        {state.error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-11 type-button bg-accent-violet hover:bg-accent-violet/90 text-white rounded-lg shadow-lg shadow-accent-violet/25 hover:shadow-accent-violet/40 transition-all duration-300"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar Sesión"}
                </Button>

                <div className="type-secondary text-center text-text-tertiary pt-2">
                    ¿No tienes cuenta?{" "}
                    <Link href="/auth/register" className="type-button text-accent-violet hover:underline">
                        Regístrate
                    </Link>
                </div>
            </form>
        </div>
    );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { RotateCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Generic error state for route segments (App Router `error.tsx`). Shows the
 * KyberLife robot with a danger glow + shake, a friendly message, and lets the
 * user retry (reset the boundary) or go back to the main dashboard.
 */
export function RouteError({ error, reset }: RouteErrorProps) {
    useEffect(() => {
        // Surface the error for debugging / monitoring.
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-7 px-4 text-center animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center">
                <div
                    className="absolute inset-0 rounded-full bg-rose-500/25 blur-2xl animate-pulse"
                    style={{ width: 132, height: 132, animationDuration: "2s" }}
                />
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes shake-robot {
                        0%, 100% { transform: translateX(0) rotate(0deg); }
                        20% { transform: translateX(-4px) rotate(-3deg); }
                        40% { transform: translateX(4px) rotate(3deg); }
                        60% { transform: translateX(-3px) rotate(-2deg); }
                        80% { transform: translateX(3px) rotate(2deg); }
                    }
                    .animate-shake-robot { animation: shake-robot 2.4s ease-in-out infinite; }
                `}} />
                <div className="animate-shake-robot relative z-10 drop-shadow-2xl grayscale-[40%]">
                    <Image
                        src="/images/logo-kyber-blue.png"
                        alt="Error"
                        width={104}
                        height={104}
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-bold tracking-tight text-text-primary">Algo salió mal</h2>
                <p className="text-sm leading-relaxed text-text-tertiary">
                    No pudimos cargar esta sección. Puedes reintentar o volver al panel principal.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                    onClick={() => reset()}
                    className="rounded-xl bg-accent-info hover:bg-accent-info/90 text-white gap-2 px-6 h-11 shadow-lg shadow-accent-info/25 transition-all hover:scale-105"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reintentar
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="rounded-xl gap-2 px-6 h-11 border-border-base bg-transparent hover:bg-bg-secondary text-text-primary"
                >
                    <Link href="/dashboard">
                        <LayoutDashboard className="h-4 w-4" />
                        Volver al dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}

"use client";

import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";

interface DashboardEmptyStateProps {
    userFirstName?: string | null;
}

export function DashboardEmptyState({ userFirstName }: DashboardEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-4 md:p-8">
            <div
                className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
                {/* Icon Container */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-accent-primary/10 rounded-full animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative bg-bg-secondary p-6 rounded-2xl shadow-xl shadow-accent-primary/10 border border-border-base">
                            <ShoppingBag className="w-12 h-12 text-accent-primary" />
                            {/* Floating decorative icons */}
                            <div className="absolute -top-3 -right-3 bg-bg-primary p-2 rounded-lg border border-border-base shadow-sm">
                                <TrendingUp className="w-4 h-4 text-accent-success" />
                            </div>
                            <div className="absolute -bottom-2 -left-3 bg-bg-primary p-2 rounded-lg border border-border-base shadow-sm">
                                <BarChart3 className="w-4 h-4 text-accent-violet" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                        ¡Hola, {userFirstName || "Bienvenido"}!
                    </h2>
                    <p className="text-text-secondary text-base leading-relaxed">
                        Aún no tienes actividad registrada. <br className="hidden md:block" />
                        Comienza tu primera compra para desbloquear estadísticas sobre tus hábitos de consumo.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/25 rounded-full px-8 h-12 text-base font-medium transition-all hover:scale-105"
                    >
                        <Link href="/market/purchases/new">
                            <Plus className="mr-2 h-5 w-5" />
                            Registrar Primera Compra
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-border-base bg-transparent hover:bg-bg-secondary text-text-primary rounded-full px-8 h-12"
                    >
                        <Link href="/market/items">
                            Explorar Productos
                        </Link>
                    </Button>
                </div>

                {/* Quick Tips */}
                <div className="pt-8 grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-bg-secondary/50 rounded-xl border border-border-base/50">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Ahorro</p>
                        <p className="text-sm text-text-primary">Compara precios entre supermercados</p>
                    </div>
                    <div className="p-3 bg-bg-secondary/50 rounded-xl border border-border-base/50">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Control</p>
                        <p className="text-sm text-text-primary">Visualiza tus gastos mensuales</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

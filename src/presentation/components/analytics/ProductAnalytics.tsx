"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, Tag } from "lucide-react";

interface ProductAnalyticsProps {
    data: {
        generics: { id: string; name: string; value: number }[];
        brands: { id: string; name: string; value: number }[];
    };
    mode: 'count' | 'units';
}

export function ProductAnalytics({ data, mode }: ProductAnalyticsProps) {
    const label = mode === 'count' ? "veces comprado" : "unidades";

    return (
        <Card className="bg-bg-2 border-border h-full">
            <CardHeader>
                <CardTitle className="text-text-1">Productos Más Frecuentes</CardTitle>
                <CardDescription className="text-text-3">
                    Top 10 por {mode === 'count' ? "impresiones en tickets" : "cantidad total"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="generics" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-bg-1">
                        <TabsTrigger value="generics">Genéricos</TabsTrigger>
                        <TabsTrigger value="brands">Marcas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="generics" className="mt-4 space-y-2">
                        {data.generics.map((item, i) => (
                            <div key={item.id} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-accent-gold font-bold w-6">{i + 1}.</span>
                                    <div className="flex items-center gap-2 text-text-1">
                                        <Package className="w-4 h-4 text-text-3" />
                                        {item.name}
                                    </div>
                                </div>
                                <span className="text-text-2 text-sm font-mono bg-bg-1 px-2 py-0.5 rounded">
                                    {item.value} {label}
                                </span>
                            </div>
                        ))}
                        {data.generics.length === 0 && <p className="text-center text-text-3 py-4">Sin datos</p>}
                    </TabsContent>

                    <TabsContent value="brands" className="mt-4 space-y-2">
                        {data.brands.map((item, i) => (
                            <div key={item.id} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-accent-mint font-bold w-6">{i + 1}.</span>
                                    <div className="flex items-center gap-2 text-text-1">
                                        <Tag className="w-4 h-4 text-text-3" />
                                        {item.name}
                                    </div>
                                </div>
                                <span className="text-text-2 text-sm font-mono bg-bg-1 px-2 py-0.5 rounded">
                                    {item.value} {label}
                                </span>
                            </div>
                        ))}
                        {data.brands.length === 0 && <p className="text-center text-text-3 py-4">Sin datos</p>}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

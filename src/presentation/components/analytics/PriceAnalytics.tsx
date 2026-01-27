"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPriceAnalyticsAction, getGenericPriceAnalyticsAction } from "@/app/actions/analytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Search, Tag, Package } from "lucide-react";
import { BrandProduct, GenericItem } from "@/domain/entities";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceAnalyticsProps {
    searchableProducts: BrandProduct[];
    searchableGenericItems: GenericItem[];
}

type SearchMode = "specific" | "generic";

export function PriceAnalytics({ searchableProducts, searchableGenericItems }: PriceAnalyticsProps) {
    const [mode, setMode] = useState<SearchMode>("specific");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState<{ id: string, name: string, subtitle?: string } | null>(null);
    const [analyticsData, setAnalyticsData] = useState<{ history: any[], latest: any[] } | null>(null);
    const [loading, setLoading] = useState(false);

    // Filter logic based on mode
    const matches = searchTerm.length < 2 ? [] : (
        mode === "specific"
            ? searchableProducts.filter(p =>
                p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.presentation.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10).map(p => ({
                id: p.id,
                name: p.brand,
                subtitle: p.presentation,
                original: p
            }))
            : searchableGenericItems.filter(i =>
                i.canonicalName.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10).map(i => ({
                id: i.id,
                name: i.canonicalName,
                subtitle: "Genérico",
                original: i
            }))
    );

    const handleSelect = async (item: any) => {
        setSelectedItem({ id: item.id, name: item.name, subtitle: item.subtitle });
        setSearchTerm("");
        setLoading(true);
        setAnalyticsData(null);

        let res;
        if (mode === "specific") {
            res = await getPriceAnalyticsAction(item.id);
        } else {
            res = await getGenericPriceAnalyticsAction(item.id);
        }

        if (res.success) {
            setAnalyticsData(res.data);
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    return (
        <Card className="bg-bg-2 border-border h-full min-h-[600px]">
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-white">Análisis de Precios</CardTitle>
                        <CardDescription className="text-text-3">
                            Comparativa entre supermercados e historial
                        </CardDescription>
                    </div>
                    <Tabs value={mode} onValueChange={(v) => { setMode(v as SearchMode); setSelectedItem(null); setAnalyticsData(null); }}>
                        <TabsList className="bg-bg-1">
                            <TabsTrigger value="specific" className="gap-2">
                                <Package className="w-4 h-4" /> Por Marca
                            </TabsTrigger>
                            <TabsTrigger value="generic" className="gap-2">
                                <Tag className="w-4 h-4" /> Por Genérico
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Search */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-text-3" />
                        <Input
                            placeholder={mode === "specific" ? "Buscar por marca (ej. San Fernando)..." : "Buscar genérico (ej. Arroz)..."}
                            className="pl-9 bg-bg-1 border-border text-text-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Results Dropdown */}
                    {matches.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-bg-1 border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                            {matches.map(item => (
                                <div
                                    key={item.id}
                                    className="p-3 hover:bg-white/10 cursor-pointer text-text-1 text-sm border-b border-white/5 last:border-0"
                                    onClick={() => handleSelect(item)}
                                >
                                    <span className="font-bold">{item.name}</span> <span className="text-text-2">{item.subtitle}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Item View */}
                {selectedItem && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-accent-gold">{selectedItem.name}</h3>
                                <p className="text-text-2">{selectedItem.subtitle}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedItem(null); setAnalyticsData(null); }}>
                                Limpiar
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <span className="loader text-accent-mint">Cargando datos...</span>
                            </div>
                        ) : analyticsData ? (
                            <div className="space-y-8">
                                {/* Latest Prices Table */}
                                <div>
                                    <h4 className="text-sm font-bold text-text-2 mb-3 uppercase tracking-wider">
                                        {mode === "generic" ? "Mejor Precio Actual por Supermercado" : "Últimos Precios Observados"}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {analyticsData.latest.map((item: any) => (
                                            <div key={item.supermarketId} className="flex justify-between p-3 bg-bg-1 rounded border border-border">
                                                <span className="text-text-1 font-medium">{item.supermarketId /* TODO: Map Name in Client or Service */}</span>
                                                <div className="text-right">
                                                    <span className="text-accent-mint font-bold block">${item.price.toFixed(2)}</span>
                                                    <span className="text-xs text-text-3">{new Date(item.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {analyticsData.latest.length === 0 && <p className="text-text-3 italic text-sm">Sin datos de precios.</p>}
                                    </div>
                                </div>

                                {/* History Chart */}
                                <div>
                                    <h4 className="text-sm font-bold text-text-2 mb-3 uppercase tracking-wider">Historial de Precios {mode === "generic" && "(Mínimo)"}</h4>
                                    <div className="h-[300px] w-full bg-bg-1/50 rounded p-2 border border-white/5">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={analyticsData.history}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#888"
                                                    fontSize={12}
                                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    tickLine={false} axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#888"
                                                    fontSize={12}
                                                    domain={['auto', 'auto']}
                                                    tickLine={false} axisLine={false}
                                                    tickFormatter={(val) => `$${val}`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1E1E2E', borderColor: '#333', color: '#fff' }}
                                                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                                    formatter={(value: number | undefined) => [value ? `$${value.toFixed(2)}` : "No data", "Precio"]}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke="#FFB6C1"
                                                    strokeWidth={2}
                                                    dot={{ r: 4, fill: '#FFB6C1' }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {!selectedItem && (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg opacity-50">
                        <p className="text-text-3">Selecciona el modo y busca un producto para comenzar.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MoreVertical, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getProductPriceHistory } from "@/app/dashboard/actions";

interface PriceHistoryCardProps {
    initialProducts: { id: string; name: string }[];
}

export function PriceHistoryCard({ initialProducts }: PriceHistoryCardProps) {
    const [selectedProduct, setSelectedProduct] = useState<string>(initialProducts[0]?.id || "");
    const [data, setData] = useState<{ date: string; price: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedProduct) return;

        setLoading(true);
        getProductPriceHistory(selectedProduct)
            .then(res => {
                setData(res.map(item => ({ date: item.date, price: item.price || 0 })));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedProduct]);

    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Histórico Precios</h3>
                    <p className="text-xs text-text-tertiary flex items-center gap-2 mt-1">
                        {loading && <Loader2 size={12} className="animate-spin" />}
                        {data.length} Observaciones
                    </p>
                </div>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="w-[200px] text-xs h-8 border-border-base bg-bg-secondary/50">
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                        {initialProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                                {product.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-base)" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                            dy={10}
                            tickFormatter={(val) => {
                                const d = new Date(val);
                                return d.toLocaleDateString('es-ES', { month: '2-digit', day: '2-digit' });
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                            tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Precio']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES')}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="pt-6 mt-2 border-t border-border-base grid grid-cols-2 gap-4">
                <div className="text-center">
                    <p className="text-xs text-text-tertiary -mb-1">Promedio</p>
                    <p className="text-lg font-bold text-text-primary">
                        ${(data.reduce((a, b) => a + b.price, 0) / (data.length || 1)).toFixed(2)}
                    </p>
                </div>
                <div className="text-center border-l border-border-base">
                    <p className="text-xs text-text-tertiary -mb-1">Actual</p>
                    <p className="text-lg font-bold text-accent-primary">
                        ${data.length > 0 ? data[data.length - 1].price.toFixed(2) : "0.00"}
                    </p>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MoreVertical, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { getProductPriceHistory } from "@/app/dashboard/actions";

interface PriceHistoryCardProps {
    initialProducts: { id: string; name: string }[];
}

export function PriceHistoryCard({ initialProducts }: PriceHistoryCardProps) {
    const [open, setOpen] = useState(false);
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
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[200px] justify-between text-xs h-8 border-border-base bg-bg-secondary/50"
                        >
                            {selectedProduct
                                ? initialProducts.find((p) => p.id === selectedProduct)?.name
                                : "Seleccionar..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar producto..." className="h-9" />
                            <CommandList>
                                <CommandEmpty>No encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {initialProducts.map((product) => (
                                        <CommandItem
                                            key={product.id}
                                            value={product.id}
                                            keywords={[product.name]}
                                            onSelect={() => {
                                                setSelectedProduct(product.id);
                                                setOpen(false);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {product.name}
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    selectedProduct === product.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
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
            <div className="pt-6 mt-2 border-t border-border-base flex justify-between items-center">
                <div className="text-center w-full">
                    <p className="text-xs text-text-tertiary -mb-1">Promedio</p>
                    <p className="text-lg font-bold text-text-primary">
                        ${(data.reduce((a, b) => a + b.price, 0) / (data.length || 1)).toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}

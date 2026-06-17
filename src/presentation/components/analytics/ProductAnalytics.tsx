"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart as BarChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductAnalyticsProps {
    data: {
        generics: { id: string; name: string; value: number }[];
        brands: { id: string; name: string; value: number }[];
    };
    mode: 'count' | 'units';
}

const COLORS = ['#5b4dff', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'];

export function ProductAnalytics({ data, mode }: ProductAnalyticsProps) {
    const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');
    const [topCount, setTopCount] = useState<5 | 10>(5);

    const label = mode === 'count' ? "veces comprado" : "unidades";

    const renderChart = (chartDataRaw: { id: string, name: string, value: number }[]) => {
        const chartData = chartDataRaw.slice(0, topCount);

        if (chartData.length === 0) {
            return <div className="flex items-center justify-center h-full text-text-tertiary text-sm min-h-[300px]">Sin datos suficientes</div>;
        }

        const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
                    {value}
                </text>
            );
        };

        if (chartType === 'donut') {
            return (
                <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={4}
                                dataKey="value"
                                label={renderCustomizedLabel}
                                labelLine={false}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--bg-primary)" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                layout="horizontal"
                                iconType="circle"
                                wrapperStyle={{ paddingTop: "20px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}
                                formatter={(value) => <span className="text-sm text-text-secondary font-medium truncate max-w-[80px]" title={value}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        const maxValue = Math.max(...chartData.map(d => d.value));

        return (
            <div className="w-full mt-4 space-y-6 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
                {chartData.map((item, index) => {
                    const widthPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    return (
                        <div key={item.id} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-text-primary text-[15px]">{item.name}</span>
                                <span className="font-bold text-text-primary text-[15px]">{item.value} {mode === 'count' ? '' : 'un.'}</span>
                            </div>
                            <div className="w-full bg-bg-secondary h-2.5 rounded-full overflow-hidden">
                                <div 
                                   className="h-full rounded-full transition-all duration-500 ease-in-out" 
                                   style={{ width: `${widthPercentage}%`, backgroundColor: COLORS[index % COLORS.length] }} 
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Card className="bg-bg-primary rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-text-primary">
                    {mode === 'count' ? "Frecuencia de Compra" : "Volumen de Compra"}
                </CardTitle>
                <CardDescription className="text-sm text-text-tertiary">
                    {mode === 'count' ? "Clasificados por la cantidad de veces que los has comprado" : "Clasificados por el volumen total de unidades compradas"}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <Tabs defaultValue="generics" className="w-full flex-1 flex flex-col">
                    <div className="flex flex-col gap-4 mb-4">
                        <TabsList className="grid w-full grid-cols-2 bg-bg-secondary">
                            <TabsTrigger value="generics">Genéricos</TabsTrigger>
                            <TabsTrigger value="brands">Marcas</TabsTrigger>
                        </TabsList>

                        <div className="flex justify-end gap-3 items-center">
                            {/* Top 5 / 10 Toggle */}
                            <Select value={topCount.toString()} onValueChange={(v) => setTopCount(Number(v) as 5 | 10)}>
                                <SelectTrigger className="w-[100px] h-8 text-xs bg-bg-secondary border-border-base text-text-primary rounded-lg focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="Top" />
                                </SelectTrigger>
                                <SelectContent className="bg-bg-secondary border-border-base text-text-primary">
                                    <SelectItem value="5" className="text-xs focus:bg-white/5 focus:text-text-primary cursor-pointer">Top 5</SelectItem>
                                    <SelectItem value="10" className="text-xs focus:bg-white/5 focus:text-text-primary cursor-pointer">Top 10</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Bar / Donut Toggle */}
                            <div className="flex bg-bg-secondary rounded-lg p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setChartType('bar')}
                                    className={`h-7 w-8 p-0 ${chartType === 'bar' ? 'bg-bg-primary shadow-sm text-text-primary' : 'text-text-tertiary'}`}
                                >
                                    <BarChartIcon size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setChartType('donut')}
                                    className={`h-7 w-8 p-0 ${chartType === 'donut' ? 'bg-bg-primary shadow-sm text-text-primary' : 'text-text-tertiary'}`}
                                >
                                    <PieChartIcon size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="generics" className="flex-1 mt-0">
                        {renderChart(data.generics)}
                    </TabsContent>

                    <TabsContent value="brands" className="flex-1 mt-0">
                        {renderChart(data.brands)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopProductsChartProps {
    data: { id: string; name: string; value: number }[];
}

const COLORS = ['#5b4dff', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function TopProductsChart({ data }: TopProductsChartProps) {
    // Take top 5 for the chart
    const chartData = data.slice(0, 5);

    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Productos Top</h3>
                    <p className="text-xs text-text-tertiary">Más comprados (últimos 6 meses)</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary">
                    <MoreVertical size={16} />
                </Button>
            </div>

            <div className="flex-1 w-full min-h-[400px]">
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                        Sin datos suficientes
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 10, right: 0, bottom: 10, left: 0 }}>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={100}
                                outerRadius={140}
                                paddingAngle={4}
                                dataKey="value"
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
                                wrapperStyle={{ paddingTop: "20px" }}
                                formatter={(value) => <span className="text-sm text-text-secondary font-medium ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

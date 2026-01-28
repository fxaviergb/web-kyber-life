"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SalesBarChartProps {
    data: { month: string; total: number }[];
}

export function SalesBarChart({ data }: SalesBarChartProps) {
    // Determine max value for active highlighting or scaling
    const maxVal = Math.max(...data.map(d => d.total));

    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-primary">Gasto Mensual</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary">
                    <MoreVertical size={16} />
                </Button>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={12}>
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Gasto']}
                        />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                            dy={10}
                            tickFormatter={(val) => {
                                // Convert YYYY-MM to Month Short (e.g. Ene)
                                const [y, m] = val.split('-');
                                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                                const month = date.toLocaleDateString('es-ES', { month: 'short' });
                                return month.charAt(0).toUpperCase() + month.slice(1);
                            }}
                        />
                        <Bar dataKey="total" radius={[10, 10, 10, 10]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.total === maxVal ? 'var(--accent-primary)' : '#4338ca'}
                                    className="dark:opacity-80 transition-all duration-300 hover:opacity-100"
                                    style={{ fill: entry.total === maxVal ? '#5b4dff' : '#E0E7FF' }} // Reference colors: Active Blue vs Light Blue
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

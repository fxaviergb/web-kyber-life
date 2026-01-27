"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpenseChartProps {
    data: { month: string; total: number }[];
}

export function ExpenseChart({ data }: ExpenseChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                    dataKey="month"
                    stroke="#888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E2E', borderColor: '#333', color: '#FFF' }}
                    itemStyle={{ color: '#D4AF37' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Total"]}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#D4AF37"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

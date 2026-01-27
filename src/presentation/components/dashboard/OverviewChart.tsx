"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export function OverviewChart({ data }: { data: { date: string, amount: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#10163A', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Bar
                    dataKey="amount"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-accent-violet"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

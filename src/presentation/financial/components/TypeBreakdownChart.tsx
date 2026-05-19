"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { TypeBreakdown } from "@/application/services/financial-dashboard-service";

interface TypeBreakdownChartProps {
    data: TypeBreakdown[];
}

const COLORS = [
    "hsl(221, 83%, 53%)",   // Blue
    "hsl(0, 84%, 60%)",     // Red
    "hsl(142, 71%, 45%)",   // Green
    "hsl(38, 92%, 50%)",    // Amber
    "hsl(262, 83%, 58%)",   // Purple
    "hsl(174, 72%, 44%)",   // Teal
    "hsl(333, 71%, 51%)",   // Pink
    "hsl(24, 94%, 50%)",    // Orange
];

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TypeBreakdownChart({ data }: TypeBreakdownChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No transaction data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={320}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    dataKey="total"
                    nameKey="type"
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                >
                    {data.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                    }}
                />
                <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => (
                        <span className="text-sm text-foreground capitalize">
                            {value.toLowerCase()}
                        </span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

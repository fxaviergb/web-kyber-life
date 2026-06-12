"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { CategoryBreakdown } from "@/application/services/financial-dashboard-service";

interface CategoryPieChartProps {
    data: CategoryBreakdown[];
    grandTotal: number;
}

const DISTINCT_COLORS = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#22c55e", // Green
    "#eab308", // Yellow
    "#a855f7", // Purple
    "#f97316", // Orange
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#84cc16", // Lime
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#f43f5e", // Rose
    "#10b981", // Emerald
];

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CategoryPieChart({ data, grandTotal }: CategoryPieChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No hay datos de categorías disponibles
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[350px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={100}
                        outerRadius={140}
                        dataKey="total"
                        nameKey="categoryName"
                        paddingAngle={5}
                        stroke="none"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                            const realPercent = grandTotal > 0 ? value / grandTotal : 0;
                            if (realPercent < 0.02) return null; // hide very small percentages

                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const safeMidAngle = midAngle || 0;
                            const x = cx + radius * Math.cos(-safeMidAngle * Math.PI / 180);
                            const y = cy + radius * Math.sin(-safeMidAngle * Math.PI / 180);

                            return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold drop-shadow-md">
                                    {`${(realPercent * 100).toFixed(1)}%`}
                                </text>
                            );
                        }}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={DISTINCT_COLORS[index % DISTINCT_COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-bg-secondary/95 border border-border-base shadow-xl rounded-xl p-4 backdrop-blur-md min-w-[150px]">
                                        <p className="text-sm font-medium text-text-secondary mb-1">
                                            {payload[0].name}
                                        </p>
                                        <p 
                                            className="text-2xl font-bold tracking-tight" 
                                            style={{ color: payload[0].payload.fill }}
                                        >
                                            {formatCurrency(payload[0].value as number)}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value: string) => (
                            <span className="text-sm text-foreground">
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { CategoryBreakdown } from "@/application/services/financial-dashboard-service";

interface CategoryPieChartProps {
    data: CategoryBreakdown[];
}

const FALLBACK_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
];

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No hay datos de categorías disponibles
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
                    outerRadius={80}
                    dataKey="amount"
                    nameKey="categoryName"
                    paddingAngle={5}
                    strokeWidth={2}
                    stroke="var(--color-bg-primary)"
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                    contentStyle={{
                        backgroundColor: "var(--color-bg-secondary)",
                        borderColor: "var(--color-border-base)",
                        borderRadius: "8px",
                        color: "var(--color-text-primary)",
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
    );
}

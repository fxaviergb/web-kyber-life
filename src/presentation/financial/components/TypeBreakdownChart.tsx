"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { TypeBreakdown } from "@/application/services/financial-dashboard-service";

interface TypeBreakdownChartProps {
    data: TypeBreakdown[];
}

const COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
    "var(--color-accent-info)",
    "var(--color-accent-success)",
    "var(--color-accent-warning)",
];

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TypeBreakdownChart({ data }: TypeBreakdownChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No hay datos de transacciones disponibles
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
                    stroke="var(--color-bg-primary)"
                >
                    {data.map((entry, index) => {
                        let color = COLORS[index % COLORS.length];
                        if (entry.type === 'WITHDRAWAL') {
                            color = "#0284c7";
                        } else if (entry.type === 'INCOME' || entry.type === 'DEPOSIT') {
                            color = "hsl(142, 71%, 45%)";
                        } else if (entry.type === 'EXPENSE') {
                            color = "hsl(0, 84%, 60%)";
                        }
                        
                        return (
                            <Cell
                                key={`cell-${index}`}
                                fill={color}
                            />
                        );
                    })}
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
                        <span className="text-sm text-foreground capitalize">
                            {value.toLowerCase()}
                        </span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

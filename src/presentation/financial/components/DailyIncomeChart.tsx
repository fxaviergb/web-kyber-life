"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DailyBreakdown } from "@/application/services/financial-dashboard-service";

interface DailyIncomeChartProps {
    data: DailyBreakdown[];
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function DailyIncomeChart({ data }: DailyIncomeChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No hay datos diarios disponibles
            </div>
        );
    }

    const chartData = data.map(d => ({
        ...d,
        label: formatDate(d.date),
    }));

    return (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorIncomeTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickMargin={10}
                    minTickGap={30}
                />
                <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    width={60}
                />
                <Tooltip
                    labelFormatter={(label) => label}
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Ingreso Diario"]}
                    contentStyle={{
                        backgroundColor: "var(--color-bg-secondary)",
                        borderColor: "var(--color-border-base)",
                        borderRadius: "8px",
                        color: "var(--color-text-primary)",
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorIncomeTotal)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

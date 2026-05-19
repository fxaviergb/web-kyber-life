"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MonthlyBreakdown } from "@/application/services/financial-dashboard-service";

interface MonthlyChartProps {
    data: MonthlyBreakdown[];
}

const MONTH_LABELS: Record<string, string> = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

function formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split("-");
    return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`;
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
    const chartData = data.map(d => ({
        ...d,
        label: formatMonth(d.month),
    }));

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                />
                <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    width={70}
                />
                <Tooltip
                    formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                    }}
                />
                <Legend />
                <Bar
                    dataKey="income"
                    name="Income"
                    fill="hsl(142, 71%, 45%)"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="hsl(0, 84%, 60%)"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

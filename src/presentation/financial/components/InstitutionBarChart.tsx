"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { InstitutionBreakdown } from "@/application/services/financial-dashboard-service";

interface InstitutionBarChartProps {
    data: InstitutionBreakdown[];
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function InstitutionBarChart({ data }: InstitutionBarChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No hay datos de instituciones disponibles
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                <XAxis
                    type="number"
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                />
                <YAxis
                    dataKey="institutionName"
                    type="category"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    width={100}
                />
                <Tooltip
                    formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                    contentStyle={{
                        backgroundColor: "var(--color-bg-secondary)",
                        borderColor: "var(--color-border-base)",
                        borderRadius: "8px",
                        color: "var(--color-text-primary)",
                    }}
                />
                <Bar
                    dataKey="total"
                    name="Volumen Total"
                    fill="var(--color-accent-primary)"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

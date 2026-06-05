"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { InstitutionBreakdown } from "@/application/services/financial-dashboard-service";

interface InstitutionBarChartProps {
    data: InstitutionBreakdown[];
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Premium vibrant color palette for high contrast and modern aesthetics
const COLORS = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
    "#6366f1", // indigo-500
    "#14b8a6", // teal-500
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const color = payload[0].color || "var(--color-accent-primary)";
        return (
            <div className="backdrop-blur-md bg-background/80 border border-border/50 p-4 rounded-xl shadow-xl z-50 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-muted-foreground">{data.institutionName}</span>
                </div>
                <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                    {formatCurrency(data.total)}
                </span>
            </div>
        );
    }
    return null;
};

export function InstitutionBarChart({ data }: InstitutionBarChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No hay datos de instituciones disponibles
            </div>
        );
    }

    // Dynamic height calculation to prevent overlapping when there are many institutions
    const MIN_HEIGHT = 320;
    const ITEM_HEIGHT = 45; // Generous space per bar to prevent clutter
    const calculatedHeight = Math.max(MIN_HEIGHT, data.length * ITEM_HEIGHT);

    return (
        <div 
            className="w-full overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80 transition-all" 
            style={{ maxHeight: "350px" }}
        >
            <div style={{ height: calculatedHeight, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={true} vertical={false} />
                        <XAxis
                            type="number"
                            tickFormatter={formatCurrency}
                            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                            axisLine={{ stroke: "var(--color-border-base)" }}
                            tickLine={{ stroke: "var(--color-border-base)" }}
                        />
                        <YAxis
                            dataKey="institutionName"
                            type="category"
                            tick={{ fontSize: 12, fill: "var(--color-text-primary)", fontWeight: 500 }}
                            width={130}
                            axisLine={{ stroke: "var(--color-border-base)" }}
                            tickLine={false}
                            tickFormatter={(value: string) => value.length > 18 ? value.substring(0, 16) + '...' : value}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'var(--color-muted)', opacity: 0.15 }}
                        />
                        <Bar
                            dataKey="total"
                            name="Volumen Total"
                            radius={[0, 6, 6, 0]}
                            barSize={20}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

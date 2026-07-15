"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { CreditCard } from "lucide-react";
import { CategoryBreakdown } from "@/application/services/financial-dashboard-service";

interface CategoryPieChartProps {
    data: CategoryBreakdown[];
    grandTotal: number;
}

/** One donut slice — a category's real (cash) portion or its credit-card (pending) portion. */
interface SliceDatum {
    key: string;
    categoryName: string;
    value: number;
    colorIndex: number;
    kind: "real" | "credit";
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

    // Split each category into up to two adjacent slices — a solid "real"
    // (cash) portion and a hachured "con tarjeta" (pending) portion — so a
    // glance at the donut shows how much of each category is actually spent
    // vs. still pending on a credit card. Categories with no credit spending
    // render as a single solid slice, exactly as before.
    const hasAnyCredit = data.some((c) => c.creditTotal > 0);
    const slices: SliceDatum[] = data.flatMap((c, index) => {
        const real = Math.max(0, c.total - c.creditTotal);
        const entries: SliceDatum[] = [];
        if (real > 0) entries.push({ key: `${c.categoryId ?? c.categoryName}-real`, categoryName: c.categoryName, value: real, colorIndex: index, kind: "real" });
        if (c.creditTotal > 0) entries.push({ key: `${c.categoryId ?? c.categoryName}-credit`, categoryName: c.categoryName, value: c.creditTotal, colorIndex: index, kind: "credit" });
        return entries;
    });

    // One legend row per category (not per slice), so splitting a slice in two
    // never duplicates or clutters the legend.
    const legendPayload = data.map((c, index) => ({
        value: c.categoryName,
        type: "circle" as const,
        color: DISTINCT_COLORS[index % DISTINCT_COLORS.length],
    }));

    return (
        <div className="flex h-full w-full min-h-[350px] flex-1 flex-col">
            <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            {DISTINCT_COLORS.map((color, index) => (
                                <pattern key={index} id={`credit-hatch-${index}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                                    <rect width="6" height="6" fill={color} fillOpacity={0.35} />
                                    <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2" />
                                </pattern>
                            ))}
                        </defs>
                        <Pie
                            data={slices}
                            cx="50%"
                            cy="50%"
                            innerRadius={100}
                            outerRadius={140}
                            dataKey="value"
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
                            {slices.map((entry) => (
                                <Cell
                                    key={entry.key}
                                    fill={entry.kind === "credit" ? `url(#credit-hatch-${entry.colorIndex % DISTINCT_COLORS.length})` : DISTINCT_COLORS[entry.colorIndex % DISTINCT_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const slice = payload[0].payload as SliceDatum;
                                    return (
                                        <div className="bg-bg-secondary/95 border border-border-base shadow-xl rounded-xl p-4 backdrop-blur-md min-w-[150px]">
                                            <p className="text-sm font-medium text-text-secondary mb-1">
                                                {slice.categoryName}
                                                {slice.kind === "credit" && <span className="ml-1.5 text-[10px] font-normal text-amber-500">tarjeta · pendiente</span>}
                                            </p>
                                            <p
                                                className="text-2xl font-bold tracking-tight"
                                                style={{ color: DISTINCT_COLORS[slice.colorIndex % DISTINCT_COLORS.length] }}
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
                            content={() => (
                                <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2">
                                    {legendPayload.map((item) => (
                                        <li key={item.value} className="flex items-center gap-1.5 text-sm text-foreground">
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                            {item.value}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {hasAnyCredit && (
                <p className="mt-1 shrink-0 px-2 pb-0.5 text-center text-[11px] leading-relaxed text-muted-foreground">
                    <CreditCard className="mr-1 inline-block h-3 w-3 -translate-y-px text-amber-500" />
                    Rayado = pendiente de tarjeta
                </p>
            )}
        </div>
    );
}

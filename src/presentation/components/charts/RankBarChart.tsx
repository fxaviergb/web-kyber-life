"use client";

import { type ReactNode } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { formatChartCurrency } from "@/lib/date-bucketing";
import { cn } from "@/lib/utils";
import { RobotLoader } from "@/components/ui/RobotLoader";

export interface RankBarDatum {
    name: string;
    value: number;
    color?: string;
    /** Optional precomputed share (0-100). When absent it's derived from `total`/sum. */
    percentage?: number;
}

interface RankBarChartProps {
    data: RankBarDatum[];
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    emptyMessage?: string;
    valueFormatter?: (value: number) => string;
    /** Optional control rendered on the right of the header (e.g. a Top 5/10 select). */
    headerAction?: ReactNode;
    /** Show a percentage label at the end of each bar (and in the tooltip). */
    showPercentage?: boolean;
    /** Denominator for computed percentages (defaults to the sum of `data`). */
    total?: number;
    className?: string;
}

interface ChartDatum extends RankBarDatum {
    pct: number;
    pctLabel: string;
}

// Vibrant, high-contrast palette shared with the financial bar charts.
const COLORS = [
    "#6366f1", // indigo-500 (brand)
    "#10b981", // emerald-500
    "#3b82f6", // blue-500
    "#f59e0b", // amber-500
    "#ec4899", // pink-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
    "#ef4444", // red-500
    "#f97316", // orange-500
    "#14b8a6", // teal-500
];

/** Split a category label into up to `maxLines` lines of ~`maxChars`, truncating the last if needed. */
function wrapLabel(text: string, maxChars = 13, maxLines = 2): string[] {
    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxChars && current && lines.length < maxLines - 1) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    const lastIdx = lines.length - 1;
    if (lines[lastIdx] && lines[lastIdx].length > maxChars + 3) {
        lines[lastIdx] = lines[lastIdx].slice(0, maxChars + 1) + "…";
    }
    return lines;
}

interface CategoryTickProps {
    x?: number;
    y?: number;
    payload?: { value: string };
}

/** YAxis tick that wraps long category names onto up to two lines, vertically centered. */
function CategoryTick({ x = 0, y = 0, payload }: CategoryTickProps) {
    const lines = wrapLabel(payload?.value ?? "");
    const firstDy = lines.length === 1 ? 0.32 : 0.32 - (lines.length - 1) * 0.6;
    return (
        <text x={x} y={y} textAnchor="end" fill="var(--color-text-primary)" fontSize={12} fontWeight={500}>
            {lines.map((line, i) => (
                <tspan key={i} x={x} dy={`${i === 0 ? firstDy : 1.15}em`}>
                    {line}
                </tspan>
            ))}
        </text>
    );
}

function RankBarTooltip({
    active,
    payload,
    valueFormatter = formatChartCurrency,
    showPercentage = false,
}: {
    active?: boolean;
    payload?: Array<{ payload: ChartDatum; color?: string }>;
    valueFormatter?: (value: number) => string;
    showPercentage?: boolean;
}) {
    if (active && payload && payload.length) {
        const datum = payload[0].payload;
        const color = datum.color || payload[0].color || "var(--color-accent-primary)";
        return (
            <div className="backdrop-blur-md bg-background/80 border border-border/50 p-4 rounded-xl shadow-xl z-50 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-muted-foreground">{datum.name}</span>
                </div>
                <span className="text-2xl font-bold tracking-tight text-text-primary">
                    {valueFormatter(datum.value)}
                </span>
                {showPercentage && (
                    <span className="text-xs font-medium text-muted-foreground">{datum.pctLabel} del total</span>
                )}
            </div>
        );
    }
    return null;
}

export function RankBarChart({
    data,
    title,
    description,
    icon: Icon,
    iconClassName = "text-accent-primary",
    emptyMessage = "Sin datos",
    valueFormatter = formatChartCurrency,
    headerAction,
    showPercentage = false,
    total,
    className,
}: RankBarChartProps) {
    const denom = total ?? data.reduce((sum, d) => sum + d.value, 0);
    const chartData: ChartDatum[] = data.map((d) => {
        const pct = d.percentage ?? (denom > 0 ? (d.value / denom) * 100 : 0);
        return { ...d, pct, pctLabel: `${pct.toFixed(1)}%` };
    });

    return (
        <Card className={cn("flex flex-col h-full min-h-[320px] sm:min-h-[280px] bg-bg-primary border-border/40 shadow-sm overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary/60">
                                <Icon className={`h-4 w-4 ${iconClassName}`} />
                            </span>
                        )}
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                        </div>
                    </div>
                    {headerAction && <div className="shrink-0">{headerAction}</div>}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-2 sm:p-4 flex flex-col min-h-0">
                {data.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        <RobotLoader text={emptyMessage} showDots={false} size={64} />
                    </div>
                ) : (
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            {/* Bars auto-size to fill the fixed height: fewer categories → thicker,
                                more → thinner (capped by maxBarSize). Axes stay put; no scroll/growth. */}
                            <BarChart data={chartData} layout="vertical" barCategoryGap="18%" margin={{ top: 6, right: showPercentage ? 50 : 22, left: 0, bottom: 2 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={true} vertical={true} />
                                <XAxis
                                    type="number"
                                    hide={false}
                                    height={26}
                                    domain={[0, 'dataMax']}
                                    tickFormatter={valueFormatter}
                                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", dy: 6 }}
                                    axisLine={{ stroke: "var(--color-border-base)", strokeWidth: 1 }}
                                    tickLine={{ stroke: "var(--color-border-base)" }}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={106}
                                    axisLine={{ stroke: "var(--color-border-base)" }}
                                    tickLine={false}
                                    tick={<CategoryTick />}
                                />
                                <Tooltip
                                    content={<RankBarTooltip valueFormatter={valueFormatter} showPercentage={showPercentage} />}
                                    cursor={{ fill: "var(--color-muted)", opacity: 0.15 }}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={48}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                    {showPercentage && (
                                        <LabelList
                                            dataKey="pctLabel"
                                            position="right"
                                            fill="var(--color-text-tertiary)"
                                            fontSize={11}
                                        />
                                    )}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

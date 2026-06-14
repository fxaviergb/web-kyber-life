"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bucketKey, bucketLabel, formatChartCurrency, suggestViewMode, type ChartViewMode } from "@/lib/date-bucketing";

export interface SpendTrendDatum {
    date: string; // YYYY-MM-DD
    total: number;
}

interface SpendTrendChartProps {
    data: SpendTrendDatum[];
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    /** Hex color for the line/area. Defaults to the brand accent. */
    color?: string;
    seriesName?: string;
    emptyMessage?: string;
}

export function SpendTrendChart({
    data,
    title,
    description,
    icon: Icon,
    iconClassName = "text-accent-primary",
    color = "#6366f1",
    seriesName = "Gasto",
    emptyMessage = "No hay datos para el período seleccionado",
}: SpendTrendChartProps) {
    const [userMode, setUserMode] = useState<ChartViewMode | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Intelligent default granularity based on the dataset span, overridable by
    // the user. Derived (not effect-driven) to avoid cascading renders.
    const suggestedMode = useMemo<ChartViewMode>(
        () => (data.length > 0 ? suggestViewMode(data[0].date, data[data.length - 1].date) : "month"),
        [data],
    );
    const viewMode = userMode ?? suggestedMode;

    const handleViewChange = (mode: ChartViewMode) => setUserMode(mode);

    const chartData = useMemo(() => {
        if (data.length === 0) return [];
        const groups = new Map<string, number>();
        for (const d of data) {
            const key = bucketKey(d.date, viewMode);
            groups.set(key, (groups.get(key) || 0) + d.total);
        }
        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, total]) => ({ label: bucketLabel(key, viewMode), total: Math.round(total * 100) / 100 }));
    }, [data, viewMode]);

    const minChartWidth = Math.max(100, chartData.length * (viewMode === "day" ? 28 : viewMode === "week" ? 48 : 68));

    // Keep the most recent data in view.
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }, [chartData]);

    const gradientId = `spend-grad-${useId().replace(/:/g, "")}`;

    return (
        <Card className="flex flex-col h-full border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-3">
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary/60">
                            <Icon className={`h-4 w-4 ${iconClassName}`} />
                        </span>
                    )}
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                </div>
                <div className="w-full sm:w-[140px]">
                    <Select value={viewMode} onValueChange={(v) => handleViewChange(v as ChartViewMode)}>
                        <SelectTrigger className="w-full bg-muted/40 border-border/40 rounded-xl h-9 text-sm">
                            <SelectValue placeholder="Vista" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Diario</SelectItem>
                            <SelectItem value="week">Semanal</SelectItem>
                            <SelectItem value="month">Mensual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 pb-6">
                {chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto overflow-y-hidden" ref={scrollRef}>
                        <div style={{ minWidth: minChartWidth, height: 300 }} className="px-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground font-medium"
                                        dy={10}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => (value === 0 ? "0" : `$${value / 1000}k`)}
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground font-medium"
                                        width={50}
                                        dx={-5}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [formatChartCurrency(value ?? 0), seriesName]}
                                        contentStyle={{
                                            backgroundColor: "var(--color-bg-secondary)",
                                            borderColor: "var(--color-border-base)",
                                            borderRadius: "12px",
                                            color: "var(--color-text-primary)",
                                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                                            padding: "10px 14px",
                                            border: "1px solid rgba(255,255,255,0.05)",
                                        }}
                                        itemStyle={{ paddingTop: "4px", fontSize: "13px", fontWeight: 500 }}
                                        labelStyle={{ color: "var(--color-text-secondary)", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        name={seriesName}
                                        stroke={color}
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill={`url(#${gradientId})`}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

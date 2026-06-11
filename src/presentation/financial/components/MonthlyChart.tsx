"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DailyBreakdown } from "@/application/services/financial-dashboard-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthlyChartProps {
    data: DailyBreakdown[];
}

type ViewMode = "day" | "week" | "month";

const MONTH_LABELS: Record<string, string> = {
    "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

// Helper: Get the start of the week (Monday) for a given date
function getStartOfWeek(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    return start.toISOString().split("T")[0];
}

// Helper: Get month key (YYYY-MM)
function getMonthKey(dateStr: string): string {
    return dateStr.substring(0, 7);
}

// Formatting helpers
function formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split("-");
    return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`;
}

function formatDay(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function formatWeek(dateStr: string): string {
    const start = new Date(dateStr + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startStr = start.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    // If same month, don't repeat month
    if (start.getMonth() === end.getMonth()) {
        return `${startStr.split(" ")[0]} - ${end.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
    }
    return `${startStr} - ${end.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [userSelected, setUserSelected] = useState<boolean>(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Intelligent default: compute the best view based on the dataset's date range
    useEffect(() => {
        if (userSelected || data.length === 0) return;

        const start = new Date(data[0].date + "T00:00:00");
        const end = new Date(data[data.length - 1].date + "T00:00:00");
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        let suggested: ViewMode = "month";
        if (diffDays <= 31) {
            suggested = "day";
        } else if (diffDays <= 90) {
            suggested = "week";
        }

        if (viewMode !== suggested) {
            setViewMode(suggested);
        }
    }, [data, userSelected]);

    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        setUserSelected(true);
    };

    const chartData = useMemo(() => {
        if (viewMode === "day") {
            return data.map(d => ({
                ...d,
                label: formatDay(d.date),
                fullLabel: d.date,
            }));
        }

        const groups: Record<string, { income: number; expenses: number; withdrawals: number; net: number }> = {};
        
        for (const d of data) {
            let key = d.date;
            if (viewMode === "week") key = getStartOfWeek(d.date);
            if (viewMode === "month") key = getMonthKey(d.date);

            if (!groups[key]) {
                groups[key] = { income: 0, expenses: 0, withdrawals: 0, net: 0 };
            }
            groups[key].income += d.income;
            groups[key].expenses += d.expenses;
            groups[key].withdrawals += d.withdrawals || 0;
            groups[key].net += d.net;
        }

        return Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, vals]) => ({
                label: viewMode === "week" ? formatWeek(key) : formatMonth(key),
                fullLabel: key,
                income: Math.round(vals.income * 100) / 100,
                expenses: Math.round(vals.expenses * 100) / 100,
                withdrawals: Math.round(vals.withdrawals * 100) / 100,
                net: Math.round(vals.net * 100) / 100,
            }));
    }, [data, viewMode]);

    // Calculate dynamic minimum width to allow horizontal scrolling
    const minChartWidth = Math.max(100, chartData.length * (viewMode === "day" ? 40 : viewMode === "week" ? 60 : 80));

    // Scroll to end when data changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [chartData]);

    return (
        <Card className="flex flex-col h-full border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
                <div>
                    <CardTitle className="text-xl">Resumen Financiero</CardTitle>
                    <CardDescription>Evolución de ingresos y gastos</CardDescription>
                </div>
                <div className="w-full sm:w-[150px]">
                    <Select value={viewMode} onValueChange={handleViewChange}>
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
                    <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                        No hay datos para el período seleccionado
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar" ref={scrollRef}>
                        <div style={{ minWidth: minChartWidth, height: 320 }} className="px-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: 'currentColor' }}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground font-medium"
                                        dy={10}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => value === 0 ? "0" : `$${(value / 1000)}k`}
                                        tick={{ fontSize: 11, fill: 'currentColor' }}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground font-medium"
                                        width={50}
                                        dx={-5}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                                        formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                                        contentStyle={{
                                            backgroundColor: "var(--color-bg-secondary)",
                                            borderColor: "var(--color-border-base)",
                                            borderRadius: "12px",
                                            color: "var(--color-text-primary)",
                                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                                            padding: "10px 14px",
                                            border: "1px solid rgba(255,255,255,0.05)"
                                        }}
                                        itemStyle={{
                                            paddingTop: "4px",
                                            fontSize: "13px",
                                            fontWeight: 500
                                        }}
                                        labelStyle={{
                                            color: "var(--color-text-secondary)",
                                            marginBottom: "4px",
                                            fontSize: "12px",
                                            fontWeight: 500
                                        }}
                                    />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: 500 }}
                                        iconType="circle" 
                                    />
                                    <Bar
                                        dataKey="income"
                                        name="Ingresos"
                                        fill="hsl(142, 71%, 45%)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                    <Bar
                                        dataKey="expenses"
                                        name="Gastos"
                                        fill="hsl(0, 84%, 60%)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                    <Bar
                                        dataKey="withdrawals"
                                        name="Retiros"
                                        fill="#0284c7"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

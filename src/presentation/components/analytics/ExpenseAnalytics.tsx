"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpenseChart } from "./ExpenseChart";

interface ExpenseAnalyticsProps {
    data: { month: string; total: number }[];
    average: number;
}

export function ExpenseAnalytics({ data, average }: ExpenseAnalyticsProps) {
    return (
        <Card className="bg-bg-primary rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-text-primary">Tendencia de Gastos</CardTitle>
                <CardDescription className="text-sm text-text-tertiary">
                    Promedio mensual: <span className="text-accent-gold font-bold">${average.toFixed(2)}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ExpenseChart data={data} />
                </div>
            </CardContent>
        </Card>
    );
}

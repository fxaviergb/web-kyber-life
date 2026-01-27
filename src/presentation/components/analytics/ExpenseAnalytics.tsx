"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpenseChart } from "./ExpenseChart";

interface ExpenseAnalyticsProps {
    data: { month: string; total: number }[];
    average: number;
}

export function ExpenseAnalytics({ data, average }: ExpenseAnalyticsProps) {
    return (
        <Card className="bg-bg-2 border-border">
            <CardHeader>
                <CardTitle className="text-text-1">Tendencia de Gastos</CardTitle>
                <CardDescription className="text-text-3">
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

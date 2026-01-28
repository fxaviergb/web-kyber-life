"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MoreVertical, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TargetRadialChartProps {
    current: number;
    target: number;
}

export function TargetRadialChart({ current, target }: TargetRadialChartProps) {
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));

    // Data for the semi-circle
    const data = [
        { name: 'Progress', value: percentage },
        { name: 'Remaining', value: 100 - percentage }
    ];

    return (
        <div className="bg-bg-primary rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border-base h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Presupuesto Mensual</h3>
                    <p className="text-xs text-text-tertiary">Objetivo mensual definido</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary">
                    <MoreVertical size={16} />
                </Button>
            </div>

            <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="70%" // Push chart down to create semi-circle effect better
                            startAngle={180}
                            endAngle={0}
                            innerRadius="70%"
                            outerRadius="90%"
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="progress" fill="#5b4dff" cornerRadius={10} />
                            <Cell key="remaining" fill="#F3F4F6" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <h2 className="text-3xl font-bold text-text-primary">{percentage.toFixed(0)}%</h2>
                    <div className="inline-flex items-center gap-1 bg-accent-success/10 text-accent-success text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                        <ArrowUp size={10} />
                        <span>+10%</span>
                    </div>
                </div>

                <p className="absolute bottom-8 w-full text-center text-xs text-text-secondary px-8">
                    Has gastado <strong>${current.toFixed(0)}</strong> este mes. ¡Mantén el control!
                </p>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-border-base/50">
                <div className="text-center">
                    <p className="text-xs text-text-tertiary mb-1">Objetivo</p>
                    <div className="font-bold text-text-primary flex items-center gap-1">
                        ${target / 1000}k <ArrowDown size={12} className="text-accent-danger" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-xs text-text-tertiary mb-1">Actual</p>
                    <div className="font-bold text-text-primary flex items-center gap-1">
                        ${(current / 1000).toFixed(2)}k <ArrowUp size={12} className="text-accent-success" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-xs text-text-tertiary mb-1">Hoy</p>
                    <div className="font-bold text-text-primary flex items-center gap-1">
                        $0 <ArrowUp size={12} className="text-accent-success" />
                    </div>
                </div>
            </div>
        </div>
    );
}

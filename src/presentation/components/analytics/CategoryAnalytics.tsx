"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CategoryAnalyticsProps {
    data: { id: string; name: string; value: number; percentage: number }[];
}

const COLORS = ['#D4AF37', '#98FF98', '#E6E6FA', '#F08080', '#87CEEB', '#FFB6C1'];

export function CategoryAnalytics({ data }: CategoryAnalyticsProps) {
    return (
        <Card className="bg-bg-2 border-border">
            <CardHeader>
                <CardTitle className="text-text-1">Gasto por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fill: '#aaa', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E1E2E', borderColor: '#333', color: '#FFF' }}
                                cursor={{ fill: 'transparent' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, "Gasto"]}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* List View */}
                <div className="mt-6 space-y-3">
                    {data.map((cat, i) => (
                        <div key={cat.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-text-2">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-text-1 font-bold">${cat.value.toFixed(2)}</span>
                                <span className="text-text-3 w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

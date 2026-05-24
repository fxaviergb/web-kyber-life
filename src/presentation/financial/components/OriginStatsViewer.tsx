"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OriginStatsViewerProps {
    originStats: Record<string, any> | null | undefined;
}

export function OriginStatsViewer({ originStats }: OriginStatsViewerProps) {
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

    const toggleExpand = (key: string) => {
        setExpandedKeys((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    if (!originStats || Object.keys(originStats).length === 0) {
        return (
            <Card className="shadow-sm border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary/70" />
                        Datos de origen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No hay datos brutos del escaneo disponibles.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-border/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary/70" />
                    Datos de origen
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.entries(originStats).map(([key, value]) => {
                        const isExpanded = expandedKeys[key];
                        const contentString = typeof value === 'object' && value !== null
                            ? JSON.stringify(value, null, 2)
                            : String(value);
                        
                        const isLongContent = contentString.length > 200 || contentString.split('\n').length > 5;

                        return (
                            <div key={key} className="space-y-1 border rounded-md p-3 bg-card/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    {isLongContent && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => toggleExpand(key)}
                                        >
                                            {isExpanded ? (
                                                <><ChevronUp className="h-3 w-3 mr-1" /> Menos</>
                                            ) : (
                                                <><ChevronDown className="h-3 w-3 mr-1" /> Más</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className={`mt-2 ${!isExpanded && isLongContent ? 'max-h-24 overflow-hidden relative' : ''}`}>
                                    {typeof value === 'object' && value !== null ? (
                                        <div className="bg-muted/50 rounded-md p-2 text-xs font-mono overflow-x-auto">
                                            <pre>{contentString}</pre>
                                        </div>
                                    ) : (
                                        <div className="text-sm break-words whitespace-pre-wrap font-mono bg-muted/20 p-2 rounded-md border border-border/30">
                                            {contentString}
                                        </div>
                                    )}
                                    {!isExpanded && isLongContent && (
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

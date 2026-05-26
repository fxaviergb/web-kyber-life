"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ChevronDown, ChevronUp, Mail, Globe, Hash, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OriginStatsViewerProps {
    originStats: Record<string, unknown> | null | undefined;
}

/** Priority keys to display as structured metadata (top section). */
const STRUCTURED_KEYS: Record<string, { label: string; icon: React.ReactNode }> = {
    origin: { label: "Origen", icon: <Globe className="h-3.5 w-3.5" /> },
    from: { label: "De", icon: <Mail className="h-3.5 w-3.5" /> },
    to: { label: "Para", icon: <User className="h-3.5 w-3.5" /> },
    subject: { label: "Asunto", icon: <Mail className="h-3.5 w-3.5" /> },
    date: { label: "Fecha del email", icon: <Clock className="h-3.5 w-3.5" /> },
    originalExecutionId: { label: "ID Ejecución", icon: <Hash className="h-3.5 w-3.5" /> },
};

/** Keys that contain long content and should be hidden behind a collapsible. */
const HIDDEN_KEYS = new Set(["emailBody", "snippet", "htmlBody", "body"]);

export function OriginStatsViewer({ originStats }: OriginStatsViewerProps) {
    const [showRaw, setShowRaw] = useState(false);

    if (!originStats || Object.keys(originStats).length === 0) {
        return (
            <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                        <Activity className="h-4 w-4 text-accent-primary/70" />
                        Datos de origen
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">No hay datos brutos del escaneo disponibles.</p>
                </CardContent>
            </Card>
        );
    }

    const structuredEntries = Object.entries(originStats).filter(
        ([key]) => key in STRUCTURED_KEYS && !HIDDEN_KEYS.has(key),
    );
    const extraEntries = Object.entries(originStats).filter(
        ([key]) => !(key in STRUCTURED_KEYS) && !HIDDEN_KEYS.has(key),
    );

    return (
        <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4 text-accent-primary/70" />
                    Datos de origen
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
                {/* ── Structured metadata rows ─────────────────── */}
                {structuredEntries.length > 0 && (
                    <div className="space-y-2">
                        {structuredEntries.map(([key, value]) => {
                            const cfg = STRUCTURED_KEYS[key];
                            if (!cfg || value === null || value === undefined) return null;
                            const display = typeof value === "object" ? JSON.stringify(value) : String(value);
                            return (
                                <div key={key} className="flex items-start gap-2 text-sm">
                                    <span className="flex items-center gap-1.5 shrink-0 text-muted-foreground min-w-[90px]">
                                        {cfg.icon}
                                        <span className="text-xs font-medium">{cfg.label}</span>
                                    </span>
                                    <span className="font-mono text-xs break-all text-foreground/80">{display}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Extra unknown keys (collapsed by default) ─ */}
                {extraEntries.length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground w-full justify-start"
                            onClick={() => setShowRaw(!showRaw)}
                        >
                            {showRaw ? (
                                <><ChevronUp className="h-3 w-3 mr-1.5" /> Ocultar datos adicionales ({extraEntries.length})</>
                            ) : (
                                <><ChevronDown className="h-3 w-3 mr-1.5" /> Ver datos adicionales ({extraEntries.length})</>
                            )}
                        </Button>
                        {showRaw && (
                            <div className="mt-2 space-y-2">
                                {extraEntries.map(([key, value]) => {
                                    const display = typeof value === "object" && value !== null
                                        ? JSON.stringify(value, null, 2)
                                        : String(value ?? "");
                                    return (
                                        <div key={key} className="space-y-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {key.replace(/_/g, " ")}
                                            </span>
                                            <div className="text-xs font-mono break-words whitespace-pre-wrap bg-muted/20 p-2 rounded-lg border border-border/30 max-h-32 overflow-y-auto">
                                                {display}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

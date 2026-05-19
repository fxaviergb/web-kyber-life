"use client";

import { useEffect, useState } from "react";
import { getAuditTrailAction } from "@/app/actions/financial-transactions";
import { FinancialTransactionAuditLog } from "@/domain/entities/financial";
import { Clock, GitCommit } from "lucide-react";

interface AuditTrailProps {
    transactionId: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    CREATED: { label: "Created", color: "text-blue-500" },
    CREATED_WITH_DUPLICATE_FLAG: { label: "Created (Duplicate Detected)", color: "text-amber-500" },
    MAPPED_FROM_INBOX: { label: "Mapped from Inbox", color: "text-emerald-500" },
    MARKED_DUPLICATE: { label: "Marked as Duplicate", color: "text-red-500" },
    DUPLICATE_RESOLVED: { label: "Duplicate Resolved", color: "text-emerald-500" },
    UPDATED: { label: "Updated", color: "text-blue-500" },
    DELETED: { label: "Deleted", color: "text-red-500" },
};

function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function AuditTrail({ transactionId }: AuditTrailProps) {
    const [logs, setLogs] = useState<FinancialTransactionAuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const result = await getAuditTrailAction(transactionId);
            if (result.success && result.data) {
                setLogs(result.data as FinancialTransactionAuditLog[]);
            }
            setLoading(false);
        }
        load();
    }, [transactionId]);

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-4 text-center">
                No audit history available.
            </p>
        );
    }

    return (
        <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />

            <div className="space-y-4">
                {logs.map((log) => {
                    const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "text-muted-foreground" };

                    return (
                        <div key={log.id} className="flex items-start gap-3 relative">
                            <div className="relative z-10 flex-shrink-0 w-[30px] h-[30px] rounded-full bg-muted border border-border flex items-center justify-center">
                                <GitCommit className={`h-3.5 w-3.5 ${meta.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-medium ${meta.color}`}>
                                        {meta.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {formatTimestamp(log.createdAt)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

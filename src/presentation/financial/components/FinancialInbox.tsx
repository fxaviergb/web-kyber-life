"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getUnprocessedInboxTransactionsAction, mapInboxTransactionAction, dismissInboxTransactionAction } from "@/app/actions/financial-inbox";
import { FinancialScannerTransaction } from "@/domain/entities/financial";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarDays, Check, CircleAlert, Inbox as InboxIcon, RefreshCw, Sparkles, Store, Wallet, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFinancialRealtime } from "../hooks/useFinancialRealtime";

interface EditState {
    type: string;
    merchant: string;
}

const TYPE_OPTIONS = [
    { value: "EXPENSE", label: "Gasto" },
    { value: "INCOME", label: "Ingreso" },
    { value: "TRANSFER", label: "Transferencia" },
] as const;

const DEFAULT_TRANSACTION_TYPE = "EXPENSE";

function normalizeTransactionType(type?: string | null) {
    if (!type) {
        return DEFAULT_TRANSACTION_TYPE;
    }

    const normalizedType = type.toUpperCase();
    const supportedType = TYPE_OPTIONS.find((option) => option.value === normalizedType);

    return supportedType?.value ?? DEFAULT_TRANSACTION_TYPE;
}

function formatAmount(amount?: number | null, currency = "USD") {
    if (amount == null) {
        return "Monto pendiente";
    }

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(value?: string | null) {
    if (!value) {
        return "Fecha no detectada";
    }

    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function InboxSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-20 rounded-3xl border border-border/50 bg-gradient-to-r from-bg-secondary to-bg-tertiary animate-pulse" />
            <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[340px] rounded-3xl border border-border/50 bg-bg-secondary/80 animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}

export function FinancialInbox() {
    const [transactions, setTransactions] = useState<FinancialScannerTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showPollingNotice, setShowPollingNotice] = useState(false);
    const hasLoadedOnceRef = useRef(false);
    const transactionsRef = useRef<FinancialScannerTransaction[]>([]);
    const pollingNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Editing State per transaction
    const [editStates, setEditStates] = useState<Record<string, EditState>>({});

    const syncEditStates = useCallback((nextTransactions: FinancialScannerTransaction[]) => {
        setEditStates((prev) => {
            const nextState: Record<string, EditState> = {};

            nextTransactions.forEach((tx) => {
                const transactionId = tx.id;
                if (!transactionId) {
                    return;
                }

                nextState[transactionId] = prev[transactionId] ?? {
                    type: normalizeTransactionType(tx.type),
                    merchant: tx.merchant || "",
                };
            });

            return nextState;
        });
    }, []);

    useEffect(() => {
        transactionsRef.current = transactions;
    }, [transactions]);

    useEffect(() => {
        return () => {
            if (pollingNoticeTimerRef.current) {
                clearTimeout(pollingNoticeTimerRef.current);
            }
        };
    }, []);

    const loadInbox = useCallback(async (options?: { silent?: boolean; mergeNewOnly?: boolean }) => {
        const { silent = false, mergeNewOnly = false } = options ?? {};

        if (!silent) {
            setLoading(true);
        }

        const result = await getUnprocessedInboxTransactionsAction();

        if (result.success && result.data) {
            const nextTransactions = result.data;
            const resolvedTransactions = (() => {
                if (!mergeNewOnly) {
                    return nextTransactions;
                }

                const existingTransactions = transactionsRef.current;
                const existingIds = new Set(existingTransactions.map((tx) => tx.id));
                const newTransactions = nextTransactions.filter((tx) => tx.id && !existingIds.has(tx.id));

                if (newTransactions.length === 0) {
                    return existingTransactions;
                }

                return [...newTransactions, ...existingTransactions];
            })();

            transactionsRef.current = resolvedTransactions;
            setTransactions(resolvedTransactions);
            syncEditStates(resolvedTransactions);
        } else {
            toast.error("No se pudo cargar la bandeja");
        }

        hasLoadedOnceRef.current = true;

        if (!silent) {
            setLoading(false);
        }
    }, [syncEditStates]);

    const pollInboxInBackground = useCallback(async () => {
        if (!hasLoadedOnceRef.current) {
            return;
        }

        setShowPollingNotice(true);
        if (pollingNoticeTimerRef.current) {
            clearTimeout(pollingNoticeTimerRef.current);
        }
        pollingNoticeTimerRef.current = setTimeout(() => {
            setShowPollingNotice(false);
        }, 2500);

        await loadInbox({ silent: true, mergeNewOnly: true });
    }, [loadInbox]);

    useEffect(() => {
        queueMicrotask(() => {
            void loadInbox();
        });
    }, [loadInbox]);

    // ── Realtime: auto-reload inbox on new scanner transactions ──
    const subscriptions = useMemo(
        () => [
            { table: "financial_scanner_transactions", event: "INSERT" as const },
        ],
        [],
    );

    const callbacks = useMemo(
        () => ({
            onInsert: () => {
                toast("Nueva transaccion escaneada por N8N", {
                    description: "Actualizando bandeja...",
                });
                void loadInbox({ silent: true, mergeNewOnly: true });
            },
        }),
        [loadInbox],
    );

    const { isPollingFallback } = useFinancialRealtime({
        channelName: "inbox-realtime",
        subscriptions,
        callbacks,
        onPollFallback: pollInboxInBackground,
    });




    const handleConfirm = async (tx: FinancialScannerTransaction) => {
        setProcessingId(tx.id!);
        try {
            const editState = editStates[tx.id!];

            const result = await mapInboxTransactionAction({
                scannerTransactionId: tx.id!,
                type: (editState?.type as FinancialScannerTransaction["type"]) || DEFAULT_TRANSACTION_TYPE,
                merchant: editState?.merchant || undefined
            });

            if (result.success) {
                toast.success("Transacción confirmada y asignada");
                setTransactions((prev) => {
                    const nextTransactions = prev.filter((item) => item.id !== tx.id);
                    transactionsRef.current = nextTransactions;
                    return nextTransactions;
                });
            } else {
                toast.error(result.error || "No se pudo confirmar la transacción");
            }
        } catch {
            toast.error("Error al procesar la transacción");
        }
        setProcessingId(null);
    };

    const handleDismiss = async (txId: string) => {
        setProcessingId(txId);
        try {
            const result = await dismissInboxTransactionAction(txId);
            if (result.success) {
                toast.success("Transacción descartada");
                setTransactions((prev) => {
                    const nextTransactions = prev.filter((tx) => tx.id !== txId);
                    transactionsRef.current = nextTransactions;
                    return nextTransactions;
                });
            } else {
                toast.error(result.error || "No se pudo descartar la transacción");
            }
        } catch {
            toast.error("Error al descartar la transacción");
        }
        setProcessingId(null);
    };

    const updateEditState = (txId: string, field: 'type' | 'merchant', value: string) => {
        setEditStates(prev => ({
            ...prev,
            [txId]: {
                ...prev[txId],
                [field]: value
            }
        }));
    };

    if (loading) {
        return <InboxSkeleton />;
    }

    if (transactions.length === 0) {
        return (
            <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-bg-secondary py-0 shadow-lg shadow-black/5">
                <CardContent className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                    <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-accent-primary/10 text-accent-primary">
                        <InboxIcon className="h-9 w-9" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-semibold tracking-tight">Bandeja al día</h3>
                        <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                            No hay escaneos pendientes por revisar. Cuando entren nuevos movimientos,
                            aparecerán aquí listos para confirmar y clasificar.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-5">
            <Card className="rounded-[1.75rem] border-border/60 bg-bg-secondary py-0 shadow-sm shadow-black/5">
                <CardContent className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(110px,1fr))] sm:items-center sm:px-5">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="success" className="gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                                <Sparkles className="h-3 w-3" />
                                Revisión
                            </Badge>
                            {isPollingFallback && showPollingNotice && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    ACTUALIZANDO
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-semibold tracking-tight sm:text-lg">Escaneos por confirmar</h3>
                        <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
                            Prioriza monto, comercio y fecha para revisar más rápido.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-bg-primary px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Pendientes</div>
                        <div className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{transactions.length}</div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-bg-primary px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Con comercio</div>
                        <div className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{transactions.filter((tx) => tx.merchant).length}</div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-bg-primary px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Con monto</div>
                        <div className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{transactions.filter((tx) => tx.amount != null).length}</div>
                    </div>
                </CardContent>
            </Card>

            <section className="grid gap-4 xl:grid-cols-2">
                {transactions.map((tx, index) => {
                    const isProcessing = processingId === tx.id;

                    return (
                        <Card
                            key={tx.id}
                            className="group relative overflow-hidden rounded-[1.75rem] border-border/60 bg-bg-secondary py-0 shadow-sm shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent" aria-hidden="true" />
                            <CardHeader className="gap-4 border-b border-border/50 px-5 py-4 sm:px-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="warning" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]">
                                                Pendiente
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">Escaneo #{String(index + 1).padStart(2, "0")}</span>
                                            {tx.relatedTransactionHint && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-warning-text/25 bg-warning-bg text-warning-text transition-colors hover:bg-warning-bg/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-text/40"
                                                            aria-label="Ver posible relación detectada"
                                                        >
                                                            <CircleAlert className="h-3.5 w-3.5" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        align="start"
                                                        className="w-72 rounded-2xl border-warning-text/20 bg-bg-secondary p-3 text-sm leading-6 text-foreground"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-text" />
                                                            <p>Posible relación detectada: {tx.relatedTransactionHint}</p>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <CardTitle className="text-lg tracking-tight sm:text-xl">
                                                {editStates[tx.id!]?.merchant || tx.merchant || "Comercio por confirmar"}
                                            </CardTitle>
                                            <CardDescription className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {formatDate(tx.date)}
                                                </span>
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex min-w-[152px] flex-col rounded-2xl border border-border/50 bg-bg-primary px-4 py-3 text-left sm:text-right">
                                        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Monto</span>
                                        <span className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
                                            {formatAmount(tx.amount, tx.currency || "USD")}
                                        </span>
                                        <span className="mt-1 text-xs text-muted-foreground">{tx.currency || "USD"}</span>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 px-5 py-4 sm:px-6">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-border/50 bg-bg-primary p-3.5">
                                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                            <Wallet className="h-3.5 w-3.5" />
                                            Tipo
                                        </div>
                                        <div className="mt-2">
                                            <Select
                                                value={editStates[tx.id!]?.type || DEFAULT_TRANSACTION_TYPE}
                                                onValueChange={(value) => updateEditState(tx.id!, "type", value)}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-bg-secondary shadow-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TYPE_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-border/50 bg-bg-primary p-3.5">
                                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                            <Store className="h-3.5 w-3.5" />
                                            Comercio
                                        </div>
                                        <Input
                                            value={editStates[tx.id!]?.merchant || ""}
                                            onChange={(event) => updateEditState(tx.id!, "merchant", event.target.value)}
                                            placeholder="Ingresa el nombre del comercio"
                                            className="mt-2 h-10 rounded-xl border-border/60 bg-bg-secondary shadow-none"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-[1.35rem] border border-border/50 bg-bg-primary p-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                                        Contexto extraído
                                    </div>
                                    <p className="line-clamp-4 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
                                        {tx.description || "No hay descripción disponible para este escaneo."}
                                    </p>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3 border-t border-border/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl sm:w-auto"
                                    onClick={() => handleDismiss(tx.id!)}
                                    disabled={isProcessing}
                                >
                                    <X className="h-4 w-4" />
                                    Descartar
                                </Button>
                                <Button
                                    className="w-full rounded-xl sm:w-auto"
                                    onClick={() => handleConfirm(tx)}
                                    disabled={isProcessing}
                                >
                                    <Check className="h-4 w-4" />
                                    {isProcessing ? "Guardando..." : "Confirmar"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </section>
        </div>
    );
}

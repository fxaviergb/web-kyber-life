"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getUnprocessedInboxTransactionsAction, mapInboxTransactionAction, dismissInboxTransactionAction } from "@/app/actions/financial-inbox";
import { FinancialScannerTransaction } from "@/domain/entities/financial";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarDays, Check, CircleAlert, Inbox as InboxIcon, RefreshCw, Sparkles, Store, Wallet, X, Edit2, Undo2, Search, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useFinancialRealtime } from "../hooks/useFinancialRealtime";
import { useSearchParams } from "next/navigation";

interface EditState {
    type: string;
    merchant: string;
    amount?: number | null;
    date?: string | null;
    description?: string;
}

const TYPE_OPTIONS = [
    { value: "EXPENSE", label: "Gasto" },
    { value: "INCOME", label: "Ingreso" },
    { value: "TRANSFER", label: "Transferencias propias" },
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

function formatLocalDatetime(dateStr?: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatAmount(amount?: number | null, currency = "USD") {
    if (amount == null) {
        return "--";
    }

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Extract the best available context from a scanner transaction.
 * Priority: originStats.emailBody → originStats.snippet → description
 */
function extractContext(tx: FinancialScannerTransaction): string {
    const stats = tx.originStats as Record<string, unknown> | null | undefined;
    const emailBody = stats?.emailBody as string | undefined;
    const snippet = stats?.snippet as string | undefined;
    return emailBody || snippet || tx.description || "";
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
    const searchParams = useSearchParams();
    const typeFilter = searchParams.get("type");

    const [transactions, setTransactions] = useState<FinancialScannerTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showPollingNotice, setShowPollingNotice] = useState(false);
    const hasLoadedOnceRef = useRef(false);
    const transactionsRef = useRef<FinancialScannerTransaction[]>([]);
    const pollingNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Editing State per transaction
    const [editStates, setEditStates] = useState<Record<string, EditState>>({});
    const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});

    const toggleEdit = (txId: string) => {
        setIsEditing((prev) => ({ ...prev, [txId]: !prev[txId] }));
    };

    const cancelEdit = (txId: string, tx: FinancialScannerTransaction) => {
        setEditStates((prev) => ({
            ...prev,
            [txId]: {
                type: normalizeTransactionType(tx.type),
                merchant: tx.merchant || "",
                amount: tx.amount ?? null,
                date: formatLocalDatetime(tx.date || tx.createdAt),
                description: extractContext(tx),
            },
        }));
        setIsEditing((prev) => ({ ...prev, [txId]: false }));
    };

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
                    amount: tx.amount ?? null,
                    date: formatLocalDatetime(tx.date || tx.createdAt),
                    description: extractContext(tx),
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
        const editState = editStates[tx.id!];
        const type = (editState?.type as FinancialScannerTransaction["type"]) || DEFAULT_TRANSACTION_TYPE;
        const merchant = editState?.merchant || tx.merchant;
        const amount = editState?.amount !== undefined ? editState.amount : tx.amount;

        if (!merchant || merchant.trim() === "") {
            toast.error("La institución es requerida para confirmar");
            return;
        }

        if (amount === null || amount === undefined || isNaN(amount)) {
            toast.error("El monto es requerido para confirmar");
            return;
        }

        if (!type) {
            toast.error("El tipo de transacción es requerido");
            return;
        }

        setProcessingId(tx.id!);
        try {
            const result = await mapInboxTransactionAction({
                scannerTransactionId: tx.id!,
                type: type,
                merchant: merchant,
                amount: amount,
                date: editState?.date ? new Date(editState.date).toISOString() : undefined,
                notes: editState?.description || undefined,
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

    const updateEditState = (txId: string, field: keyof EditState, value: any) => {
        setEditStates(prev => ({
            ...prev,
            [txId]: {
                ...prev[txId],
                [field]: value
            }
        }));
    };

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        if (typeFilter && typeFilter !== "ALL") {
            filtered = transactions.filter(tx => {
                const currentType = editStates[tx.id!]?.type || normalizeTransactionType(tx.type);
                return currentType === typeFilter;
            });
        }

        return [...filtered].sort((a, b) => {
            const dateA = editStates[a.id!]?.date || a.date || a.createdAt;
            const dateB = editStates[b.id!]?.date || b.date || b.createdAt;

            const timeA = dateA ? new Date(dateA).getTime() : 0;
            const timeB = dateB ? new Date(dateB).getTime() : 0;

            if (timeA !== timeB) {
                return timeB - timeA;
            }

            const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

            return createdB - createdA;
        });
    }, [transactions, typeFilter, editStates]);

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

                    <Button className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium" asChild>
                        <Link href="/financial/scanner" className="gap-2">
                            <Search className="w-4 h-4" />
                            Iniciar Nuevo Escaneo
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (filteredTransactions.length === 0) {
        return (
            <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-bg-secondary py-0 shadow-lg shadow-black/5">
                <CardContent className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                    <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-accent-primary/10 text-accent-primary">
                        <InboxIcon className="h-9 w-9" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-semibold tracking-tight">Sin resultados</h3>
                        <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                            No hay transacciones pendientes para la categoría seleccionada.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-5">
            <Card className="rounded-[1.75rem] border-border/60 bg-bg-secondary py-0 shadow-sm shadow-black/5">
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4 sm:px-5">
                    <div className="space-y-1 flex-1">
                        {isPollingFallback && showPollingNotice && (
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    ACTUALIZANDO
                                </span>
                            </div>
                        )}
                        <h3 className="text-base font-semibold tracking-tight sm:text-lg">Escaneos por confirmar</h3>
                        <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
                            Prioriza monto, institución y fecha para revisar más rápido.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                            <div className="flex flex-col justify-between rounded-2xl border border-border/50 bg-bg-primary px-3 py-3 text-center sm:text-left">
                                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground break-words leading-tight">Pendientes</div>
                                <div className="mt-1 text-lg sm:text-xl font-semibold tracking-tight">{filteredTransactions.length}</div>
                            </div>
                            <div className="flex flex-col justify-between rounded-2xl border border-border/50 bg-bg-primary px-3 py-3 text-center sm:text-left">
                                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground break-words leading-tight">Con comercio</div>
                                <div className="mt-1 text-lg sm:text-xl font-semibold tracking-tight">{filteredTransactions.filter((tx) => tx.merchant).length}</div>
                            </div>
                            <div className="flex flex-col justify-between rounded-2xl border border-border/50 bg-bg-primary px-3 py-3 text-center sm:text-left">
                                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground break-words leading-tight">Con monto</div>
                                <div className="mt-1 text-lg sm:text-xl font-semibold tracking-tight">{filteredTransactions.filter((tx) => tx.amount != null).length}</div>
                            </div>
                        </div>

                        <Link href="/financial/scanner" className="sm:hidden w-full">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-medium shadow-sm transition-all h-10">
                                <Search className="w-4 h-4" />
                                Iniciar Escaneo
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <section className="grid gap-4 xl:grid-cols-2">
                {filteredTransactions.map((tx, index) => {
                    const isProcessing = processingId === tx.id;
                    const editing = isEditing[tx.id!] || false;

                    return (
                        <Card
                            key={tx.id}
                            className="group relative overflow-hidden rounded-[1.75rem] border-border/60 bg-bg-secondary py-0 shadow-sm shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent" aria-hidden="true" />
                            <CardHeader className="gap-3 border-b border-border/50 px-5 py-3 sm:px-6">
                                <div className="flex flex-col gap-3">
                                    {/* Top row: Badges */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-medium text-foreground whitespace-nowrap"># {String(index + 1).padStart(2, "0")}</span>

                                        <Badge variant="warning" className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] shrink-0">
                                            Pendiente
                                        </Badge>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2.5 text-[11px] rounded-full hover:bg-bg-primary text-muted-foreground border border-border/50 bg-bg-primary/50 shadow-sm shrink-0 whitespace-nowrap inline-flex items-center"
                                            onClick={() => editing ? cancelEdit(tx.id!, tx) : toggleEdit(tx.id!)}
                                            disabled={isProcessing}
                                        >
                                            {editing ? (
                                                <>
                                                    <Undo2 className="h-3 w-3 mr-1 shrink-0" />
                                                    Cancelar
                                                </>
                                            ) : (
                                                <>
                                                    <Edit2 className="h-3 w-3 mr-1 shrink-0" />
                                                    Editar
                                                </>
                                            )}
                                        </Button>

                                        {tx.relatedTransactionHint && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-warning-text/25 bg-warning-bg text-warning-text transition-colors hover:bg-warning-bg/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-text/40"
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

                                    {/* Bottom row: Info and Amount */}
                                    <div className="flex flex-row items-start justify-between gap-3">
                                        <div className="space-y-2 min-w-0 flex-1">
                                            {editing ? (
                                                <Input
                                                    value={editStates[tx.id!]?.merchant || ""}
                                                    onChange={(event) => updateEditState(tx.id!, "merchant", event.target.value)}
                                                    placeholder="Ingresa el nombre de la institución"
                                                    className="h-9 font-semibold text-base sm:text-lg border-border/50 bg-bg-primary w-full"
                                                />
                                            ) : (
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg tracking-tight sm:text-xl truncate">
                                                        {editStates[tx.id!]?.merchant || tx.merchant || "Institución por confirmar"}
                                                    </CardTitle>
                                                </div>
                                            )}

                                            <CardDescription className="flex flex-col gap-1.5 text-xs sm:text-sm pt-1">
                                                <div className="flex items-center gap-1.5 w-full">
                                                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    {editing ? (
                                                        <Input
                                                            type="datetime-local"
                                                            value={editStates[tx.id!]?.date || ""}
                                                            onChange={(e) => updateEditState(tx.id!, "date", e.target.value)}
                                                            className="h-8 text-[10px] sm:text-xs py-1 px-2 border-border/50 bg-bg-primary w-full"
                                                        />
                                                    ) : (
                                                        <span className="truncate">{editStates[tx.id!]?.date ? formatDate(editStates[tx.id!]!.date) : "Fecha no detectada"}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 w-full">
                                                    <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    <span className="text-muted-foreground shrink-0">Tipo:</span>
                                                    {editing ? (
                                                        <Select
                                                            value={editStates[tx.id!]?.type || DEFAULT_TRANSACTION_TYPE}
                                                            onValueChange={(value) => updateEditState(tx.id!, "type", value)}
                                                        >
                                                            <SelectTrigger className="h-8 text-[10px] sm:text-xs py-1 px-2 border-border/50 bg-bg-primary shadow-none flex-1 truncate">
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
                                                    ) : (
                                                        <Badge
                                                            variant={
                                                                editStates[tx.id!]?.type === "EXPENSE" ? "danger" :
                                                                    editStates[tx.id!]?.type === "INCOME" ? "success" :
                                                                        editStates[tx.id!]?.type === "TRANSFER" ? "warning" :
                                                                            "outline"
                                                            }
                                                            className="text-[10px] sm:text-xs px-2 py-0.5 shrink-0 truncate max-w-[120px]"
                                                        >
                                                            {TYPE_OPTIONS.find(o => o.value === editStates[tx.id!]?.type)?.label || "Gasto"}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardDescription>
                                        </div>

                                        <div className="flex min-w-[90px] max-w-[45%] shrink-0 flex-col rounded-2xl bg-bg-primary/50 px-3 py-2.5 text-right border-none justify-center overflow-hidden">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Monto</span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-end gap-1 overflow-hidden">
                                                {editing ? (
                                                    <div className="flex items-center justify-end gap-1 w-full overflow-hidden">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={editStates[tx.id!]?.amount ?? ""}
                                                            onChange={(e) => updateEditState(tx.id!, "amount", e.target.value ? parseFloat(e.target.value) : null)}
                                                            className="h-7 w-full min-w-[50px] text-right font-semibold text-xs sm:text-sm border-border/50 bg-bg-secondary px-2"
                                                        />
                                                        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium shrink-0">{tx.currency || "USD"}</span>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-sm sm:text-lg font-semibold tracking-tight truncate"
                                                        title={formatAmount(editStates[tx.id!]?.amount, tx.currency || "USD")}
                                                    >
                                                        {formatAmount(editStates[tx.id!]?.amount, tx.currency || "USD")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 px-5 py-3 sm:px-6">
                                <div className="rounded-[1.35rem] bg-bg-primary/50 p-4 border-none">
                                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                                        Contexto extraído
                                    </div>
                                    {editing ? (
                                        <textarea
                                            value={editStates[tx.id!]?.description || ""}
                                            onChange={(e) => updateEditState(tx.id!, "description", e.target.value)}
                                            className="w-full min-h-[60px] rounded-xl border border-border/50 bg-bg-secondary p-3 text-sm leading-6 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary/50 resize-y"
                                            placeholder="No hay descripción disponible para este escaneo."
                                        />
                                    ) : (
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            {editStates[tx.id!]?.description || "No hay descripción disponible para este escaneo."}
                                        </p>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-row items-center w-full gap-1.5 sm:gap-2 border-t border-border/50 px-3 py-3 sm:px-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 shrink text-muted-foreground hover:text-foreground px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                                    disabled={isProcessing}
                                    asChild
                                >
                                    <Link href={`/financial/scans/${tx.id}`}>
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        <span className="truncate">Detalles</span>
                                    </Link>
                                </Button>

                                {editing ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 shrink rounded-xl text-muted-foreground px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                                            onClick={() => cancelEdit(tx.id!, tx)}
                                            disabled={isProcessing}
                                        >
                                            <Undo2 className="h-3.5 w-3.5 mr-1" />
                                            <span className="truncate">Cancelar</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 shrink rounded-xl bg-accent-primary text-accent-primary-foreground hover:bg-accent-primary/90 px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                                            onClick={() => toggleEdit(tx.id!)}
                                            disabled={isProcessing}
                                        >
                                            <Check className="h-3.5 w-3.5 mr-1" />
                                            <span className="truncate">Listo</span>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 shrink rounded-xl border-border/50 hover:bg-bg-primary px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                                            onClick={() => handleDismiss(tx.id!)}
                                            disabled={isProcessing}
                                        >
                                            <X className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                            <span className="truncate">Descartar</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 shrink rounded-xl px-1 h-8 sm:h-9 text-[10px] sm:text-sm"
                                            onClick={() => handleConfirm(tx)}
                                            disabled={isProcessing}
                                        >
                                            <Check className="h-3.5 w-3.5 mr-1" />
                                            <span className="truncate">{isProcessing ? "..." : "Confirmar"}</span>
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </section>
        </div>
    );
}

'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { triggerFinancialScanAction, getScanExecutionsAction, getScannerDayCountsAction } from '@/app/actions/financial-scanner';
import { Calendar, Search, RefreshCw, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Mail, AlertCircle, Timer, ChevronDown, ChevronUp, Plus, Filter } from 'lucide-react';
import { FinancialScanExecution } from '@/domain/entities/financial';
import { format, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useFinancialRealtime } from '../hooks/useFinancialRealtime';

type ScanRange = 'today' | 'week' | 'custom' | 'recommended';

function getWeekRange(): { start: string; end: string } {
    const today = new Date();
    return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
}

function getFormattedDuration(start: string | Date, end: string | Date): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs} seg`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

function parsePayload(payload: any) {
    if (!payload) return null;

    let parsed = payload;
    let iter = 0;
    while (typeof parsed === 'string' && iter < 5) {
        try {
            parsed = JSON.parse(parsed);
        } catch (e) {
            break;
        }
        iter++;
    }

    if (parsed && typeof parsed === 'object' && parsed.startDate) {
        return parsed;
    }

    if (parsed && typeof parsed === 'object' && parsed.body) {
        let body = parsed.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { }
        }
        if (body && typeof body === 'object' && body.startDate) {
            return body;
        }
    }

    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const startMatch = payloadStr.match(/startDate.*?(\d{4}-\d{2}-\d{2})/);
    const endMatch = payloadStr.match(/endDate.*?(\d{4}-\d{2}-\d{2})/);

    if (startMatch || endMatch) {
        return {
            startDate: startMatch ? startMatch[1] : undefined,
            endDate: endMatch ? endMatch[1] : undefined
        };
    }

    return typeof parsed === 'object' ? parsed : null;
}

function ExecutionHistoryCard({ exec, dayCount }: { exec: FinancialScanExecution, dayCount?: number }) {
    const [isExpanded, setIsExpanded] = useState(true);

    let statusStyles = '';
    switch (exec.status) {
        case 'COMPLETED':
            statusStyles = 'bg-success-bg/30 border-accent-success/30 text-success-text';
            break;
        case 'FAILED':
            statusStyles = 'bg-danger-bg/30 border-accent-danger/30 text-danger-text';
            break;
        default:
            statusStyles = 'bg-info-bg/30 border-accent-info/30 text-info-text';
    }

    const statusBadge = exec.status === 'FAILED' ? (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    onClick={(e) => { e.stopPropagation(); }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${statusStyles} hover:bg-opacity-80 transition-colors shadow-sm cursor-pointer shrink-0 w-fit uppercase`}
                >
                    <span>FALLIDO</span>
                    <AlertCircle className="w-3 h-3 opacity-80" />
                </div>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="max-w-xs bg-bg-secondary border border-accent-danger/20 text-danger-text p-4 shadow-xl rounded-xl z-50 relative">
                <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                    {exec.errorDetails || "La ejecución falló sin reportar un mensaje de error detallado."}
                </p>
            </PopoverContent>
        </Popover>
    ) : (
        <div className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${statusStyles} shadow-sm shrink-0 w-fit uppercase`}>
            {exec.status === 'COMPLETED' ? 'COMPLETADO' : exec.status === 'PROCESSING' ? 'PROCESANDO' : exec.status}
        </div>
    );

    const payload = parsePayload(exec.requestPayload);
    const sDate = payload?.startDate || exec.stats?.startDate;
    const eDate = payload?.endDate || exec.stats?.endDate;

    let dateRangeDisplay = <span className="text-text-tertiary text-sm font-medium italic normal-case">No se pudo determinar el rango de fechas</span>;
    if (sDate && eDate) {
        const parseSafe = (d: string) => {
            if (!d) return new Date("");
            const datePart = d.split('T')[0];
            return new Date(`${datePart}T12:00:00`);
        };
        const startDateObj = parseSafe(sDate);
        const endDateObj = parseSafe(eDate);

        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
            const startFmt = format(startDateObj, "dd MMM yyyy", { locale: es });
            const endFmt = format(endDateObj, "dd MMM yyyy", { locale: es });
            if (startFmt === endFmt) {
                dateRangeDisplay = <>{startFmt}</>;
            } else {
                dateRangeDisplay = <>{startFmt} - {endFmt}</>;
            }
        }
    }

    return (
        <div
            className="flex flex-col gap-2 p-4 rounded-[1.25rem] border border-border/40 bg-bg-secondary/60 hover:bg-bg-secondary transition-all cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex flex-col gap-2">
                <div>
                    {statusBadge}
                </div>

                <div className="flex items-center justify-between w-full">
                    <span className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2 capitalize">
                        <Calendar className="w-4 h-4 text-accent-primary shrink-0 opacity-80" />
                        {dateRangeDisplay}
                    </span>
                    <div className="text-text-tertiary shrink-0 p-1 hover:bg-bg-primary rounded-full transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-60" /> Ejecución: {format(new Date(exec.startedAt), "dd/MM/yyyy")}</span>
                        <span className="text-border/50">|</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-60" /> Inicio: {format(new Date(exec.startedAt), "HH:mm:ss")}</span>
                        {exec.completedAt && (
                            <>
                                <span className="text-border/50">|</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-60" /> Fin: {format(new Date(exec.completedAt), "HH:mm:ss")}</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="font-semibold text-text-primary">
                            {dayCount === undefined
                                ? "Contando transacciones…"
                                : `${dayCount} ${dayCount === 1 ? "transacción encontrada" : "transacciones encontradas"}`}
                        </span>

                        {exec.source && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-text-secondary bg-bg-primary px-2 py-0.5 rounded-md">
                                {exec.source === 'GMAIL_N8N_WEBHOOK' ? <Mail className="w-3 h-3 text-accent-primary shrink-0" /> : null}
                                {exec.source === 'GMAIL_N8N_WEBHOOK' ? 'GMAIL' : exec.source}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ScannerManager() {
    const weekRange = getWeekRange();
    const [range, setRange] = useState<ScanRange>('recommended');
    const [startDate, setStartDate] = useState(weekRange.start);
    const [endDate, setEndDate] = useState(weekRange.end);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewScanOpen, setIsNewScanOpen] = useState(false);

    // Recommended Ranges State
    const [recommendedRanges, setRecommendedRanges] = useState<{ start: string, end: string }[]>([]);
    const [selectedRecommendedIndex, setSelectedRecommendedIndex] = useState<number>(0);

    // History State
    const [executions, setExecutions] = useState<FinancialScanExecution[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Per-day scanner transaction counts, keyed by day → { externalExecutionId: count }.
    // These are transactions DATED on the day, broken down per scan — so a range
    // scan shows only the portion of its findings that fall on the selected day.
    const [dayCountsByDate, setDayCountsByDate] = useState<Record<string, Record<string, number>>>({});

    useEffect(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        if (dayCountsByDate[dateStr]) return;

        let active = true;
        (async () => {
            const res = await getScannerDayCountsAction(dateStr);
            if (!active) return;
            if (res.success && res.data) {
                setDayCountsByDate(prev => ({ ...prev, [dateStr]: res.data as Record<string, number> }));
            }
        })();
        return () => { active = false; };
    }, [selectedDate, dayCountsByDate]);

    // Count of transactions a given scan found dated on the selected day
    // (undefined while the day's counts are still loading).
    const getDayCount = useCallback((externalExecutionId?: string | null): number | undefined => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const counts = dayCountsByDate[dateStr];
        if (!counts) return undefined;
        return externalExecutionId ? (counts[externalExecutionId] ?? 0) : 0;
    }, [selectedDate, dayCountsByDate]);

    // -- Realtime & Polling for Executions --
    const [showPollingNotice, setShowPollingNotice] = useState(false);
    const pollingNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pollHistoryInBackground = useCallback(async () => {
        setShowPollingNotice(true);
        if (pollingNoticeTimerRef.current) {
            clearTimeout(pollingNoticeTimerRef.current);
        }
        pollingNoticeTimerRef.current = setTimeout(() => {
            setShowPollingNotice(false);
        }, 2500);

        try {
            // Load more items to ensure calendar has good data
            const res = await getScanExecutionsAction(1, 50);
            if (res.success && res.data) {
                const fetchedExecutions = res.data.data;
                setExecutions(prev => {
                    const next = [...prev];
                    fetchedExecutions.forEach(fe => {
                        const idx = next.findIndex(e => e.id === fe.id);
                        if (idx >= 0) {
                            next[idx] = fe;
                        }
                    });

                    if (page === 1) {
                        const existingIds = new Set(next.map(e => e.id));
                        const newItems = fetchedExecutions.filter(e => !existingIds.has(e.id));
                        return [...newItems, ...next].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
                    }

                    return next;
                });
            }
        } catch (error) {
            console.error("Error al recargar historial en realtime:", error);
        }
    }, [page]);

    const subscriptions = useMemo(
        () => [
            { table: "financial_scanner_executions", event: "UPDATE" as const },
            { table: "financial_scanner_executions", event: "INSERT" as const },
        ],
        [],
    );

    const callbacks = useMemo(
        () => ({
            onUpdate: () => {
                void pollHistoryInBackground();
            },
            onInsert: () => {
                void pollHistoryInBackground();
            },
        }),
        [pollHistoryInBackground],
    );

    const { isPollingFallback } = useFinancialRealtime({
        channelName: "scanner-executions-realtime",
        subscriptions,
        callbacks,
        onPollFallback: pollHistoryInBackground,
    });
    // ----------------------------------------

    const loadHistory = useCallback(async (pageNum: number, isInitial = false) => {
        setIsLoadingHistory(true);
        try {
            const res = await getScanExecutionsAction(pageNum, 50);
            if (res.success && res.data) {
                if (isInitial) {
                    setExecutions(res.data.data);
                } else {
                    setExecutions(prev => [...prev, ...res.data.data]);
                }
                setHasMore(res.data.pagination.hasNextPage);
            }
        } catch (error) {
            console.error("Error al cargar historial:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        loadHistory(1, true);
    }, [loadHistory]);

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDateCalendar = startOfWeek(monthStart, { weekStartsOn: 1 }); // weekStartsOn 1 = Monday
    const endDateCalendar = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = useMemo(() => eachDayOfInterval({
        start: startDateCalendar,
        end: endDateCalendar
    }), [startDateCalendar, endDateCalendar]);

    const getDayStatus = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        let hasFailed = false;
        let hasCompleted = false;
        let hasProcessing = false;

        executions.forEach(exec => {
            const payload = parsePayload(exec.requestPayload);
            const sDate = payload?.startDate || exec.stats?.startDate;
            const eDate = payload?.endDate || exec.stats?.endDate;
            if (!sDate || !eDate) return;

            const parseSafe = (ds: string) => {
                const datePart = ds.split('T')[0];
                return new Date(`${datePart}T12:00:00`);
            };
            const startObj = parseSafe(sDate);
            const endObj = parseSafe(eDate);

            const dTime = new Date(`${dateStr}T12:00:00`).getTime();

            if (dTime >= startObj.getTime() && dTime <= endObj.getTime()) {
                if (exec.status === 'COMPLETED') hasCompleted = true;
                if (exec.status === 'FAILED') hasFailed = true;
                if (exec.status === 'PROCESSING') hasProcessing = true;
            }
        });

        if (hasProcessing) return 'processing';
        if (hasCompleted) return 'completed';
        if (hasFailed) return 'failed';
        return 'none';
    }, [executions]);

    useEffect(() => {
        const completedIntervals = executions
            .filter(e => e.status === 'COMPLETED' || e.status === 'PROCESSING')
            .map(e => {
                const payload = parsePayload(e.requestPayload);
                const sDate = payload?.startDate || e.stats?.startDate;
                const eDate = payload?.endDate || e.stats?.endDate;
                if (!sDate || !eDate) return null;
                const parseSafe = (d: string) => {
                    if (!d) return new Date("");
                    const datePart = d.split('T')[0];
                    return new Date(`${datePart}T12:00:00`);
                };
                const startObj = parseSafe(sDate);
                const endObj = parseSafe(eDate);
                if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) return null;
                return {
                    startStr: format(startObj, 'yyyy-MM-dd'),
                    endStr: format(endObj, 'yyyy-MM-dd')
                };
            })
            .filter(Boolean) as { startStr: string, endStr: string }[];

        const today = new Date();
        today.setHours(12, 0, 0, 0);

        const isDateScanned = (dateStr: string) => {
            return completedIntervals.some(interval => {
                return dateStr >= interval.startStr && dateStr <= interval.endStr;
            });
        };

        const ranges: { start: string, end: string }[] = [];
        let currentIterDate = new Date(today);
        let currentRangeEnd: string | null = null;
        let currentRangeLength = 0;

        for (let i = 0; i < 365 && ranges.length < 3; i++) {
            const currentStr = format(currentIterDate, 'yyyy-MM-dd');

            if (!isDateScanned(currentStr)) {
                if (!currentRangeEnd) {
                    currentRangeEnd = currentStr;
                }
                currentRangeLength++;

                if (currentRangeLength === 15) {
                    ranges.push({
                        start: currentStr,
                        end: currentRangeEnd
                    });
                    currentRangeEnd = null;
                    currentRangeLength = 0;
                }
            } else {
                if (currentRangeEnd) {
                    const rangeStart = new Date(currentIterDate);
                    rangeStart.setDate(rangeStart.getDate() + 1);
                    ranges.push({
                        start: format(rangeStart, 'yyyy-MM-dd'),
                        end: currentRangeEnd
                    });
                    currentRangeEnd = null;
                    currentRangeLength = 0;
                }
            }

            currentIterDate.setDate(currentIterDate.getDate() - 1);
        }

        if (currentRangeEnd && ranges.length < 3) {
            const rangeStart = new Date(currentIterDate);
            rangeStart.setDate(rangeStart.getDate() + 1);
            ranges.push({
                start: format(rangeStart, 'yyyy-MM-dd'),
                end: currentRangeEnd
            });
        }

        setRecommendedRanges(ranges);
    }, [executions]);

    useEffect(() => {
        if (range === 'recommended' && recommendedRanges.length > 0) {
            const selected = recommendedRanges[selectedRecommendedIndex] || recommendedRanges[0];
            setStartDate(selected.start);
            setEndDate(selected.end);
        }
    }, [recommendedRanges, range, selectedRecommendedIndex]);

    const handleRangeChange = (newRange: ScanRange) => {
        setRange(newRange);
        const today = new Date();
        if (newRange === 'today') {
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (newRange === 'week') {
            setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        } else if (newRange === 'recommended' && recommendedRanges.length > 0) {
            setSelectedRecommendedIndex(0);
        }
    };

    const handleTriggerScan = async () => {
        if (!startDate || !endDate) {
            toast.error("Seleccione las fechas correctamente");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isAfter(start, end)) {
            toast.error("La fecha de inicio no puede ser posterior a la de fin");
            return;
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 15) {
            toast.error("El rango no puede superar los 15 días");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await triggerFinancialScanAction(startDate, endDate);
            if (res.success) {
                toast.success("El escaneo se ha iniciado en segundo plano");
                setIsNewScanOpen(false); // Close dialog on success
                setTimeout(() => {
                    setPage(1);
                    loadHistory(1, true);
                }, 1000);
            } else {
                toast.error(res.error || "Error al iniciar el escaneo");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedDayExecutions = useMemo(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return executions.filter(exec => {
            const payload = parsePayload(exec.requestPayload);
            const sDate = payload?.startDate || exec.stats?.startDate;
            const eDate = payload?.endDate || exec.stats?.endDate;
            if (!sDate || !eDate) return false;

            const parseSafe = (ds: string) => {
                const datePart = ds.split('T')[0];
                return new Date(`${datePart}T12:00:00`);
            };
            const startObj = parseSafe(sDate);
            const endObj = parseSafe(eDate);

            const dTime = new Date(`${dateStr}T12:00:00`).getTime();

            return dTime >= startObj.getTime() && dTime <= endObj.getTime();
        }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }, [executions, selectedDate]);

    // Total transactions dated on the selected day across all of its scans
    // (sum of what each card shows). Undefined while the day's counts are loading.
    const selectedDayTotalFound = useMemo(() => {
        const counts = dayCountsByDate[format(selectedDate, 'yyyy-MM-dd')];
        if (!counts) return undefined;
        return selectedDayExecutions.reduce(
            (sum, exec) => sum + (exec.externalExecutionId ? (counts[exec.externalExecutionId] ?? 0) : 0),
            0,
        );
    }, [dayCountsByDate, selectedDate, selectedDayExecutions]);

    return (
        <div className="w-full flex flex-col relative pb-24">

            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent-primary shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                        Historial de Ejecuciones
                    </h2>
                </div>
                <div className="flex items-center gap-2 bg-bg-secondary px-3 py-1.5 rounded-xl border border-border/40 text-sm font-medium text-text-secondary">
                    <Filter className="w-4 h-4 opacity-70" />
                    <span className="hidden sm:inline">Filtrar por Mes</span>
                    <span className="sm:hidden">Filtro</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                <div className="lg:col-span-7 xl:col-span-8 bg-bg-secondary/40 rounded-3xl p-4 sm:p-6 flex flex-col border border-border/40">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2.5 bg-bg-primary hover:bg-bg-primary/80 transition-colors rounded-xl border border-border/40"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-lg sm:text-xl capitalize text-text-primary">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2.5 bg-bg-primary hover:bg-bg-primary/80 transition-colors rounded-xl border border-border/40"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                            <div key={d} className="text-center text-xs font-semibold text-text-tertiary mb-2">
                                {d}
                            </div>
                        ))}

                        {calendarDays.map((day, idx) => {
                            const status = getDayStatus(day);
                            let statusClasses = "bg-bg-secondary border-dashed border-border/40 text-text-secondary hover:border-border";

                            if (status === 'completed') {
                                statusClasses = "bg-accent-success hover:bg-accent-success/90 border-transparent text-white font-bold shadow-md";
                            } else if (status === 'failed') {
                                statusClasses = "bg-accent-danger hover:bg-accent-danger/90 border-transparent text-white font-bold shadow-md";
                            } else if (status === 'processing') {
                                statusClasses = "bg-accent-info hover:bg-accent-info/90 border-transparent text-white font-bold shadow-md animate-pulse";
                            }

                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(day);
                                        if (!isSameMonth(day, currentMonth)) {
                                            setCurrentMonth(day);
                                        }
                                    }}
                                    className={`aspect-square rounded-xl sm:rounded-2xl border flex items-center justify-center text-sm sm:text-base transition-all
                                        ${statusClasses}
                                        ${isSelected ? 'ring-4 ring-bg-primary outline outline-2 outline-accent-primary scale-[1.02] z-10' : ''}
                                        ${!isCurrentMonth ? 'opacity-30' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex flex-col gap-2 mt-8 pt-6 border-t border-border/30 text-xs font-medium text-text-secondary">
                        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-accent-success shadow-sm"></div><span>Días Escaneados y Completados</span></div>
                        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-accent-danger shadow-sm"></div><span>Intentos de Escaneo Fallidos en estas fechas</span></div>
                        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-accent-info shadow-sm"></div><span>Días en Proceso de Escaneo</span></div>
                        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-bg-secondary border border-dashed border-border/50"></div><span>Días no Escaneados (Agujeros)</span></div>
                    </div>
                </div>

                {/* Details (Desktop) */}
                <div className="hidden lg:block lg:col-span-5 xl:col-span-4 relative rounded-3xl border border-border/40 bg-bg-secondary/10">
                    <div className="absolute inset-0 flex flex-col p-6 overflow-hidden">
                        <h3 className="text-base font-semibold text-text-primary px-2 capitalize shrink-0 mb-4 flex items-center justify-between">
                            <span>Detalles del día: {format(selectedDate, "dd MMM yyyy", { locale: es })}</span>
                            {selectedDayTotalFound !== undefined && selectedDayTotalFound > 0 && (
                                <span className="text-sm font-bold bg-accent-primary/10 text-accent-primary px-2.5 py-1 rounded-lg shrink-0 ml-2 normal-case">
                                    {selectedDayTotalFound} trx en total
                                </span>
                            )}
                        </h3>

                        <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-2 h-full">
                            {selectedDayExecutions.length > 0 ? (
                                selectedDayExecutions.map(exec => <ExecutionHistoryCard key={exec.id} exec={exec} dayCount={getDayCount(exec.externalExecutionId)} />)
                            ) : (
                                <div className="p-6 text-center text-sm text-text-tertiary border border-border/30 rounded-2xl bg-bg-secondary/30">
                                    No hay registros de ejecución para esta fecha.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details (Mobile) */}
                <div className="lg:hidden flex flex-col gap-4 mt-2">
                    <h3 className="text-base font-semibold text-text-primary px-2 capitalize flex items-center justify-between">
                        <span>Detalles del día seleccionado: {format(selectedDate, "dd MMM yyyy", { locale: es })}</span>
                        {selectedDayTotalFound !== undefined && selectedDayTotalFound > 0 && (
                            <span className="text-sm font-bold bg-accent-primary/10 text-accent-primary px-2.5 py-1 rounded-lg shrink-0 ml-2 normal-case">
                                {selectedDayTotalFound} trx
                            </span>
                        )}
                    </h3>

                    <div className="flex flex-col gap-3">
                        {selectedDayExecutions.length > 0 ? (
                            selectedDayExecutions.map(exec => <ExecutionHistoryCard key={exec.id} exec={exec} dayCount={getDayCount(exec.externalExecutionId)} />)
                        ) : (
                            <div className="p-6 text-center text-sm text-text-tertiary border border-border/30 rounded-2xl bg-bg-secondary/30">
                                No hay registros de ejecución para esta fecha.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isNewScanOpen} onOpenChange={setIsNewScanOpen}>
                <DialogTrigger asChild>
                    <button className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 bg-accent-primary text-accent-primary-foreground hover:bg-accent-primary/90 h-14 rounded-full px-6 shadow-xl shadow-accent-primary/20 flex items-center gap-2 font-bold transition-all hover:scale-105 z-50">
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nuevo Escaneo</span>
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-bg-secondary border-border/40 p-0 overflow-hidden rounded-[1.75rem]">
                    <div className="p-6">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="flex items-center gap-2 text-xl text-text-primary">
                                <Search className="w-5 h-5 text-accent-primary" />
                                Nuevo Escaneo
                            </DialogTitle>
                            <DialogDescription>
                                Inicia un nuevo escaneo financiero definiendo el rango de fechas.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-5 w-full">
                            <Tabs value={range} onValueChange={(v) => handleRangeChange(v as ScanRange)} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-bg-primary/40 border border-border/30 p-1.5 rounded-xl h-12 shadow-inner">
                                    <TabsTrigger
                                        value="recommended"
                                        className="rounded-lg text-xs font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                                    >
                                        Sugerido
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="custom"
                                        className="rounded-lg text-xs font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                                    >
                                        Manual
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="week"
                                        className="rounded-lg text-xs font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                                    >
                                        Semana
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="today"
                                        className="rounded-lg text-xs font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                                    >
                                        Hoy
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex flex-col gap-5 items-start bg-bg-primary/20 p-5 rounded-2xl border border-border/40 shadow-inner">
                                <div className="flex-1 w-full">
                                    <h3 className="text-sm font-semibold text-text-secondary mb-3">
                                        {range === 'today' && 'Escaneo de hoy'}
                                        {range === 'week' && 'Escaneo de la semana actual'}
                                        {range === 'recommended' && 'Rangos sugeridos'}
                                        {range === 'custom' && 'Selección de rango manual'}
                                    </h3>

                                    {range === 'today' && (
                                        <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border bg-accent-primary/10 border-accent-primary text-accent-primary shadow-sm ring-1 ring-accent-primary/20 w-full">
                                            <span className="text-sm font-bold">{startDate}</span>
                                            <span className="text-[10px] uppercase tracking-wider opacity-70 mt-1">único día</span>
                                        </div>
                                    )}

                                    {range === 'week' && (
                                        <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border bg-accent-primary/10 border-accent-primary text-accent-primary shadow-sm ring-1 ring-accent-primary/20 w-full">
                                            <span className="text-sm font-bold">{startDate}</span>
                                            <span className="text-[10px] uppercase tracking-wider opacity-70 my-1">hasta</span>
                                            <span className="text-sm font-bold">{endDate}</span>
                                        </div>
                                    )}

                                    {range === 'recommended' && recommendedRanges.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                            {recommendedRanges.map((r, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedRecommendedIndex(i)}
                                                    className={`flex flex-col items-center justify-center px-3 py-2 sm:px-4 sm:py-3 rounded-xl border transition-all ${selectedRecommendedIndex === i
                                                        ? 'bg-accent-primary/10 border-accent-primary text-accent-primary shadow-sm ring-1 ring-accent-primary/20'
                                                        : 'bg-bg-secondary border-border/40 text-text-secondary hover:bg-bg-primary/60 hover:border-border/60 hover:text-text-primary'
                                                        }`}
                                                >
                                                    <span className="text-sm font-bold">{r.start}</span>
                                                    <span className="text-[10px] uppercase tracking-wider opacity-70 my-0.5 sm:my-1">hasta</span>
                                                    <span className="text-sm font-bold">{r.end}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {range === 'recommended' && recommendedRanges.length === 0 && (
                                        <div className="text-sm text-text-tertiary py-3 px-4 bg-bg-secondary border border-border/40 rounded-xl inline-block w-full">
                                            No hay recomendaciones disponibles (historial completo o sin espacios).
                                        </div>
                                    )}

                                    {range === 'custom' && (
                                        <div className="flex flex-col gap-3 w-full">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-bg-secondary border border-border/40 rounded-xl px-4 h-12 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-shadow"
                                            />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-bg-secondary border border-border/40 rounded-xl px-4 h-12 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-shadow"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleTriggerScan}
                                disabled={isSubmitting}
                                className="w-full shrink-0 justify-center bg-accent-primary hover:bg-accent-primary/90 text-accent-primary-foreground font-semibold px-8 h-12 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                            >
                                {isSubmitting ? (
                                    <><RefreshCw className="w-5 h-5 animate-spin" /> Procesando...</>
                                ) : (
                                    <><Search className="w-5 h-5" /> Ejecutar Escáner</>
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

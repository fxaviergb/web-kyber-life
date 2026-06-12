'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { triggerFinancialScanAction, getScanExecutionsAction } from '@/app/actions/financial-scanner';
import { Calendar, Search, RefreshCw, CheckCircle2, XCircle, Clock, ChevronLeft, Mail, AlertCircle, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { FinancialScanExecution } from '@/domain/entities/financial';
import { format, isAfter, isBefore, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
            try { body = JSON.parse(body); } catch (e) {}
        }
        if (body && typeof body === 'object' && body.startDate) {
            return body;
        }
    }

    // Ultimate regex fallback to catch double-stringified or escaped data
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

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-accent-success" />;
        case 'FAILED': return <XCircle className="w-5 h-5 text-accent-danger" />;
        case 'PROCESSING': return <RefreshCw className="w-5 h-5 text-accent-info animate-spin" />;
        default: return <Clock className="w-5 h-5 text-text-tertiary" />;
    }
};

function ExecutionHistoryCard({ exec }: { exec: FinancialScanExecution }) {
    const [isExpanded, setIsExpanded] = useState(false);

    let statusStyles = '';
    switch (exec.status) {
        case 'COMPLETED':
            statusStyles = 'bg-success-bg border-accent-success/20 text-success-text';
            break;
        case 'FAILED':
            statusStyles = 'bg-danger-bg border-accent-danger/20 text-danger-text';
            break;
        default:
            statusStyles = 'bg-info-bg border-accent-info/20 text-info-text';
    }

    const statusBadge = exec.status === 'FAILED' ? (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    onClick={(e) => { e.stopPropagation(); }}
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide border ${statusStyles} hover:bg-opacity-80 transition-colors shadow-sm cursor-pointer shrink-0 w-fit`}
                >
                    <span>FALLIDO</span>
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80" />
                </div>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="max-w-xs bg-bg-secondary border border-accent-danger/20 text-danger-text p-4 shadow-xl rounded-xl z-50 relative">
                <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                    {exec.errorDetails || "La ejecución falló sin reportar un mensaje de error detallado."}
                </p>
            </PopoverContent>
        </Popover>
    ) : (
        <div className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide border ${statusStyles} shadow-sm shrink-0 w-fit`}>
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
            className="flex flex-col gap-2 p-4 sm:p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-bg-primary/50 to-bg-primary/30 hover:from-bg-primary hover:to-bg-primary/80 transition-all shadow-sm cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-start gap-4 w-full">
                <div className="p-2 rounded-xl bg-bg-secondary shadow-inner border border-border/50 shrink-0 mt-0.5">
                    <StatusIcon status={exec.status} />
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="mb-1">
                        {statusBadge}
                    </div>

                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm sm:text-lg font-bold text-text-primary flex items-center gap-1.5 sm:gap-2 capitalize break-words">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary shrink-0" />
                            {dateRangeDisplay}
                        </span>
                        <div className="text-text-tertiary shrink-0 ml-2">
                            {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-2 pt-3 border-t border-border/30 pl-14" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] sm:text-xs font-medium text-text-secondary flex items-center gap-1 sm:gap-1.5 bg-bg-primary/50 px-2 py-1 sm:px-2.5 rounded-md border border-border/30">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-tertiary shrink-0" />
                        Ejecución: {format(new Date(exec.startedAt), "dd/MM/yyyy")}
                    </span>

                    <span className="text-[11px] sm:text-xs font-medium text-text-secondary flex items-center gap-1 sm:gap-1.5 bg-bg-primary/50 px-2 py-1 sm:px-2.5 rounded-md border border-border/30">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-tertiary shrink-0" />
                        Inicio: {format(new Date(exec.startedAt), "HH:mm:ss")}
                    </span>

                    {exec.completedAt && (
                        <>
                            <span className="text-[11px] sm:text-xs font-medium text-text-secondary flex items-center gap-1 sm:gap-1.5 bg-bg-primary/50 px-2 py-1 sm:px-2.5 rounded-md border border-border/30">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-tertiary shrink-0" />
                                Fin: {format(new Date(exec.completedAt), "HH:mm:ss")}
                            </span>
                            <span className="text-[11px] sm:text-xs font-medium text-text-secondary flex items-center gap-1 sm:gap-1.5 bg-bg-primary/50 px-2 py-1 sm:px-2.5 rounded-md border border-border/30">
                                <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-primary shrink-0" />
                                Duración: <span className="font-bold">{getFormattedDuration(exec.startedAt, exec.completedAt)}</span>
                            </span>
                        </>
                    )}

                    {exec.stats && exec.stats.totalTransactionsFound !== undefined && (
                        <span className="text-[11px] sm:text-xs font-medium text-text-secondary bg-bg-primary/50 px-2 py-1 sm:px-2.5 rounded-md border border-border/30 flex items-center gap-1 sm:gap-1.5 mt-1 w-full sm:w-auto">
                            <span className="text-text-primary font-bold">{exec.stats.totalTransactionsFound}</span>
                            <span>trx detectadas</span>
                            {exec.source === 'GMAIL_N8N_WEBHOOK' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-text-secondary bg-bg-secondary px-1.5 py-0.5 rounded ml-auto sm:ml-1">
                                    <Mail className="w-2.5 h-2.5 text-accent-primary shrink-0" />
                                    GMAIL
                                </span>
                            ) : exec.source ? (
                                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-text-secondary bg-bg-secondary px-1.5 py-0.5 rounded ml-auto sm:ml-1">
                                    {exec.source}
                                </span>
                            ) : null}
                        </span>
                    )}
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

    // Recommended Ranges State
    const [recommendedRanges, setRecommendedRanges] = useState<{ start: string, end: string }[]>([]);
    const [selectedRecommendedIndex, setSelectedRecommendedIndex] = useState<number>(0);

    // History State
    const [executions, setExecutions] = useState<FinancialScanExecution[]>([]);
    const [sortBy, setSortBy] = useState<'execution' | 'range'>('range');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const sortedExecutions = useMemo(() => {
        return [...executions].sort((a, b) => {
            // PROCESSING records always at the top
            if (a.status === 'PROCESSING' && b.status !== 'PROCESSING') return -1;
            if (b.status === 'PROCESSING' && a.status !== 'PROCESSING') return 1;

            if (sortBy === 'range') {
                const aPayload = parsePayload(a.requestPayload);
                const bPayload = parsePayload(b.requestPayload);
                const aStart = aPayload?.startDate ? new Date(aPayload.startDate).getTime() : 0;
                const bStart = bPayload?.startDate ? new Date(bPayload.startDate).getTime() : 0;
                if (aStart !== bStart) {
                    return bStart - aStart; // Descending
                }
            }
            
            // Fallback or if sortBy === 'execution'
            return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        });
    }, [executions, sortBy]);

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
            const res = await getScanExecutionsAction(1, 10);
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

                    // Si estamos en la primera página, también agregamos los nuevos que hayan llegado
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
            console.log("Cargando historial, página:", pageNum);
            const res = await getScanExecutionsAction(pageNum, 10);
            console.log("Respuesta de historial:", res);
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

    return (
        <div className="w-full flex flex-col gap-6">


            <div className="bg-bg-secondary text-text-primary rounded-[1.75rem] border border-border/60 p-6 shadow-sm shadow-black/5">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-accent-primary" />
                    Nuevo Escaneo
                </h2>

                <div className="flex flex-col gap-5 w-full">
                    <Tabs value={range} onValueChange={(v) => handleRangeChange(v as ScanRange)} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-bg-primary/40 border border-border/30 p-1.5 rounded-xl h-12 shadow-inner">
                            <TabsTrigger
                                value="recommended"
                                className="rounded-lg text-sm font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                            >
                                Sugerido
                            </TabsTrigger>
                            <TabsTrigger
                                value="custom"
                                className="rounded-lg text-sm font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                            >
                                Manual
                            </TabsTrigger>
                            <TabsTrigger
                                value="week"
                                className="rounded-lg text-sm font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                            >
                                Semana
                            </TabsTrigger>
                            <TabsTrigger
                                value="today"
                                className="rounded-lg text-sm font-semibold data-[state=active]:bg-bg-secondary data-[state=active]:text-accent-primary data-[state=active]:shadow-sm transition-all h-full truncate px-1"
                            >
                                Hoy
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-col md:flex-row gap-5 items-start md:items-end justify-between bg-bg-primary/20 p-5 rounded-2xl border border-border/40 shadow-inner">
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
                                <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:flex-nowrap">
                                    {recommendedRanges.map((r, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedRecommendedIndex(i)}
                                            className={`flex flex-col items-center justify-center px-3 py-2 sm:px-4 sm:py-3 rounded-xl border transition-all sm:flex-1 sm:min-w-[130px] ${
                                                i > 1 ? 'hidden sm:flex' : ''
                                            } ${selectedRecommendedIndex === i
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
                                <div className="text-sm text-text-tertiary py-3 px-4 bg-bg-secondary border border-border/40 rounded-xl inline-block">
                                    No hay recomendaciones disponibles (historial completo o sin espacios).
                                </div>
                            )}

                            {range === 'custom' && (
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-bg-secondary border border-border/40 rounded-xl px-4 h-12 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-shadow"
                                    />
                                    <span className="text-text-tertiary font-bold hidden sm:block">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-bg-secondary border border-border/40 rounded-xl px-4 h-12 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-shadow"
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleTriggerScan}
                            disabled={isSubmitting}
                            className="w-full md:w-auto shrink-0 justify-center bg-accent-primary hover:bg-accent-primary/90 text-accent-primary-foreground font-semibold px-8 h-12 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap mt-2 md:mt-0"
                        >
                            {isSubmitting ? (
                                <><RefreshCw className="w-5 h-5 animate-spin" /> Procesando...</>
                            ) : (
                                <><Search className="w-5 h-5" /> Ejecutar Escáner</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-bg-secondary text-text-primary rounded-[1.75rem] border border-border/60 p-6 shadow-sm shadow-black/5">
                <h2 className="text-xl font-semibold mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent-primary" />
                        Historial de Ejecuciones
                        {showPollingNotice && (
                            <span className="ml-2 text-[10px] sm:text-xs font-bold text-accent-primary flex items-center gap-1.5 animate-pulse bg-accent-primary/10 px-2 py-1 rounded-md">
                                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                                Actualizando...
                            </span>
                        )}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'execution' | 'range')}
                        className="bg-bg-primary text-text-secondary text-sm font-medium border border-border/40 rounded-xl px-3 py-2 sm:py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-primary/50 shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="range">Ordenar por Rango</option>
                        <option value="execution">Ordenar por Fecha de Ejecución</option>
                    </select>
                </h2>

                <TooltipProvider delayDuration={200}>
                    <div className="flex flex-col gap-4">
                        {sortedExecutions.map((exec) => (
                            <ExecutionHistoryCard key={exec.id} exec={exec} />
                        ))}

                        {sortedExecutions.length === 0 && !isLoadingHistory && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay registros de ejecuciones previas.
                            </div>
                        )}

                        {hasMore && (
                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        loadHistory(nextPage, false);
                                    }}
                                    disabled={isLoadingHistory}
                                    className="text-sm font-medium text-accent-primary hover:text-accent-primary/80 transition-colors disabled:opacity-50"
                                >
                                    {isLoadingHistory ? 'Cargando...' : 'Cargar más resultados'}
                                </button>
                            </div>
                        )}
                    </div>
                </TooltipProvider>
            </div>
        </div>
    );
}


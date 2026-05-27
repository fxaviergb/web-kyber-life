'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { triggerFinancialScanAction, getScanExecutionsAction } from '@/app/actions/financial-scanner';
import { Calendar, Search, RefreshCw, CheckCircle2, XCircle, Clock, ChevronLeft } from 'lucide-react';
import { FinancialScanExecution } from '@/domain/entities/financial';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

type ScanRange = 'today' | 'week' | 'custom';

export function ScannerManager() {
    const [range, setRange] = useState<ScanRange>('today');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // History State
    const [executions, setExecutions] = useState<FinancialScanExecution[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
        loadHistory(1, true);
    }, [loadHistory]);

    const handleRangeChange = (newRange: ScanRange) => {
        setRange(newRange);
        const today = new Date();
        if (newRange === 'today') {
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (newRange === 'week') {
            // "Esta semana" starts on Monday and ends on Sunday
            import('date-fns').then(({ startOfWeek, endOfWeek }) => {
                setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            });
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

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-accent-success" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-accent-danger" />;
            case 'PROCESSING': return <RefreshCw className="w-5 h-5 text-accent-info animate-spin" />;
            default: return <Clock className="w-5 h-5 text-text-tertiary" />;
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Link href="/financial/scans" className="p-2 rounded-full bg-bg-secondary hover:bg-bg-hover text-text-secondary transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-text-primary">Bandeja de Escaneos</h1>
            </div>

            <div className="bg-bg-secondary text-text-primary rounded-[1.75rem] border border-border/60 p-6 shadow-sm shadow-black/5">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-accent-primary" />
                    Nuevo Escaneo
                </h2>
                
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex bg-bg-primary p-1 rounded-xl w-full lg:w-auto h-11 shrink-0 border border-border/50">
                        <button 
                            onClick={() => handleRangeChange('today')}
                            className={`flex-1 lg:flex-none px-4 rounded-lg text-sm font-medium transition-colors ${range === 'today' ? 'bg-accent-primary text-accent-primary-foreground shadow' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Hoy
                        </button>
                        <button 
                            onClick={() => handleRangeChange('week')}
                            className={`flex-1 lg:flex-none px-4 rounded-lg text-sm font-medium transition-colors ${range === 'week' ? 'bg-accent-primary text-accent-primary-foreground shadow' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Esta semana
                        </button>
                        <button 
                            onClick={() => handleRangeChange('custom')}
                            className={`flex-1 lg:flex-none px-4 rounded-lg text-sm font-medium transition-colors ${range === 'custom' ? 'bg-accent-primary text-accent-primary-foreground shadow' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Personalizado
                        </button>
                    </div>

                    {range === 'custom' && (
                        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 h-11">
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 lg:flex-none bg-bg-primary border border-border/50 rounded-xl px-3 h-full text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                            />
                            <span className="text-text-secondary">-</span>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 lg:flex-none bg-bg-primary border border-border/50 rounded-xl px-3 h-full text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                            />
                        </div>
                    )}

                    <div className="hidden lg:block flex-1" />

                    <button 
                        onClick={handleTriggerScan}
                        disabled={isSubmitting}
                        className="w-full lg:w-auto shrink-0 justify-center bg-accent-primary hover:bg-accent-primary/90 text-accent-primary-foreground font-medium px-6 h-11 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        {isSubmitting ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando...</>
                        ) : (
                            <><Search className="w-4 h-4" /> Ejecutar Escáner</>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-bg-secondary text-text-primary rounded-[1.75rem] border border-border/60 p-6 shadow-sm shadow-black/5">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent-primary" />
                    Historial de Ejecuciones
                </h2>

                <div className="flex flex-col gap-4">
                    {executions.map((exec) => {
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
                        
                        return (
                        <div key={exec.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-bg-primary/50 hover:bg-bg-primary transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-bg-secondary shadow-sm border border-border/50">
                                    <StatusIcon status={exec.status} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-text-primary">
                                        Escaneo vía {exec.source === 'GMAIL_N8N_WEBHOOK' ? 'N8N Gmail' : exec.source}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(exec.startedAt), "d MMM, HH:mm", { locale: es })}
                                        </span>
                                        {exec.completedAt && (
                                            <span className="text-xs text-text-tertiary">
                                                (Finalizó: {format(new Date(exec.completedAt), "HH:mm")})
                                            </span>
                                        )}
                                    </div>
                                    {exec.errorDetails && (
                                        <div className="text-xs text-danger-text mt-1">
                                            Error: {exec.errorDetails}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyles}`}>
                                    {exec.status}
                                </div>
                                {exec.stats && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {exec.stats.totalTransactionsFound || 0} trx
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}

                    {executions.length === 0 && !isLoadingHistory && (
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
                                    loadHistory(nextPage);
                                }}
                                disabled={isLoadingHistory}
                                className="text-sm font-medium text-accent-primary hover:text-accent-primary/80 transition-colors disabled:opacity-50"
                            >
                                {isLoadingHistory ? 'Cargando...' : 'Cargar más resultados'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


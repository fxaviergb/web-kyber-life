import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ScannerManager } from '@/presentation/financial/components/ScannerManager';

export const metadata = {
    title: 'Escáner Financiero | KyberLife',
    description: 'Gestiona los escaneos de transacciones financieras',
};

export default function FinancialScannerPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-transparent p-4 md:p-8">
            <div className="max-w-4xl mx-auto w-full space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/financial/scans"
                            className="p-2 rounded-full bg-bg-secondary border border-border-base text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                                Escáner Financiero
                            </h1>
                            <p className="text-sm text-text-secondary mt-1">
                                Sincroniza tus transacciones desde orígenes externos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <ScannerManager />
            </div>
        </div>
    );
}

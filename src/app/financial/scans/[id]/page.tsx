import { Metadata } from "next";
import { getScannerTransactionByIdAction } from "@/app/actions/financial-inbox";
import { ScanDetailsForm } from "@/presentation/financial/components/ScanDetailsForm";
import { ArrowLeft, Inbox as InboxIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Detalles de Escaneo - KyberLife",
    description: "Revisa y edita los detalles de una transacción escaneada",
};

interface ScanDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ScanDetailsPage({ params }: ScanDetailsPageProps) {
    const { id } = await params;
    const response = await getScannerTransactionByIdAction(id);

    if (!response.success || !response.data) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <h2 className="text-2xl font-bold tracking-tight">Escaneo no encontrado</h2>
                    <p className="text-muted-foreground">
                        {response.error || "La transacción que buscas no existe o no tienes permiso para verla."}
                    </p>
                    <Link href="/financial/scans">
                        <Button variant="default" className="mt-4">
                            Volver a la bandeja
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Link href="/financial/scans">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <InboxIcon className="h-8 w-8 text-primary" />
                            Detalles de Escaneo
                        </h2>
                    </div>
                    <p className="text-muted-foreground sm:ml-11">
                        Revisa todos los datos extraídos y edítalos antes de confirmar.
                    </p>
                </div>
            </div>

            <div className="mt-8 max-w-4xl mx-auto">
                <ScanDetailsForm initialData={response.data} />
            </div>
        </div>
    );
}

import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary p-4 text-center">
            <div className="bg-bg-secondary p-8 rounded-full mb-6 animate-pulse">
                <WifiOff className="w-16 h-16 text-text-tertiary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sin Conexión</h1>
            <p className="text-text-secondary max-w-sm mb-8">
                Parece que perdiste la conexión a internet.
                Revisa tu señal o conéctate a una red Wi-Fi para continuar.
            </p>
            <Button asChild>
                <Link href="/dashboard">
                    Intentar Recargar
                </Link>
            </Button>
        </div>
    );
}

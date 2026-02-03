"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as any).MSStream
        );

        setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    if (isStandalone) return null;

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    if (!showPrompt && !isIOS) return null;

    // Don't show iOS prompt immediately on load to avoid annoyance, 
    // maybe implementing a "Install" button in settings is better, 
    // but for now, we leave it manual or show only on specific trigger.
    // For this requirements, let's just support the standard Android/Desktop flow.
    if (isIOS) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-bg-secondary border border-border p-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="bg-accent-primary/10 p-2 rounded-lg h-fit">
                        <Download className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary">Instalar App</h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Instala KyberLife para una mejor experiencia.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowPrompt(false)}
                    className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-4 flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowPrompt(false)}>
                    Quizás luego
                </Button>
                <Button size="sm" onClick={handleInstallClick} className="bg-accent-primary hover:bg-accent-primary/90">
                    Instalar
                </Button>
            </div>
        </div>
    );
}

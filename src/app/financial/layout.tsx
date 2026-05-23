import { Metadata } from "next";
import { FinancialRealtimeProvider } from "@/presentation/financial/components/FinancialRealtimeProvider";

export const metadata: Metadata = {
    title: "Financial | KyberLife",
    description: "Manage your finances, track expenses, and plan your budget.",
};

export default function FinancialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col w-full h-full min-h-screen bg-background">
            {/* Header could be added here if not part of a global layout */}
            <main className="flex-1 w-full flex flex-col items-center">
                <div className="w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                    <FinancialRealtimeProvider>
                        {children}
                    </FinancialRealtimeProvider>
                </div>
            </main>
        </div>
    );
}

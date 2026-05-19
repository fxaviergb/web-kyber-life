import { Metadata } from "next";
import { TransactionForm } from "@/presentation/financial/components/TransactionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "New Transaction - KyberLife",
    description: "Record a new manual financial transaction",
};

export default function NewTransactionPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center space-x-2 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/financial/transactions">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back to transactions</span>
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Add Transaction</h2>
                    <p className="text-muted-foreground">
                        Manually enter a new financial record.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <TransactionForm />
            </div>
        </div>
    );
}

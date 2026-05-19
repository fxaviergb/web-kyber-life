"use client";

import { useState, useEffect } from "react";
import { getUnprocessedInboxTransactionsAction, mapInboxTransactionAction, dismissInboxTransactionAction } from "@/app/actions/financial-inbox";
import { FinancialScannerTransaction } from "@/domain/entities/financial";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Inbox as InboxIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/infrastructure/supabase/client";

export function FinancialInbox() {
    const [transactions, setTransactions] = useState<FinancialScannerTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Editing State per transaction
    const [editStates, setEditStates] = useState<Record<string, { type: string, merchant: string }>>({});

    useEffect(() => {
        loadInbox();

        // Supabase Realtime Subscription
        const supabase = createClient();
        const channel = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'financial_scanner_transactions' },
                (payload) => {
                    toast("New transaction scanned via N8N!", {
                        description: "Refresh or wait for it to appear in your inbox.",
                    });
                    // Reload inbox to get the fresh data
                    loadInbox();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadInbox = async () => {
        setLoading(true);
        const result = await getUnprocessedInboxTransactionsAction();
        if (result.success && result.data) {
            setTransactions(result.data);
            
            // Initialize edit states based on extracted values
            const initialEdits: Record<string, { type: string, merchant: string }> = {};
            result.data.forEach(tx => {
                initialEdits[tx.id!] = {
                    type: tx.extractedType || "EXPENSE",
                    merchant: tx.extractedMerchant || ""
                };
            });
            setEditStates(initialEdits);
        } else {
            toast.error("Failed to load inbox");
        }
        setLoading(false);
    };

    const handleConfirm = async (tx: FinancialScannerTransaction) => {
        setProcessingId(tx.id!);
        try {
            const editState = editStates[tx.id!];
            
            const result = await mapInboxTransactionAction({
                scannerTransactionId: tx.id!,
                type: (editState?.type as any) || "EXPENSE",
                merchant: editState?.merchant || undefined
            });

            if (result.success) {
                toast.success("Transaction confirmed and mapped!");
                setTransactions(prev => prev.filter(t => t.id !== tx.id));
            } else {
                toast.error(result.error || "Failed to confirm transaction");
            }
        } catch (e) {
            toast.error("Error processing transaction");
        }
        setProcessingId(null);
    };

    const handleDismiss = async (txId: string) => {
        setProcessingId(txId);
        try {
            const result = await dismissInboxTransactionAction(txId);
            if (result.success) {
                toast.success("Transaction dismissed");
                setTransactions(prev => prev.filter(t => t.id !== txId));
            } else {
                toast.error(result.error || "Failed to dismiss transaction");
            }
        } catch (e) {
            toast.error("Error dismissing transaction");
        }
        setProcessingId(null);
    };

    const updateEditState = (txId: string, field: 'type' | 'merchant', value: string) => {
        setEditStates(prev => ({
            ...prev,
            [txId]: {
                ...prev[txId],
                [field]: value
            }
        }));
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse">Loading inbox...</div>;
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-muted/50">
                <InboxIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Inbox Zero</h3>
                <p className="text-muted-foreground mt-2">You have no pending scanned transactions.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {transactions.map(tx => (
                <Card key={tx.id} className="w-full">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">
                                    {tx.extractedAmount ? `$${tx.extractedAmount.toFixed(2)}` : "Amount Unknown"}
                                </CardTitle>
                                <CardDescription>
                                    {tx.extractedDate ? new Date(tx.extractedDate).toLocaleString() : "Date Unknown"}
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    Pending Review
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap overflow-hidden text-ellipsis max-h-32 overflow-y-auto">
                            <strong>Raw Scan Data:</strong>
                            <p className="text-muted-foreground mt-1 text-xs">{tx.rawText || "No raw text available"}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select 
                                    value={editStates[tx.id!]?.type || "EXPENSE"} 
                                    onValueChange={(val) => updateEditState(tx.id!, 'type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                        <SelectItem value="INCOME">Income</SelectItem>
                                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Merchant</Label>
                                <Input 
                                    value={editStates[tx.id!]?.merchant || ""} 
                                    onChange={(e) => updateEditState(tx.id!, 'merchant', e.target.value)}
                                    placeholder="Enter merchant name"
                                />
                            </div>
                            
                            {/* We can add Category and Account selects here once those API routes are ready */}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                        <Button 
                            variant="outline" 
                            className="text-destructive"
                            onClick={() => handleDismiss(tx.id!)}
                            disabled={processingId === tx.id}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Dismiss
                        </Button>
                        <Button 
                            onClick={() => handleConfirm(tx)}
                            disabled={processingId === tx.id}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm & Save
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

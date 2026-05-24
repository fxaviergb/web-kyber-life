import { getTransactionByIdAction } from "@/app/actions/financial-transactions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CreditCard, Tag, FileText, Activity, ServerCrash } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TransactionDetailClient } from "@/presentation/financial/components/TransactionDetailClient";
import { TransactionActionButtons } from "@/presentation/financial/components/TransactionActionButtons";
import { OriginStatsViewer } from "@/presentation/financial/components/OriginStatsViewer";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("es-ES", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function getStatusVariant(status: string): "default" | "outline" | "success" | "warning" | "danger" {
    switch (status) {
        case "CONFIRMED": return "success";
        case "DETECTED":
        case "REVIEWED": return "warning";
        case "REJECTED":
        case "DUPLICATE":
        case "DELETED": return "danger";
        default: return "default";
    }
}

export default async function TransactionDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const result = await getTransactionByIdAction(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const transaction = result.data;
    const isIncome = transaction.type === 'INCOME' || transaction.type === 'DEPOSIT' || transaction.type === 'REFUND';

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/financial/transactions">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Detalle de la transacción</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualiza la información detallada de este registro.
                    </p>
                    <TransactionActionButtons transaction={transaction} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Main Info Card */}
                <Card className="md:col-span-2 border-primary/10 shadow-sm backdrop-blur-sm bg-background/50">
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{transaction.merchant || "Comercio desconocido"}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(transaction.date)}
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className={`text-3xl font-bold ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {transaction.currency}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant={getStatusVariant(transaction.status)} className="rounded-full px-3">
                                {transaction.status}
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 capitalize">
                                {transaction.type.toLowerCase()}
                            </Badge>
                            {transaction.possibleDuplicate && (
                                <Badge variant="warning" className="rounded-full px-3">
                                    Posible duplicado
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Tag className="h-4 w-4" /> Categoria
                                </div>
                                <div className="font-medium">
                                    {transaction.categoryId ? "Categoría asignada" : "Sin categoría"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Cuenta
                                </div>
                                <div className="font-medium">
                                    {transaction.accountId ? "Cuenta asignada" : "Sin asignar"}
                                </div>
                            </div>
                        </div>

                        {transaction.notes && (
                            <div className="pt-4 border-t border-border/50 space-y-2">
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Notas
                                </div>
                                <p className="text-sm">{transaction.notes}</p>
                            </div>
                        )}

                        {transaction.tags && transaction.tags.length > 0 && (
                            <div className="pt-4 border-t border-border/50 space-y-2">
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Tag className="h-4 w-4" /> Etiquetas
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {transaction.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="bg-secondary/50">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Sidebar */}
                <div className="flex flex-col gap-6">
                    {/* Duplicate Resolver + Audit Trail (Client Components) */}
                    <TransactionDetailClient
                        transactionId={transaction.id}
                        isPossibleDuplicate={transaction.possibleDuplicate}
                    />

                    {/* Origin Stats Card */}
                    <OriginStatsViewer originStats={transaction.originStats} />

                    {/* System Info Card */}
                    <Card className="shadow-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ServerCrash className="h-5 w-5 text-primary/70" />
                                Información del sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID:</span>
                                <span className="font-mono text-xs" title={transaction.id}>{transaction.id?.substring(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Creado:</span>
                                <span>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" }) : 'N/D'}</span>
                            </div>
                            {transaction.executionId && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ejecución:</span>
                                    <span className="font-mono text-xs" title={transaction.executionId}>{transaction.executionId.substring(0, 8)}...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

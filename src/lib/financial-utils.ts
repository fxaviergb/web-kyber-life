import type { FinancialTransaction } from "@/domain/entities/financial";

const TYPE_LABELS: Record<string, string> = {
    EXPENSE: "Gasto",
    INCOME: "Ingreso",
    TRANSFER: "Transferencia",
    PAYMENT: "Pago",
    REFUND: "Reembolso",
    WITHDRAWAL: "Retiro",
    DEPOSIT: "Depósito",
    FEE: "Comisión",
    TAX: "Impuesto",
    OTHER: "Otro",
};

/**
 * Extracts a meaningful display title for a financial transaction.
 *
 * Fallback priority:
 * 1. `description` field (trimmed)
 * 2. Email subject from `originStats.subject`
 * 3. Generated text from transaction type + merchant
 * 4. Type label alone (e.g. "Gasto")
 */
export function getTransactionDisplayTitle(tx: FinancialTransaction): string {
    if (tx.description?.trim()) {
        return tx.description.trim();
    }

    const stats = tx.originStats as Record<string, unknown> | null | undefined;
    const emailSubject = stats?.subject as string | undefined;
    if (emailSubject?.trim()) {
        return emailSubject.trim();
    }

    const typeLabel = TYPE_LABELS[tx.type] ?? tx.type;
    if (tx.merchant?.trim()) {
        return `${typeLabel} – ${tx.merchant.trim()}`;
    }

    return typeLabel;
}

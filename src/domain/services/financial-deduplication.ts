import { FinancialTransaction } from "../../domain/entities/financial";

/**
 * Generates a deterministic fingerprint for a transaction based on its core
 * identity fields. Two transactions with the same fingerprint are likely duplicates.
 *
 * Fingerprint components:
 * - ownerUserId
 * - amount (rounded to 2 decimals)
 * - date (truncated to day)
 * - merchant (normalized: lowercase, trimmed)
 * - type
 */
export function generateTransactionFingerprint(tx: Pick<FinancialTransaction, 'ownerUserId' | 'amount' | 'date' | 'merchant' | 'type'>): string {
    const normalizedMerchant = (tx.merchant ?? "unknown").toLowerCase().trim();
    const dayDate = tx.date.substring(0, 10); // "2026-05-18"
    const roundedAmount = Math.round(Number(tx.amount) * 100);

    return `${tx.ownerUserId}|${roundedAmount}|${dayDate}|${normalizedMerchant}|${tx.type}`;
}

/**
 * Compares a candidate transaction against existing ones and returns
 * an array of IDs that match the same fingerprint (potential duplicates).
 */
export function findDuplicates(
    candidate: Pick<FinancialTransaction, 'ownerUserId' | 'amount' | 'date' | 'merchant' | 'type'>,
    existingTransactions: FinancialTransaction[]
): string[] {
    const candidateFingerprint = generateTransactionFingerprint(candidate);

    return existingTransactions
        .filter(tx => {
            if (tx.status === "DUPLICATE" || tx.status === "DELETED" || tx.status === "REJECTED") {
                return false;
            }
            return generateTransactionFingerprint(tx) === candidateFingerprint;
        })
        .map(tx => tx.id);
}

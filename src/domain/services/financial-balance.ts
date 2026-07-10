import { FinancialTransaction, FinancialTransactionType } from "../entities/financial";

/**
 * Category name that marks a TRANSFER as money leaving the user's available
 * (spendable) balance — e.g. moving cash into savings/investments. Other
 * transfers (between two spendable accounts) don't reduce what's available.
 */
export const SAVINGS_CATEGORY_NAME = "Ahorros e Inversiones";

export function isIncomeType(type: FinancialTransactionType): boolean {
    return type === "INCOME" || type === "DEPOSIT" || type === "REFUND";
}

export function isWithdrawalType(type: FinancialTransactionType): boolean {
    return type === "WITHDRAWAL";
}

export function isOtherType(type: FinancialTransactionType): boolean {
    return type === "TRANSFER" || type === "OTHER";
}

type BalanceTransaction = Pick<FinancialTransaction, "type" | "amount" | "categoryId" | "categoryName" | "paidWithCredit">;

function resolveCategoryName(t: BalanceTransaction, categoryNameById?: ReadonlyMap<string, string>): string | undefined {
    if (t.categoryName) return t.categoryName;
    if (t.categoryId && categoryNameById) return categoryNameById.get(t.categoryId);
    return undefined;
}

export function isSavingsTransfer(t: BalanceTransaction, categoryNameById?: ReadonlyMap<string, string>): boolean {
    return t.type === "TRANSFER" && resolveCategoryName(t, categoryNameById) === SAVINGS_CATEGORY_NAME;
}

/**
 * Single source of truth for "available balance" across the financial module:
 * income in, minus real cash-out expenses, minus transfers earmarked as
 * savings. Expenses marked `paidWithCredit` are deferred — they don't reduce
 * available cash until their card-bill payment is logged as its own expense.
 * Withdrawals are cash-neutral (money changes form, still spendable).
 *
 * `categoryNameById` is only needed when `categoryName` isn't already
 * populated on the transactions (e.g. raw repository reads); already-enriched
 * transaction lists (with `categoryName` set) can omit it.
 */
export function computeNetBalance(
    transactions: readonly BalanceTransaction[],
    categoryNameById?: ReadonlyMap<string, string>,
): number {
    let balance = 0;

    for (const t of transactions) {
        const amount = Number(t.amount);
        if (isIncomeType(t.type)) {
            balance += amount;
        } else if (isWithdrawalType(t.type)) {
            // no-op: cash changes form, still available
        } else if (t.type === "TRANSFER") {
            if (isSavingsTransfer(t, categoryNameById)) {
                balance -= amount;
            }
        } else if (!t.paidWithCredit) {
            balance -= amount;
        }
    }

    return Math.round(balance * 100) / 100;
}

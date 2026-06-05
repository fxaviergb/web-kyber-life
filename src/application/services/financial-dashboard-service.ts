import { UUID } from "../../domain/core";
import { FinancialTransaction } from "../../domain/entities/financial";
import { IFinancialTransactionRepository, IFinancialCategoryRepository, IFinancialInstitutionRepository, IFinancialScannerTransactionRepository } from "../../domain/repositories/financial";
export interface FinancialKPIs {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    transactionCount: number;
    avgTransactionAmount: number;
    pendingTransactionsCount: number;
    currency: string;
}

export interface CategoryBreakdown {
    categoryId: string | null;
    categoryName: string;
    total: number;
    count: number;
    percentage: number;
    color?: string;
}

export interface InstitutionBreakdown {
    institutionId: string | null;
    institutionName: string;
    total: number;
    count: number;
    percentage: number;
}

export interface DailyBreakdown {
    date: string; // YYYY-MM-DD
    income: number;
    expenses: number;
    net: number;
}

export interface MonthlyBreakdown {
    month: string; // "2026-01", "2026-02", etc.
    income: number;
    expenses: number;
    net: number;
}

export interface TypeBreakdown {
    type: string;
    total: number;
    count: number;
    percentage: number;
}

export class FinancialDashboardService {
    constructor(
        private transactionRepo: IFinancialTransactionRepository,
        private categoryRepo: IFinancialCategoryRepository,
        private institutionRepo: IFinancialInstitutionRepository,
        private scannerRepo?: IFinancialScannerTransactionRepository
    ) {}
    async getKPIs(userId: UUID, startDate?: Date, endDate?: Date): Promise<FinancialKPIs> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions, startDate, endDate);
        let pendingCount = 0;
        if (this.scannerRepo) {
            let pendingScannerTxs = await this.scannerRepo.findUnprocessedByOwnerId(userId);
            if (startDate || endDate) {
                pendingScannerTxs = pendingScannerTxs.filter(t => {
                    if (!t.date) return true;
                    const tDate = new Date(t.date);
                    if (startDate && tDate < startDate) return false;
                    if (endDate && tDate > endDate) return false;
                    return true;
                });
            }
            pendingCount = pendingScannerTxs.length;
        } else {
            let pending = this.filterPending(transactions);
            if (startDate || endDate) {
                pending = pending.filter(t => {
                    const tDate = new Date(t.date);
                    if (startDate && tDate < startDate) return false;
                    if (endDate && tDate > endDate) return false;
                    return true;
                });
            }
            pendingCount = pending.length;
        }

        const totalIncome = confirmed
            .filter(t => this.isIncomeType(t.type))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpenses = confirmed
            .filter(t => !this.isIncomeType(t.type))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const netBalance = totalIncome - totalExpenses;
        const transactionCount = confirmed.length;
        const avgTransactionAmount = transactionCount > 0
            ? (totalIncome + totalExpenses) / transactionCount
            : 0;

        return {
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpenses: Math.round(totalExpenses * 100) / 100,
            netBalance: Math.round(netBalance * 100) / 100,
            transactionCount,
            avgTransactionAmount: Math.round(avgTransactionAmount * 100) / 100,
            pendingTransactionsCount: pendingCount,
            currency: "USD",
        };
    }

    async getMonthlyBreakdown(userId: UUID, monthsBack: number = 6, startDate?: Date, endDate?: Date): Promise<MonthlyBreakdown[]> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions, startDate, endDate);

        const months: MonthlyBreakdown[] = [];

        // If a specific date range is provided and it spans multiple months,
        // we'll group by month within the range, instead of just counting `monthsBack` from now.
        if (startDate && endDate) {
            // Find start and end months
            const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            
            const currentMonthIter = new Date(startMonth);
            while (currentMonthIter <= endMonth) {
                const monthKey = `${currentMonthIter.getFullYear()}-${String(currentMonthIter.getMonth() + 1).padStart(2, "0")}`;
                const mYear = currentMonthIter.getFullYear();
                const mMonth = currentMonthIter.getMonth();
                
                const monthTransactions = confirmed.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getFullYear() === mYear && tDate.getMonth() === mMonth;
                });

                const income = monthTransactions
                    .filter(t => this.isIncomeType(t.type))
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                const expenses = monthTransactions
                    .filter(t => !this.isIncomeType(t.type))
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                months.push({
                    month: monthKey,
                    income: Math.round(income * 100) / 100,
                    expenses: Math.round(expenses * 100) / 100,
                    net: Math.round((income - expenses) * 100) / 100,
                });
                
                currentMonthIter.setMonth(currentMonthIter.getMonth() + 1);
            }
        } else {
            const now = new Date();
            for (let i = monthsBack - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

                const monthTransactions = confirmed.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getFullYear() === d.getFullYear() && tDate.getMonth() === d.getMonth();
                });

                const income = monthTransactions
                    .filter(t => this.isIncomeType(t.type))
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                const expenses = monthTransactions
                    .filter(t => !this.isIncomeType(t.type))
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                months.push({
                    month: monthKey,
                    income: Math.round(income * 100) / 100,
                    expenses: Math.round(expenses * 100) / 100,
                    net: Math.round((income - expenses) * 100) / 100,
                });
            }
        }

        return months;
    }

    async getTypeBreakdown(userId: UUID, startDate?: Date, endDate?: Date): Promise<TypeBreakdown[]> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions, startDate, endDate);

        const groups: Record<string, { total: number; count: number }> = {};
        let grandTotal = 0;

        for (const t of confirmed) {
            const type = t.type;
            if (!groups[type]) {
                groups[type] = { total: 0, count: 0 };
            }
            groups[type].total += Number(t.amount);
            groups[type].count += 1;
            grandTotal += Number(t.amount);
        }

        return Object.entries(groups)
            .map(([type, data]) => ({
                type,
                total: Math.round(data.total * 100) / 100,
                count: data.count,
                percentage: grandTotal > 0
                    ? Math.round((data.total / grandTotal) * 10000) / 100
                    : 0,
            }))
            .sort((a, b) => b.total - a.total);
    }

    async getCategoryBreakdown(userId: UUID, startDate?: Date, endDate?: Date): Promise<CategoryBreakdown[]> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        // Usually, category breakdown makes sense for expenses, but we can include all active
        // Let's filter to expenses to be more useful, or return all grouped.
        // We'll group expenses.
        const confirmed = this.filterActive(transactions, startDate, endDate).filter(t => !this.isIncomeType(t.type));
        const categories = await this.categoryRepo.findAllBaseAndUser(userId);
        const catMap = new Map(categories.map(c => [c.id, c]));

        const groups: Record<string, { total: number; count: number }> = {};
        let grandTotal = 0;

        for (const t of confirmed) {
            const catId = t.categoryId || "UNCATEGORIZED";
            if (!groups[catId]) {
                groups[catId] = { total: 0, count: 0 };
            }
            groups[catId].total += Number(t.amount);
            groups[catId].count += 1;
            grandTotal += Number(t.amount);
        }

        return Object.entries(groups)
            .map(([catId, data]) => {
                const category = catId !== "UNCATEGORIZED" ? catMap.get(catId) : null;
                return {
                    categoryId: catId === "UNCATEGORIZED" ? null : catId,
                    categoryName: category?.name || "Sin categoría",
                    total: Math.round(data.total * 100) / 100,
                    count: data.count,
                    percentage: grandTotal > 0
                        ? Math.round((data.total / grandTotal) * 10000) / 100
                        : 0,
                    color: category?.color || undefined,
                };
            })
            .sort((a, b) => b.total - a.total);
    }

    async getInstitutionBreakdown(userId: UUID, startDate?: Date, endDate?: Date): Promise<InstitutionBreakdown[]> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        // Only active transactions, generally expenses and income. We use absolute amounts for total volume?
        // Or we group expenses? Let's group all transaction counts/amounts as volume.
        const confirmed = this.filterActive(transactions, startDate, endDate);
        const institutions = await this.institutionRepo.findByOwnerId(userId);
        const instMap = new Map(institutions.map(i => [i.id, i]));

        const groups: Record<string, { total: number; count: number }> = {};
        let grandTotal = 0;

        for (const t of confirmed) {
            const instId = t.institutionId || "UNKNOWN";
            if (!groups[instId]) {
                groups[instId] = { total: 0, count: 0 };
            }
            // Use absolute amount for institution volume
            const absAmount = Math.abs(Number(t.amount));
            groups[instId].total += absAmount;
            groups[instId].count += 1;
            grandTotal += absAmount;
        }

        return Object.entries(groups)
            .map(([instId, data]) => {
                const institution = instId !== "UNKNOWN" ? instMap.get(instId) : null;
                return {
                    institutionId: instId === "UNKNOWN" ? null : instId,
                    institutionName: institution?.name || "Unknown",
                    total: Math.round(data.total * 100) / 100,
                    count: data.count,
                    percentage: grandTotal > 0
                        ? Math.round((data.total / grandTotal) * 10000) / 100
                        : 0,
                };
            })
            .sort((a, b) => b.total - a.total);
    }

    async getDailyBreakdown(userId: UUID, startDate?: Date, endDate?: Date): Promise<DailyBreakdown[]> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions, startDate, endDate);

        const groups: Record<string, DailyBreakdown> = {};

        for (const t of confirmed) {
            // Take just YYYY-MM-DD
            const dateStr = t.date.split("T")[0];
            if (!groups[dateStr]) {
                groups[dateStr] = { date: dateStr, income: 0, expenses: 0, net: 0 };
            }
            const amount = Number(t.amount);
            if (this.isIncomeType(t.type)) {
                groups[dateStr].income += amount;
                groups[dateStr].net += amount;
            } else {
                groups[dateStr].expenses += amount;
                groups[dateStr].net -= amount;
            }
        }

        return Object.values(groups)
            .map(d => ({
                date: d.date,
                income: Math.round(d.income * 100) / 100,
                expenses: Math.round(d.expenses * 100) / 100,
                net: Math.round(d.net * 100) / 100,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically
    }


    async getRecentTransactions(userId: UUID, limit: number = 5, startDate?: Date, endDate?: Date): Promise<FinancialTransaction[]> {
        let transactions = await this.transactionRepo.findRecent(userId, 1000); // Fetch a larger batch to filter
        
        if (startDate || endDate) {
            transactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                if (startDate && tDate < startDate) return false;
                if (endDate && tDate > endDate) return false;
                return true;
            });
        }
        
        return transactions.slice(0, limit);
    }

    private filterActive(transactions: FinancialTransaction[], startDate?: Date, endDate?: Date): FinancialTransaction[] {
        return transactions.filter(t => {
            if (t.status !== "CONFIRMED" && t.status !== "REVIEWED" && t.status !== "MANUAL") {
                return false;
            }
            if (startDate || endDate) {
                const tDate = new Date(t.date);
                // Zero out time components for consistent date-only comparison if needed,
                // but since tDate is parsed from DB (usually midnight UTC if date only),
                // we should just compare them. Assuming startDate/endDate are startOfDay/endOfDay.
                if (startDate && tDate < startDate) return false;
                if (endDate && tDate > endDate) return false;
            }
            return true;
        });
    }

    private filterPending(transactions: FinancialTransaction[]): FinancialTransaction[] {
        return transactions.filter(t => t.status === "DETECTED");
    }

    private isIncomeType(type: string): boolean {
        return type === "INCOME" || type === "DEPOSIT" || type === "REFUND";
    }
}

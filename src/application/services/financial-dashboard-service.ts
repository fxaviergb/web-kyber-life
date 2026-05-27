import { UUID } from "../../domain/core";
import { FinancialTransaction } from "../../domain/entities/financial";
import { IFinancialTransactionRepository } from "../../domain/repositories/financial";

export interface FinancialKPIs {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    transactionCount: number;
    avgTransactionAmount: number;
    currency: string;
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
        private transactionRepo: IFinancialTransactionRepository
    ) {}

    async getKPIs(userId: UUID, startDate?: Date, endDate?: Date): Promise<FinancialKPIs> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions, startDate, endDate);

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
            if (t.status === "REJECTED" || t.status === "DELETED" || t.status === "DUPLICATE") {
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

    private isIncomeType(type: string): boolean {
        return type === "INCOME" || type === "DEPOSIT" || type === "REFUND";
    }
}

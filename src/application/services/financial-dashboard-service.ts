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

    async getKPIs(userId: UUID): Promise<FinancialKPIs> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions);

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

    async getMonthlyBreakdown(userId: UUID, monthsBack: number = 6): Promise<MonthlyBreakdown[]> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions);

        const now = new Date();
        const months: MonthlyBreakdown[] = [];

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

        return months;
    }

    async getTypeBreakdown(userId: UUID): Promise<TypeBreakdown[]> {
        const transactions = await this.transactionRepo.findByOwnerId(userId);
        const confirmed = this.filterActive(transactions);

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

    async getRecentTransactions(userId: UUID, limit: number = 5): Promise<FinancialTransaction[]> {
        return this.transactionRepo.findRecent(userId, limit);
    }

    private filterActive(transactions: FinancialTransaction[]): FinancialTransaction[] {
        return transactions.filter(t =>
            t.status !== "REJECTED" && t.status !== "DELETED" && t.status !== "DUPLICATE"
        );
    }

    private isIncomeType(type: string): boolean {
        return type === "INCOME" || type === "DEPOSIT" || type === "REFUND";
    }
}

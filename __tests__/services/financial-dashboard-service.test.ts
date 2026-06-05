import { FinancialDashboardService } from "@/application/services/financial-dashboard-service";
import { FinancialTransaction, FinancialCategory, FinancialInstitution } from "@/domain/entities/financial";
import { IFinancialTransactionRepository, IFinancialCategoryRepository, IFinancialInstitutionRepository } from "@/domain/repositories/financial";

describe("FinancialDashboardService", () => {
    let transactionRepo: jest.Mocked<IFinancialTransactionRepository>;
    let categoryRepo: jest.Mocked<IFinancialCategoryRepository>;
    let institutionRepo: jest.Mocked<IFinancialInstitutionRepository>;
    let service: FinancialDashboardService;

    const mockUserId = "user-123";

    const baseTransaction: Omit<FinancialTransaction, "id"> = {
        ownerUserId: mockUserId,
        amount: 100,
        currency: "USD",
        date: "2026-05-15T10:00:00Z",
        type: "EXPENSE",
        status: "CONFIRMED",
        categoryId: null,
        institutionId: null,
        accountId: null,
        merchant: "Test Merchant",
        notes: "Test Description",
        possibleDuplicate: false,
        isDeleted: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    beforeEach(() => {
        transactionRepo = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findByOwnerId: jest.fn(),
            findByFingerprint: jest.fn(),
            findRecent: jest.fn(),
            findPaginated: jest.fn(),
        } as any;

        categoryRepo = {
            findAllBaseAndUser: jest.fn(),
        } as any;

        institutionRepo = {
            findByOwnerId: jest.fn(),
        } as any;

        service = new FinancialDashboardService(transactionRepo, categoryRepo, institutionRepo);
    });

    describe("getKPIs", () => {
        it("should calculate KPIs correctly from transactions", async () => {
            const transactions: FinancialTransaction[] = [
                { ...baseTransaction, id: "1", type: "INCOME", amount: 1000, status: "CONFIRMED" },
                { ...baseTransaction, id: "2", type: "EXPENSE", amount: 300, status: "CONFIRMED" },
                { ...baseTransaction, id: "3", type: "EXPENSE", amount: 200, status: "CONFIRMED" },
                { ...baseTransaction, id: "4", type: "EXPENSE", amount: 50, status: "DETECTED" }, // Pending
                { ...baseTransaction, id: "5", type: "INCOME", amount: 100, status: "REJECTED" }, // Ignored
            ];
            transactionRepo.findByOwnerId.mockResolvedValue(transactions);

            const kpis = await service.getKPIs(mockUserId);

            expect(kpis.totalIncome).toBe(1000);
            expect(kpis.totalExpenses).toBe(500);
            expect(kpis.netBalance).toBe(500);
            expect(kpis.transactionCount).toBe(3); // Only active (CONFIRMED)
            expect(kpis.avgTransactionAmount).toBe(500); // 1500 / 3
            expect(kpis.pendingTransactionsCount).toBe(1); // Only DETECTED
        });

        it("should respect date filters when calculating KPIs", async () => {
            const transactions: FinancialTransaction[] = [
                { ...baseTransaction, id: "1", type: "INCOME", amount: 1000, date: "2026-05-15T10:00:00Z", status: "CONFIRMED" },
                { ...baseTransaction, id: "2", type: "EXPENSE", amount: 300, date: "2026-04-15T10:00:00Z", status: "CONFIRMED" },
            ];
            transactionRepo.findByOwnerId.mockResolvedValue(transactions);

            const startDate = new Date("2026-05-01T00:00:00Z");
            const endDate = new Date("2026-05-31T23:59:59Z");

            const kpis = await service.getKPIs(mockUserId, startDate, endDate);

            expect(kpis.totalIncome).toBe(1000);
            expect(kpis.totalExpenses).toBe(0); // April transaction filtered out
            expect(kpis.transactionCount).toBe(1);
        });
    });

    describe("getMonthlyBreakdown", () => {
        it("should correctly group transactions by month", async () => {
            const transactions: FinancialTransaction[] = [
                { ...baseTransaction, id: "1", type: "INCOME", amount: 1000, date: "2026-05-15T10:00:00Z" },
                { ...baseTransaction, id: "2", type: "EXPENSE", amount: 300, date: "2026-05-10T10:00:00Z" },
                { ...baseTransaction, id: "3", type: "EXPENSE", amount: 200, date: "2026-04-15T10:00:00Z" },
            ];
            transactionRepo.findByOwnerId.mockResolvedValue(transactions);

            // Use fixed date range (midday UTC to avoid timezone shifts)
            const startDate = new Date("2026-04-01T12:00:00Z");
            const endDate = new Date("2026-05-31T12:00:00Z");

            const breakdown = await service.getMonthlyBreakdown(mockUserId, 6, startDate, endDate);

            expect(breakdown).toHaveLength(2); // Apr and May

            const may = breakdown.find(m => m.month === "2026-05");
            expect(may).toBeDefined();
            expect(may!.income).toBe(1000);
            expect(may!.expenses).toBe(300);
            expect(may!.net).toBe(700);

            const apr = breakdown.find(m => m.month === "2026-04");
            expect(apr).toBeDefined();
            expect(apr!.income).toBe(0);
            expect(apr!.expenses).toBe(200);
            expect(apr!.net).toBe(-200);
        });
    });

    describe("getTypeBreakdown", () => {
        it("should return aggregated amounts by type", async () => {
            const transactions: FinancialTransaction[] = [
                { ...baseTransaction, id: "1", type: "INCOME", amount: 1000 },
                { ...baseTransaction, id: "2", type: "EXPENSE", amount: 300 },
                { ...baseTransaction, id: "3", type: "EXPENSE", amount: 200 },
            ];
            transactionRepo.findByOwnerId.mockResolvedValue(transactions);

            const breakdown = await service.getTypeBreakdown(mockUserId);

            expect(breakdown).toHaveLength(2);
            
            const income = breakdown.find(b => b.type === "INCOME");
            expect(income!.total).toBe(1000);
            expect(income!.count).toBe(1);

            const expense = breakdown.find(b => b.type === "EXPENSE");
            expect(expense!.total).toBe(500);
            expect(expense!.count).toBe(2);
        });
    });

    describe("getCategoryBreakdown", () => {
        it("should return aggregated amounts by category", async () => {
            const transactions: FinancialTransaction[] = [
                { ...baseTransaction, id: "1", type: "EXPENSE", amount: 300, categoryId: "cat-1" },
                { ...baseTransaction, id: "2", type: "EXPENSE", amount: 200, categoryId: "cat-1" },
                { ...baseTransaction, id: "3", type: "EXPENSE", amount: 100, categoryId: null },
            ];
            transactionRepo.findByOwnerId.mockResolvedValue(transactions);
            categoryRepo.findAllBaseAndUser.mockResolvedValue([
                { id: "cat-1", name: "Food", color: "#FF0000", type: "EXPENSE", isBase: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false } as FinancialCategory
            ]);

            const breakdown = await service.getCategoryBreakdown(mockUserId);

            expect(breakdown).toHaveLength(2);
            
            const cat1 = breakdown.find(b => b.categoryId === "cat-1");
            expect(cat1!.total).toBe(500);
            expect(cat1!.categoryName).toBe("Food");
            expect(cat1!.color).toBe("#FF0000");

            const uncat = breakdown.find(b => b.categoryId === null);
            expect(uncat!.total).toBe(100);
            expect(uncat!.categoryName).toBe("Sin categoría");
        });
    });

    describe("getInstitutionBreakdown", () => {
        it("should return aggregated amounts by institution using absolute values", async () => {
            const transactions: FinancialTransaction[] = [
                { ...baseTransaction, id: "1", type: "EXPENSE", amount: 300, institutionId: "inst-1" },
                { ...baseTransaction, id: "2", type: "INCOME", amount: 1000, institutionId: "inst-1" },
                { ...baseTransaction, id: "3", type: "EXPENSE", amount: 100, institutionId: null },
            ];
            transactionRepo.findByOwnerId.mockResolvedValue(transactions);
            institutionRepo.findByOwnerId.mockResolvedValue([
                { id: "inst-1", name: "Bank A", ownerUserId: mockUserId, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false } as FinancialInstitution
            ]);

            const breakdown = await service.getInstitutionBreakdown(mockUserId);

            expect(breakdown).toHaveLength(2);
            
            const inst1 = breakdown.find(b => b.institutionId === "inst-1");
            expect(inst1!.total).toBe(1300); // 300 + 1000 (absolute sum)
            expect(inst1!.institutionName).toBe("Bank A");

            const uninst = breakdown.find(b => b.institutionId === null);
            expect(uninst!.total).toBe(100);
            expect(uninst!.institutionName).toBe("Unknown");
        });
    });

    describe("getDailyBreakdown", () => {
        it("should aggregate by daily net changes", async () => {
            const transactions: FinancialTransaction[] = [
                { ...baseTransaction, id: "1", type: "INCOME", amount: 1000, date: "2026-05-15T10:00:00Z" },
                { ...baseTransaction, id: "2", type: "EXPENSE", amount: 300, date: "2026-05-15T15:00:00Z" },
                { ...baseTransaction, id: "3", type: "EXPENSE", amount: 200, date: "2026-05-16T10:00:00Z" },
            ];
            transactionRepo.findByOwnerId.mockResolvedValue(transactions);

            const breakdown = await service.getDailyBreakdown(mockUserId);

            expect(breakdown).toHaveLength(2);
            
            const day15 = breakdown.find(b => b.date === "2026-05-15");
            expect(day15!.income).toBe(1000);
            expect(day15!.expenses).toBe(300);
            expect(day15!.net).toBe(700);

            const day16 = breakdown.find(b => b.date === "2026-05-16");
            expect(day16!.income).toBe(0);
            expect(day16!.expenses).toBe(200);
            expect(day16!.net).toBe(-200);
        });
    });
});


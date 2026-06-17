import { FinancialTransactionService, CreateFinancialTransactionDTO } from "@/application/services/financial-transaction-service";
import { FinancialTransaction } from "@/domain/entities/financial";
import { v4 as uuidv4 } from "uuid";

describe("FinancialTransactionService", () => {
    let transactionRepoMock: any;
    let auditLogRepoMock: any;
    let service: FinancialTransactionService;

    const mockUserId = uuidv4();
    const mockTransactionId = uuidv4();

    beforeEach(() => {
        // We need to mock crypto.randomUUID
        if (!global.crypto) {
            (global as any).crypto = {
                randomUUID: () => uuidv4()
            };
        }

        transactionRepoMock = {
            findByOwnerId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            delete: jest.fn(),
            getUniqueTags: jest.fn(),
            findPaginated: jest.fn(),
        };

        auditLogRepoMock = {
            create: jest.fn(),
            findByTransactionId: jest.fn(),
        };

        service = new FinancialTransactionService(transactionRepoMock, auditLogRepoMock);
    });

    describe("createTransaction", () => {
        it("should create a new transaction and write an audit log", async () => {
            transactionRepoMock.findByOwnerId.mockResolvedValue([]);
            transactionRepoMock.create.mockImplementation(async (tx: any) => tx);
            auditLogRepoMock.create.mockResolvedValue({} as any);

            const dto: CreateFinancialTransactionDTO = {
                ownerUserId: mockUserId,
                type: "EXPENSE",
                amount: 100,
                currency: "USD",
                date: "2026-05-18T10:00:00Z",
                merchant: "Test",
                description: "Test description",
            };

            const result = await service.createTransaction(dto);

            expect(result).toBeDefined();
            expect(result.ownerUserId).toBe(mockUserId);
            expect(result.possibleDuplicate).toBe(false);
            expect(transactionRepoMock.create).toHaveBeenCalled();
            expect(auditLogRepoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: "CREATED",
                    changedByUserId: mockUserId
                })
            );
        });

        it("should default merchant to the institution name when no merchant is provided", async () => {
            transactionRepoMock.findByOwnerId.mockResolvedValue([]);
            transactionRepoMock.create.mockImplementation(async (tx: any) => tx);
            auditLogRepoMock.create.mockResolvedValue({} as any);

            const dto: CreateFinancialTransactionDTO = {
                ownerUserId: mockUserId,
                type: "EXPENSE",
                amount: 4.49,
                currency: "USD",
                date: "2026-06-17T10:00:00Z",
                institutionName: "El Asadero Medio Ejido",
                description: "Compra de merienda",
            };

            const result = await service.createTransaction(dto);

            expect(result.merchant).toBe("El Asadero Medio Ejido");
        });

        it("should keep an explicit merchant over the institution name", async () => {
            transactionRepoMock.findByOwnerId.mockResolvedValue([]);
            transactionRepoMock.create.mockImplementation(async (tx: any) => tx);
            auditLogRepoMock.create.mockResolvedValue({} as any);

            const dto: CreateFinancialTransactionDTO = {
                ownerUserId: mockUserId,
                type: "EXPENSE",
                amount: 10,
                currency: "USD",
                date: "2026-06-17T10:00:00Z",
                merchant: "Amazon",
                institutionName: "Visa",
                description: "Compra",
            };

            const result = await service.createTransaction(dto);

            expect(result.merchant).toBe("Amazon");
        });

        it("should mark as possible duplicate if a matching transaction exists", async () => {
            const existingTx = {
                id: uuidv4(),
                ownerUserId: mockUserId,
                type: "EXPENSE",
                status: "DETECTED",
                amount: 100,
                currency: "USD",
                date: "2026-05-18T12:00:00Z", // Same day
                merchant: "test", // Case insensitive match
            };
            transactionRepoMock.findByOwnerId.mockResolvedValue([existingTx]);
            transactionRepoMock.create.mockImplementation(async (tx: any) => tx);
            auditLogRepoMock.create.mockResolvedValue({} as any);

            const dto: CreateFinancialTransactionDTO = {
                ownerUserId: mockUserId,
                type: "EXPENSE",
                amount: 100, // Same amount
                currency: "USD",
                date: "2026-05-18T10:00:00Z", // Same day
                merchant: "Test", 
                description: "Test description",
            };

            const result = await service.createTransaction(dto);

            expect(result.possibleDuplicate).toBe(true);
            expect(auditLogRepoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: "CREATED_WITH_DUPLICATE_FLAG"
                })
            );
        });
    });

    describe("institution enrichment", () => {
        it("resolves institutionName from institutionId, prioritised over the stored merchant", async () => {
            const institutionRepoMock = {
                findByOwnerId: jest.fn().mockResolvedValue([
                    { id: "inst-1", ownerUserId: mockUserId, name: "El Asadero Medio Ejido", isDeleted: false },
                ]),
            };
            const categoryRepoMock = {
                findAllBaseAndUser: jest.fn().mockResolvedValue([]),
            };
            const enrichingService = new FinancialTransactionService(
                transactionRepoMock,
                auditLogRepoMock,
                institutionRepoMock as any,
                undefined,
                categoryRepoMock as any,
            );

            transactionRepoMock.findById.mockResolvedValue({
                id: mockTransactionId,
                ownerUserId: mockUserId,
                type: "EXPENSE",
                status: "MANUAL",
                amount: 4.49,
                currency: "USD",
                date: "2026-06-17T10:00:00Z",
                merchant: "stale-merchant",
                institutionId: "inst-1",
                categoryId: null,
            });

            const result = await enrichingService.getTransactionById(mockTransactionId);

            expect(result?.institutionName).toBe("El Asadero Medio Ejido");
        });
    });

    describe("updateTransaction", () => {
        it("should update a transaction and log it", async () => {
            const existingTx = {
                id: mockTransactionId,
                ownerUserId: mockUserId,
                type: "EXPENSE",
                amount: 100,
            };
            transactionRepoMock.findById.mockResolvedValue(existingTx);
            transactionRepoMock.update.mockImplementation(async (tx: any) => tx);

            const result = await service.updateTransaction(mockTransactionId, mockUserId, { amount: 200 });

            expect(result.amount).toBe(200);
            expect(transactionRepoMock.update).toHaveBeenCalled();
            expect(auditLogRepoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: "UPDATED"
                })
            );
        });

        it("should throw if the transaction does not exist or doesn't belong to the user", async () => {
            transactionRepoMock.findById.mockResolvedValue(null);

            await expect(service.updateTransaction(mockTransactionId, mockUserId, { amount: 200 }))
                .rejects.toThrow("Transaction not found or unauthorized");
        });
    });

    describe("workflow transitions", () => {
        const createTxInState = (status: string) => ({
            id: mockTransactionId,
            ownerUserId: mockUserId,
            status,
            type: "EXPENSE",
        });

        beforeEach(() => {
            transactionRepoMock.update.mockImplementation(async (tx: any) => tx);
        });

        it("should review a transaction", async () => {
            transactionRepoMock.findById.mockResolvedValue(createTxInState("DETECTED"));
            const result = await service.reviewTransaction(mockTransactionId, mockUserId);
            expect(result.status).toBe("REVIEWED");
        });

        it("should throw an error on invalid transition", async () => {
            // DELETED cannot go to REVIEWED
            transactionRepoMock.findById.mockResolvedValue(createTxInState("DELETED"));
            await expect(service.reviewTransaction(mockTransactionId, mockUserId))
                .rejects.toThrow(/Invalid transition/);
        });

        it("should skip update if already in target state", async () => {
            transactionRepoMock.findById.mockResolvedValue(createTxInState("REVIEWED"));
            const result = await service.reviewTransaction(mockTransactionId, mockUserId);
            expect(result.status).toBe("REVIEWED");
            expect(transactionRepoMock.update).not.toHaveBeenCalled();
        });
    });

    describe("bulk operations", () => {
        it("should bulk confirm transactions", async () => {
            const tx1 = { id: uuidv4(), ownerUserId: mockUserId, status: "DETECTED" };
            const tx2 = { id: uuidv4(), ownerUserId: mockUserId, status: "REVIEWED" };
            
            transactionRepoMock.findById.mockImplementation((id: string) => {
                if (id === tx1.id) return Promise.resolve(tx1);
                if (id === tx2.id) return Promise.resolve(tx2);
                return Promise.resolve(null);
            });
            transactionRepoMock.update.mockImplementation(async (tx: any) => tx);

            const result = await service.bulkConfirmTransactions([tx1.id, tx2.id], mockUserId);
            
            expect(result.length).toBe(2);
            expect(result[0].status).toBe("CONFIRMED");
            expect(result[1].status).toBe("CONFIRMED");
            expect(transactionRepoMock.update).toHaveBeenCalledTimes(2);
        });
    });
});


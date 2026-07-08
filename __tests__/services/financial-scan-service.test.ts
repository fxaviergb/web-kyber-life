import { FinancialScanService, StartScanDTO } from "@/application/services/financial-scan-service";
import { FinancialScanExecution } from "@/domain/entities/financial";
import { v4 as uuidv4 } from "uuid";

describe("FinancialScanService", () => {
    let scanRepoMock: any;
    let service: FinancialScanService;

    const mockUserId = uuidv4();
    const mockScanId = uuidv4();

    beforeEach(() => {
        if (!global.crypto) {
            (global as any).crypto = {
                randomUUID: () => uuidv4()
            };
        }

        scanRepoMock = {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findLatestBySource: jest.fn(),
        };

        service = new FinancialScanService(scanRepoMock);
    });

    describe("startScan", () => {
        it("should create a new scan execution with PROCESSING status", async () => {
            scanRepoMock.create.mockImplementation(async (scan: any) => scan);

            const dto: StartScanDTO = {
                ownerUserId: mockUserId,
                source: "GMAIL_N8N",
            };

            const result = await service.startScan(dto);

            expect(result).toBeDefined();
            expect(result.ownerUserId).toBe(mockUserId);
            expect(result.source).toBe("GMAIL_N8N");
            expect(result.status).toBe("PROCESSING");
            expect(result.startedAt).toBeDefined();
            expect(scanRepoMock.create).toHaveBeenCalled();
        });
    });

    describe("updateScanStatus", () => {
        it("should update status and correctly set completedAt when status is COMPLETED", async () => {
            const existingScan: FinancialScanExecution = {
                id: mockScanId,
                ownerUserId: mockUserId,
                status: "PROCESSING",
                source: "GMAIL_N8N",
                startedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false,
            };

            scanRepoMock.findById.mockResolvedValue(existingScan);
            scanRepoMock.update.mockImplementation(async (scan: any) => scan);

            const stats = { parsed: 5, total: 5 };
            const result = await service.updateScanStatus(mockScanId, "COMPLETED", stats);

            expect(result.status).toBe("COMPLETED");
            expect(result.stats).toEqual(stats);
            expect(result.completedAt).toBeDefined();
            expect(scanRepoMock.update).toHaveBeenCalled();
        });

        it("should update status and add errorDetails when status is FAILED", async () => {
            const existingScan: FinancialScanExecution = {
                id: mockScanId,
                ownerUserId: mockUserId,
                status: "PROCESSING",
                source: "GMAIL_N8N",
                startedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false,
            };

            scanRepoMock.findById.mockResolvedValue(existingScan);
            scanRepoMock.update.mockImplementation(async (scan: any) => scan);

            const result = await service.updateScanStatus(mockScanId, "FAILED", undefined, "Authentication failed");

            expect(result.status).toBe("FAILED");
            expect(result.errorDetails).toBe("Authentication failed");
            expect(result.completedAt).toBeDefined();
            expect(scanRepoMock.update).toHaveBeenCalled();
        });

        it("should throw an error if scan execution is not found", async () => {
            scanRepoMock.findById.mockResolvedValue(null);

            await expect(service.updateScanStatus(mockScanId, "COMPLETED")).rejects.toThrow("Scan execution not found");
        });
    });

    describe("getLatestScan", () => {
        it("should return the latest scan execution for the given user and source", async () => {
            const mockScan = { id: mockScanId, status: "COMPLETED" };
            scanRepoMock.findLatestBySource.mockResolvedValue(mockScan);

            const result = await service.getLatestScan(mockUserId, "GMAIL_N8N");

            expect(result).toBe(mockScan);
            expect(scanRepoMock.findLatestBySource).toHaveBeenCalledWith(mockUserId, "GMAIL_N8N");
        });
    });
});

import { UUID } from "../../domain/core";
import { FinancialScanExecution, FinancialScanStatus } from "../../domain/entities/financial";
import { IFinancialScanExecutionRepository } from "../../domain/repositories/financial";

export interface StartScanDTO {
    ownerUserId: UUID;
    source: string;
}

export class FinancialScanService {
    constructor(
        private scanRepo: IFinancialScanExecutionRepository
    ) {}

    async startScan(dto: StartScanDTO): Promise<FinancialScanExecution> {
        const execution: FinancialScanExecution = {
            id: crypto.randomUUID(),
            ownerUserId: dto.ownerUserId,
            status: 'PROCESSING',
            source: dto.source,
            startedAt: new Date().toISOString(),
        };

        return this.scanRepo.create(execution);
    }

    async updateScanStatus(id: UUID, status: FinancialScanStatus, stats?: Record<string, any>, errorDetails?: string): Promise<FinancialScanExecution> {
        const execution = await this.scanRepo.findById(id);
        if (!execution) {
            throw new Error('Scan execution not found');
        }

        execution.status = status;
        if (stats) execution.stats = stats;
        if (errorDetails) execution.errorDetails = errorDetails;

        if (status === 'COMPLETED' || status === 'FAILED') {
            execution.completedAt = new Date().toISOString();
        }

        return this.scanRepo.update(execution);
    }

    async getLatestScan(userId: UUID, source: string): Promise<FinancialScanExecution | null> {
        return this.scanRepo.findLatestBySource(userId, source);
    }
}

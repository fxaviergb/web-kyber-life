import { AnalyticsService } from "@/application/services/analytics-service";
import { InMemoryPurchaseRepository, InMemoryPriceObservationRepository } from "@/infrastructure/repositories/implementations";
import { v4 as uuidv4 } from "uuid";

describe("AnalyticsService", () => {
    let service: AnalyticsService;
    let purchaseRepo: InMemoryPurchaseRepository;
    let obsRepo: InMemoryPriceObservationRepository;
    const userId = uuidv4();

    beforeEach(() => {
        purchaseRepo = new InMemoryPurchaseRepository();
        obsRepo = new InMemoryPriceObservationRepository();
        service = new AnalyticsService(purchaseRepo, obsRepo);
    });

    it("should calculate monthly average", async () => {
        // Mock data would go here. For now, ensure it returns 0 for empty.
        const avg = await service.getMonthlyAverage(userId);
        expect(avg).toBe(0);
    });
});

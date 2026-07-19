import { PushSubscriptionService } from "@/application/services/push-subscription-service";
import { PushSubscription } from "@/domain/entities/notification";
import { v4 as uuidv4 } from "uuid";

describe("PushSubscriptionService", () => {
    let pushSubscriptionRepoMock: any;
    let service: PushSubscriptionService;

    const mockUserId = uuidv4();
    const mockEndpoint = "https://fcm.googleapis.com/fcm/send/abc123";

    beforeEach(() => {
        if (!global.crypto) {
            (global as any).crypto = { randomUUID: () => uuidv4() };
        }

        pushSubscriptionRepoMock = {
            create: jest.fn(),
            findByEndpoint: jest.fn(),
            findByOwnerId: jest.fn(),
            deleteByEndpoint: jest.fn(),
        };
        service = new PushSubscriptionService(pushSubscriptionRepoMock);
    });

    describe("subscribe", () => {
        it("creates a new subscription with a fresh id when none exists for the endpoint", async () => {
            pushSubscriptionRepoMock.findByEndpoint.mockResolvedValue(null);
            pushSubscriptionRepoMock.create.mockImplementation(async (s: PushSubscription) => s);

            const result = await service.subscribe({
                ownerUserId: mockUserId,
                endpoint: mockEndpoint,
                keys: { p256dh: "p256dh-key", auth: "auth-key" },
                userAgent: "test-agent",
            });

            expect(result.ownerUserId).toBe(mockUserId);
            expect(result.endpoint).toBe(mockEndpoint);
            expect(result.keys).toEqual({ p256dh: "p256dh-key", auth: "auth-key" });
            expect(result.id).toBeDefined();
            expect(pushSubscriptionRepoMock.create).toHaveBeenCalled();
        });

        it("reuses the existing id and createdAt when the endpoint already has a subscription (re-subscribe)", async () => {
            const existing: PushSubscription = {
                id: uuidv4(),
                ownerUserId: mockUserId,
                endpoint: mockEndpoint,
                keys: { p256dh: "old-key", auth: "old-auth" },
                userAgent: "old-agent",
                isDeleted: false,
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
            };
            pushSubscriptionRepoMock.findByEndpoint.mockResolvedValue(existing);
            pushSubscriptionRepoMock.create.mockImplementation(async (s: PushSubscription) => s);

            const result = await service.subscribe({
                ownerUserId: mockUserId,
                endpoint: mockEndpoint,
                keys: { p256dh: "new-key", auth: "new-auth" },
            });

            expect(result.id).toBe(existing.id);
            expect(result.createdAt).toBe(existing.createdAt);
            expect(result.keys).toEqual({ p256dh: "new-key", auth: "new-auth" });
        });
    });

    describe("unsubscribe", () => {
        it("delegates to the repository with endpoint and owner", async () => {
            await service.unsubscribe(mockUserId, mockEndpoint);

            expect(pushSubscriptionRepoMock.deleteByEndpoint).toHaveBeenCalledWith(mockEndpoint, mockUserId);
        });
    });

    describe("listByOwner", () => {
        it("returns subscriptions from the repository", async () => {
            const subs = [{ id: uuidv4() } as PushSubscription];
            pushSubscriptionRepoMock.findByOwnerId.mockResolvedValue(subs);

            const result = await service.listByOwner(mockUserId);

            expect(result).toEqual(subs);
            expect(pushSubscriptionRepoMock.findByOwnerId).toHaveBeenCalledWith(mockUserId);
        });
    });
});

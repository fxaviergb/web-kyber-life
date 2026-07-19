import { IPushSubscriptionRepository } from "@/domain/repositories/notification";
import { PushSubscription } from "@/domain/entities/notification";
import { UUID } from "@/domain/core";

export interface SubscribeToPushDTO {
    ownerUserId: UUID;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
}

export class PushSubscriptionService {
    constructor(private pushSubscriptionRepo: IPushSubscriptionRepository) { }

    async subscribe(dto: SubscribeToPushDTO): Promise<PushSubscription> {
        const existing = await this.pushSubscriptionRepo.findByEndpoint(dto.endpoint);
        const now = new Date().toISOString();

        return this.pushSubscriptionRepo.create({
            id: existing?.id ?? crypto.randomUUID(),
            ownerUserId: dto.ownerUserId,
            endpoint: dto.endpoint,
            keys: dto.keys,
            userAgent: dto.userAgent ?? null,
            isDeleted: false,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        });
    }

    async unsubscribe(userId: UUID, endpoint: string): Promise<void> {
        return this.pushSubscriptionRepo.deleteByEndpoint(endpoint, userId);
    }

    async listByOwner(userId: UUID): Promise<PushSubscription[]> {
        return this.pushSubscriptionRepo.findByOwnerId(userId);
    }
}

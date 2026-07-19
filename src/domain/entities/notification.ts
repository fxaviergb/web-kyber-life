import { BaseEntity, UUID, ISODate } from "../core";

export type NotificationType = 'SCAN_COMPLETED' | 'SCAN_FAILED';

export interface Notification extends BaseEntity {
    ownerUserId: UUID;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: UUID | null;
    isRead: boolean;
    readAt?: ISODate | null;
}

export interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
}

export interface PushSubscription extends BaseEntity {
    ownerUserId: UUID;
    endpoint: string;
    keys: PushSubscriptionKeys;
    userAgent?: string | null;
}

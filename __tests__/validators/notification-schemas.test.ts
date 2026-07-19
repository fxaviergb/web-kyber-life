import {
    listNotificationsSchema,
    markNotificationReadSchema,
    subscribeToPushSchema,
    unsubscribeFromPushSchema,
} from "@/lib/validators/notification-schemas";
import { v4 as uuidv4 } from "uuid";

describe("notification-schemas", () => {
    describe("listNotificationsSchema", () => {
        it("accepts a valid limit", () => {
            expect(listNotificationsSchema.safeParse({ limit: 10 }).success).toBe(true);
        });

        it("accepts an omitted limit", () => {
            expect(listNotificationsSchema.safeParse({}).success).toBe(true);
        });

        it("rejects a limit above 100", () => {
            expect(listNotificationsSchema.safeParse({ limit: 101 }).success).toBe(false);
        });

        it("rejects a non-positive limit", () => {
            expect(listNotificationsSchema.safeParse({ limit: 0 }).success).toBe(false);
        });
    });

    describe("markNotificationReadSchema", () => {
        it("accepts a valid UUID", () => {
            expect(markNotificationReadSchema.safeParse({ id: uuidv4() }).success).toBe(true);
        });

        it("rejects a non-UUID id", () => {
            expect(markNotificationReadSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
        });
    });

    describe("subscribeToPushSchema", () => {
        const validPayload = {
            endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
            keys: { p256dh: "p256dh-key", auth: "auth-key" },
        };

        it("accepts a valid subscription payload", () => {
            expect(subscribeToPushSchema.safeParse(validPayload).success).toBe(true);
        });

        it("accepts an optional userAgent", () => {
            expect(subscribeToPushSchema.safeParse({ ...validPayload, userAgent: "Mozilla/5.0" }).success).toBe(true);
        });

        it("rejects a non-URL endpoint", () => {
            expect(subscribeToPushSchema.safeParse({ ...validPayload, endpoint: "not-a-url" }).success).toBe(false);
        });

        it("rejects missing keys", () => {
            expect(subscribeToPushSchema.safeParse({ endpoint: validPayload.endpoint }).success).toBe(false);
        });

        it("rejects an empty p256dh key", () => {
            expect(
                subscribeToPushSchema.safeParse({ ...validPayload, keys: { p256dh: "", auth: "auth-key" } }).success,
            ).toBe(false);
        });
    });

    describe("unsubscribeFromPushSchema", () => {
        it("accepts a valid endpoint", () => {
            expect(
                unsubscribeFromPushSchema.safeParse({ endpoint: "https://fcm.googleapis.com/fcm/send/abc123" })
                    .success,
            ).toBe(true);
        });

        it("rejects a non-URL endpoint", () => {
            expect(unsubscribeFromPushSchema.safeParse({ endpoint: "not-a-url" }).success).toBe(false);
        });
    });
});

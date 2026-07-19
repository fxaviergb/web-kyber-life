import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createServiceRoleClient } from "@/infrastructure/supabase/service-role";

/**
 * Receives the Supabase Database Webhook fired by
 * trg_notify_on_scanner_execution_change (AFTER INSERT ON notifications).
 * Relays the new notification as a Web Push message to every device the
 * owner has subscribed on. This is the only place that talks to the Push
 * API — the DB trigger cannot call an external HTTP service itself, so
 * Supabase's Database Webhook feature bridges the row insert to this route.
 */
export async function POST(request: NextRequest) {
    const secret = request.headers.get("x-webhook-secret");
    if (!secret || secret !== process.env.NOTIFICATIONS_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
        console.error("Push notifications not configured: missing VAPID env vars");
        return NextResponse.json({ error: "Push not configured" }, { status: 501 });
    }
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const body = await request.json();
    const record = body?.record;
    if (!record?.owner_user_id) {
        return NextResponse.json({ error: "Missing notification record" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("owner_user_id", record.owner_user_id);

    if (error) {
        console.error("Error loading push_subscriptions:", error);
        return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({
        title: record.title,
        body: record.message,
        url: record.entity_type === "scan_execution" ? "/financial/scans" : "/financial",
        notificationId: record.id,
    });

    const results = await Promise.allSettled(
        subscriptions.map((sub) =>
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth_key },
                },
                payload,
            ),
        ),
    );

    const expiredEndpoints = subscriptions
        .filter((sub, i) => {
            const result = results[i];
            return result.status === "rejected" && [404, 410].includes(result.reason?.statusCode);
        })
        .map((sub) => sub.endpoint);

    if (expiredEndpoints.length > 0) {
        await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, expired: expiredEndpoints.length });
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToPushAction, unsubscribeFromPushAction } from "@/app/actions/push-subscriptions";

export type PushSupportState = "unsupported" | "unconfigured" | "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Registers/unregisters this browser's Web Push subscription. No-ops
 * gracefully (state stays "unsupported"/"unconfigured") when Push isn't
 * available or NEXT_PUBLIC_VAPID_PUBLIC_KEY hasn't been set up yet, so the
 * rest of the notification center works regardless of push readiness.
 */
export function usePushSubscription() {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const [state, setState] = useState<PushSupportState>("default");
    const [loading, setLoading] = useState(false);

    const subscribe = useCallback(async () => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
            return;
        }
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setState(permission as PushSupportState);
            if (permission !== "granted") return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
            });
            const json = subscription.toJSON();
            if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

            await subscribeToPushAction({
                endpoint: json.endpoint,
                keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
                userAgent: navigator.userAgent,
            });
        } finally {
            setLoading(false);
        }
    }, [vapidPublicKey]);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
            setState("unsupported");
            return;
        }
        if (!vapidPublicKey) {
            setState("unconfigured");
            return;
        }
        const permission = Notification.permission;
        setState(permission as PushSupportState);

        // Browser permission is per-origin and persists across account
        // switches on the same device, but push_subscriptions.owner_user_id
        // is per-account. When permission is already granted (e.g. a
        // different account subscribed earlier on this device), silently
        // re-sync the subscription to whoever is logged in now — subscribe()
        // is idempotent here (no re-prompt, same endpoint gets upserted), so
        // this just keeps the device pointed at the current account without
        // requiring a manual click.
        if (permission === "granted") {
            subscribe().catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vapidPublicKey]);

    const unsubscribe = useCallback(async () => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (!subscription) return;
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();
            await unsubscribeFromPushAction(endpoint);
        } finally {
            setLoading(false);
        }
    }, []);

    return { state, loading, subscribe, unsubscribe };
}

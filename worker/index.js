// Custom service worker code, bundled into the generated sw.js by
// @ducanh2912/next-pwa (customWorkerSrc). Handles the two events the
// generated Workbox worker doesn't cover: incoming Web Push messages and
// taps on the resulting OS notification.

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: "Kyber Life", body: event.data.text() };
    }

    const title = payload.title || "Kyber Life";
    const options = {
        body: payload.body,
        icon: "/images/logo-kyber-darkbg-192x192.png",
        badge: "/images/logo-kyber-darkbg-192x192.png",
        data: { url: payload.url || "/" },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        }),
    );
});

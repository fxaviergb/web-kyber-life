# KyberLife PWA Documentation

## Overview
KyberLife is configured as a Progressive Web App (PWA) using `@ducanh2912/next-pwa`. It provides:
- **Offline Capability**: Caches static assets (JS, CSS, Images).
- **Standalone**: Launches without browser chrome on mobile.
- **Installable**: Prompts users to install on supported devices.

## 🛠️ Configuration
- **Library**: `@ducanh2912/next-pwa` (Next.js 16 compatible).
- **Manifest**: Generated dynamically via `src/app/manifest.ts`.
- **Service Worker**: Configured in `next.config.ts` (Currently disabled due to build conflict in Next.js 16).

## ⚠️ Notes
- **Service Worker**: The caching layer is currently disabled to ensure stable production builds. The app is installable and has all metadata, but will not work fully offline until the Next.js 16 compatibility patch is applied.
- **Auth**: API calls (`/api`, Supabase) use a `NetworkOnly` or `NetworkFirst` strategy...

### Local Development
1.  Run `npm run build` then `npm start` (PWA features often require production build).
2.  Open Chrome DevTools -> Application -> Service Workers.
3.  Check "Offline" box and reload. You should see the custom "Sin Conexión" page.

### Mobile Testing
1.  Access your local server via IP (e.g. `192.168.1.x:3000`).
2.  **Android**: You should see a prompt "Install KyberLife".
3.  **iOS**: Tap "Share" -> "Add to Home Screen".
4.  Launch from Home Screen. Verify full-screen mode.

## ⚠️ Notes
- **Auth**: API calls (`/api`, Supabase) use a `NetworkOnly` or `NetworkFirst` strategy to ensure security and freshness. Offline actions are currently limited to viewing cached UI.
- **Updates**: The app updates automatically when a new version is deployed. Users may need to close/reopen the app.

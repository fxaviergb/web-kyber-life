/**
 * IndexedDB offline store for financial data.
 *
 * Uses the native IndexedDB API (no external deps) wrapped in promises.
 * Stores dashboard snapshots and recent transactions so the financial
 * module renders instantly even without network access.
 */

const DB_NAME = "kyberlife_financial";
const DB_VERSION = 1;

const STORES = {
    DASHBOARD_KPI: "dashboard_kpi",
    DASHBOARD_MONTHLY: "dashboard_monthly",
    DASHBOARD_TYPE: "dashboard_type",
    TRANSACTIONS: "transactions",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

/** Metadata wrapper stored alongside every cached value. */
interface CacheEntry<T> {
    key: string;
    data: T;
    cachedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            for (const name of Object.values(STORES)) {
                if (!db.objectStoreNames.contains(name)) {
                    db.createObjectStore(name, { keyPath: "key" });
                }
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function putEntry<T>(store: StoreName, key: string, data: T): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        const entry: CacheEntry<T> = { key, data, cachedAt: Date.now() };
        tx.objectStore(store).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getEntry<T>(store: StoreName, key: string): Promise<CacheEntry<T> | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const request = tx.objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
    });
}

async function getAllEntries<T>(store: StoreName): Promise<CacheEntry<T>[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const request = tx.objectStore(store).getAll();
        request.onsuccess = () => resolve(request.result ?? []);
        request.onerror = () => reject(request.error);
    });
}

async function clearStore(store: StoreName): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Checks whether IndexedDB is available in the current environment.
 * Returns `false` on the server and in browsers that block storage.
 */
function isAvailable(): boolean {
    return typeof indexedDB !== "undefined";
}

// ── Public API ─────────────────────────────────────────────────────────

export const financialOfflineStore = {
    /** Dashboard KPI snapshot for a given user. */
    kpi: {
        get: (userId: string) =>
            isAvailable() ? getEntry(STORES.DASHBOARD_KPI, userId).then(e => e?.data ?? null) : Promise.resolve(null),
        set: <T>(userId: string, data: T) =>
            isAvailable() ? putEntry(STORES.DASHBOARD_KPI, userId, data) : Promise.resolve(),
    },

    /** Monthly breakdown cache. */
    monthly: {
        get: (userId: string) =>
            isAvailable() ? getEntry(STORES.DASHBOARD_MONTHLY, userId).then(e => e?.data ?? null) : Promise.resolve(null),
        set: <T>(userId: string, data: T) =>
            isAvailable() ? putEntry(STORES.DASHBOARD_MONTHLY, userId, data) : Promise.resolve(),
    },

    /** Type breakdown cache. */
    typeBreakdown: {
        get: (userId: string) =>
            isAvailable() ? getEntry(STORES.DASHBOARD_TYPE, userId).then(e => e?.data ?? null) : Promise.resolve(null),
        set: <T>(userId: string, data: T) =>
            isAvailable() ? putEntry(STORES.DASHBOARD_TYPE, userId, data) : Promise.resolve(),
    },

    /** Recent transactions for offline viewing. */
    transactions: {
        getAll: () =>
            isAvailable() ? getAllEntries(STORES.TRANSACTIONS).then(entries => entries.map(e => e.data)) : Promise.resolve([]),
        set: <T>(userId: string, data: T) =>
            isAvailable() ? putEntry(STORES.TRANSACTIONS, userId, data) : Promise.resolve(),
        clear: () =>
            isAvailable() ? clearStore(STORES.TRANSACTIONS) : Promise.resolve(),
    },

    /** Cache timestamp for freshness checks. */
    getCacheAge: async (store: StoreName, key: string): Promise<number | null> => {
        if (!isAvailable()) return null;
        const entry = await getEntry(store, key);
        return entry ? Date.now() - entry.cachedAt : null;
    },

    /** Wipe all cached financial data (logout, data reset). */
    clearAll: async () => {
        if (!isAvailable()) return;
        await Promise.all(Object.values(STORES).map(clearStore));
    },
} as const;

/**
 * Shared date-range resolution for dashboard filters.
 *
 * Extracted from FinancialDashboard so the financial dashboard and the main
 * dashboard hub compute the same ISO range for "today / week / month / custom".
 */

export type RangeFilterType = "all" | "today" | "week" | "month" | "custom";

export interface ResolvedRange {
    startDate?: string;
    endDate?: string;
}

/** Format a Date as a local YYYY-MM-DD string (suitable for <input type="date">). */
export function toDateInputValue(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Format a Date as a local `YYYY-MM-DDTHH:mm` string for <input type="datetime-local">.
 * Uses local wall-clock components (NOT toISOString, which is UTC) so the value
 * round-trips correctly: `new Date(value).toISOString()` recovers the right instant.
 */
export function toDateTimeLocalValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Round a Date's minutes to the nearest 5-minute mark. Used to default a
 * datetime-local field with `step={300}` to an already-valid value, so the
 * field isn't born in a step-mismatch state.
 */
export function roundToNearestFiveMinutes(d: Date): Date {
    const rounded = new Date(d);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 5;
    rounded.setMinutes(remainder < 3 ? minutes - remainder : minutes + (5 - remainder));
    rounded.setSeconds(0, 0);
    return rounded;
}

/**
 * A stored transaction `date` is a literal wall-clock value (the DB column holds
 * the time exactly as it should be shown, with no timezone math). Read its UTC
 * components verbatim into a `YYYY-MM-DDTHH:mm` value for <input datetime-local>,
 * so what's stored is what's displayed/edited — independent of the device's zone.
 */
export function isoToWallClockInput(dateStr?: string | null): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/**
 * Inverse of {@link isoToWallClockInput}: persist the exact `YYYY-MM-DDTHH:mm`
 * digits from a datetime-local input (treated as UTC), so an edit round-trip
 * never shifts the stored time.
 */
export function wallClockInputToISO(value?: string | null): string | undefined {
    if (!value) return undefined;
    const normalized = value.length === 16 ? `${value}:00` : value;
    const d = new Date(`${normalized}Z`);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

/**
 * Convert a filter selection into an ISO date range.
 * - "all": no bounds.
 * - "today": start/end of the current day.
 * - "week": Monday of the current week → now.
 * - "month": first day of the current month → now.
 * - "custom": the provided YYYY-MM-DD strings, expanded to full days.
 */
export function computeDateRange(
    filterType: RangeFilterType,
    customStart?: string,
    customEnd?: string,
): ResolvedRange {
    const now = new Date();

    if (filterType === "all") return { startDate: undefined, endDate: undefined };

    if (filterType === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    if (filterType === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    if (filterType === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    if (filterType === "custom") {
        return {
            startDate: customStart ? new Date(customStart + "T00:00:00").toISOString() : undefined,
            endDate: customEnd ? new Date(customEnd + "T23:59:59").toISOString() : undefined,
        };
    }

    return {};
}

/**
 * Default custom range used across every date-range filter: the billing cycle
 * that *contains* the reference date — from the 22nd of one month (00:00) to the
 * 21st of the next (23:59). The cycle only rolls forward once we pass the 21st
 * at 23:59 (i.e. starting on the 22nd):
 *   - day >= 22 → [this month 22, next month 21]
 *   - day <= 21 → [previous month 22, this month 21]
 * (The full-day expansion is applied by computeDateRange for "custom".)
 * Returns YYYY-MM-DD strings for the date inputs.
 */
export function defaultHubCustomRange(reference: Date = new Date()): { start: string; end: string } {
    const anchorMonth = reference.getDate() >= 22 ? reference.getMonth() : reference.getMonth() - 1;
    const start = new Date(reference.getFullYear(), anchorMonth, 22);
    const end = new Date(reference.getFullYear(), anchorMonth + 1, 21);
    return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

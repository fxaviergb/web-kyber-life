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
 * Default custom range for the main dashboard hub:
 * the 21st of the previous month (00:00) → the 22nd of the current month (23:59).
 * Returns YYYY-MM-DD strings for the date inputs.
 */
export function defaultHubCustomRange(reference: Date = new Date()): { start: string; end: string } {
    const start = new Date(reference.getFullYear(), reference.getMonth() - 1, 21);
    const end = new Date(reference.getFullYear(), reference.getMonth(), 22);
    return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

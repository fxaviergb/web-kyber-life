/**
 * Shared date bucketing helpers for time-series charts.
 *
 * Extracted from UnifiedTrendChart so the financial trend and the market
 * spend trend share the exact same day/week/month grouping and label logic.
 */

export type ChartViewMode = "day" | "week" | "month";

export const MONTH_LABELS: Record<string, string> = {
    "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

/** Get the start of the week (Monday) for a given YYYY-MM-DD string. */
export function getStartOfWeek(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    return start.toISOString().split("T")[0];
}

/** Get the month key (YYYY-MM) for a given YYYY-MM-DD string. */
export function getMonthKey(dateStr: string): string {
    return dateStr.substring(0, 7);
}

/** Format a month key (YYYY-MM) as e.g. "Ene 26". */
export function formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split("-");
    return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`;
}

/** Format a YYYY-MM-DD string as e.g. "05 ene". */
export function formatDay(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

/** Format a week start (YYYY-MM-DD) as a "dd - dd mmm" range label. */
export function formatWeek(dateStr: string): string {
    const start = new Date(dateStr + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startStr = start.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    if (start.getMonth() === end.getMonth()) {
        return `${startStr.split(" ")[0]} - ${end.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
    }
    return `${startStr} - ${end.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
}

/** Compact currency formatter used inside charts (no decimals). */
export function formatChartCurrency(value: number): string {
    return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Compact, human-readable currency for chart axes. Keeps small amounts as plain
 * values ($75, $1,200) and only abbreviates once numbers get large ($50k, $1.5M),
 * so users never see confusing fractional-k labels like "$0.075k".
 */
export function formatAxisCurrency(value: number): string {
    if (!value) return "$0";
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    // Strip a trailing ".0" (e.g. 2.0 → "2") while keeping "1.5".
    const trim = (n: number) => `${parseFloat(n.toFixed(1))}`;
    if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}M`;
    if (abs >= 10_000) return `${sign}$${trim(abs / 1_000)}k`;
    return `${sign}$${Math.round(abs).toLocaleString("es-ES")}`;
}

/** Resolve the axis label for a bucket key given the active view mode. */
export function bucketLabel(key: string, viewMode: ChartViewMode): string {
    if (viewMode === "day") return formatDay(key);
    if (viewMode === "week") return formatWeek(key);
    return formatMonth(key);
}

/** Resolve the bucket key (day/week/month) a YYYY-MM-DD date belongs to. */
export function bucketKey(dateStr: string, viewMode: ChartViewMode): string {
    if (viewMode === "week") return getStartOfWeek(dateStr);
    if (viewMode === "month") return getMonthKey(dateStr);
    return dateStr;
}

/**
 * Suggest the most readable default view for a daily dataset based on its span.
 * Biased toward coarser buckets so default views fit without a long horizontal
 * scroll: <= 14 days -> day, <= 70 days -> week, otherwise month.
 */
export function suggestViewMode(firstDate: string, lastDate: string): ChartViewMode {
    const start = new Date(firstDate + "T00:00:00");
    const end = new Date(lastDate + "T00:00:00");
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 14) return "day";
    if (diffDays <= 70) return "week";
    return "month";
}

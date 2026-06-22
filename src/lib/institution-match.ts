/**
 * Fuzzy matching of a scanned merchant string against existing institution names.
 *
 * Comparison is case-insensitive and ignores accents/special characters. Instead
 * of requiring an exact match, it scores similarity with the Sørensen–Dice
 * coefficient over character bigrams and only accepts matches above a threshold,
 * so a loose coincidence never silently replaces the merchant with the wrong
 * institution.
 */

/** Strip diacritics + non-alphanumerics and lowercase, for matching only. */
export function normalizeForMatch(str?: string | null): string {
    if (!str) return "";
    try {
        return str
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase();
    } catch {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    }
}

function bigrams(s: string): string[] {
    const grams: string[] = [];
    for (let i = 0; i < s.length - 1; i++) grams.push(s.slice(i, i + 2));
    return grams;
}

/** Sørensen–Dice coefficient over character bigrams, in [0, 1]. */
function diceCoefficient(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const ga = bigrams(a);
    const gb = bigrams(b);
    const counts = new Map<string, number>();
    for (const g of ga) counts.set(g, (counts.get(g) ?? 0) + 1);
    let intersection = 0;
    for (const g of gb) {
        const c = counts.get(g) ?? 0;
        if (c > 0) {
            intersection++;
            counts.set(g, c - 1);
        }
    }
    return (2 * intersection) / (ga.length + gb.length);
}

/** Normalized similarity in [0, 1] between two raw strings. */
export function institutionSimilarity(a?: string | null, b?: string | null): number {
    const na = normalizeForMatch(a);
    const nb = normalizeForMatch(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    // Substring containment (both reasonably long) is a strong partial signal,
    // e.g. "bancopichincha" ⊃ "pichincha".
    if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) {
        return Math.max(diceCoefficient(na, nb), 0.9);
    }
    return diceCoefficient(na, nb);
}

/** Minimum similarity required to auto-resolve a merchant to an institution. */
export const INSTITUTION_MATCH_THRESHOLD = 0.7;

/** A confident, "verified"-grade identification. */
export const INSTITUTION_MATCH_VERIFIED_THRESHOLD = 0.85;

/** Below this, there is effectively no usable coincidence. */
export const INSTITUTION_MATCH_WARNING_THRESHOLD = 0.5;

/**
 * Best-matching institution for a merchant (highest similarity > 0), regardless
 * of any threshold. Returns null only when there is no candidate at all.
 */
export function bestInstitutionMatch(
    merchant: string | null | undefined,
    institutionNames: string[],
): { name: string; score: number } | null {
    if (!merchant) return null;
    let best: { name: string; score: number } | null = null;
    for (const name of institutionNames) {
        const score = institutionSimilarity(merchant, name);
        if (score > 0 && (!best || score > best.score)) {
            best = { name, score };
        }
    }
    return best;
}

/**
 * Best-matching institution name for a merchant, or null if none clears the
 * threshold. Returns the original institution name (not the normalized form).
 */
export function matchInstitutionName(
    merchant: string | null | undefined,
    institutionNames: string[],
    threshold: number = INSTITUTION_MATCH_THRESHOLD,
): string | null {
    const best = bestInstitutionMatch(merchant, institutionNames);
    return best && best.score >= threshold ? best.name : null;
}

export type InstitutionMatchLevel = "verified" | "warning" | "none";

export interface InstitutionMatchInfo {
    /** "verified" (high confidence), "warning" (partial), "none" (not identified). */
    level: InstitutionMatchLevel;
    /** Best similarity found, 0..1. */
    score: number;
    /** Best candidate institution name, or null when nothing was found. */
    matchedName: string | null;
}

/**
 * Classify how confidently a scanned merchant maps to an existing institution,
 * for the verification badge:
 *   - score >= 0.85 → "verified"
 *   - 0.5 <= score < 0.85 → "warning"
 *   - score < 0.5 (or no candidate) → "none"
 */
export function getInstitutionMatchInfo(
    merchant: string | null | undefined,
    institutionNames: string[],
): InstitutionMatchInfo {
    const best = bestInstitutionMatch(merchant, institutionNames);
    const score = best?.score ?? 0;

    if (!best || score < INSTITUTION_MATCH_WARNING_THRESHOLD) {
        // Not identified — don't surface a name we won't act on.
        return { level: "none", score, matchedName: null };
    }
    if (score >= INSTITUTION_MATCH_VERIFIED_THRESHOLD) {
        return { level: "verified", score, matchedName: best.name };
    }
    return { level: "warning", score, matchedName: best.name };
}

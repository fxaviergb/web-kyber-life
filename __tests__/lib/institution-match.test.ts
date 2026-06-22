import {
    normalizeForMatch,
    institutionSimilarity,
    matchInstitutionName,
    bestInstitutionMatch,
    getInstitutionMatchInfo,
    INSTITUTION_MATCH_THRESHOLD,
} from "@/lib/institution-match";

describe("institution-match", () => {
    describe("normalizeForMatch", () => {
        it("strips accents, special chars and lowercases", () => {
            expect(normalizeForMatch("Banco Pichincha C.A.")).toBe("bancopichinchaca");
            expect(normalizeForMatch("CRÉDITO")).toBe("credito");
            expect(normalizeForMatch("Café & Té")).toBe("cafete");
            expect(normalizeForMatch("  Hola-Mundo_123 ")).toBe("holamundo123");
            expect(normalizeForMatch("Niño")).toBe("nino");
        });

        it("returns empty string for nullish input", () => {
            expect(normalizeForMatch(null)).toBe("");
            expect(normalizeForMatch(undefined)).toBe("");
            expect(normalizeForMatch("")).toBe("");
        });
    });

    describe("institutionSimilarity", () => {
        it("is 1 for identical strings after normalization (case/accent insensitive)", () => {
            expect(institutionSimilarity("Pichincha", "pichincha")).toBe(1);
            expect(institutionSimilarity("Crédito", "Credito")).toBe(1);
            expect(institutionSimilarity("Banco Pichincha", "BANCO  PICHINCHA")).toBe(1);
        });

        it("is high (>= 0.9) when one name contains the other", () => {
            expect(institutionSimilarity("Banco Pichincha", "Pichincha")).toBeGreaterThanOrEqual(0.9);
            expect(institutionSimilarity("Netflix Premium", "Netflix")).toBeGreaterThanOrEqual(0.9);
            expect(institutionSimilarity("Uber", "Uber Eats")).toBeGreaterThanOrEqual(0.9);
        });

        it("is moderate-but-below-threshold for similar-yet-different names", () => {
            const sim = institutionSimilarity("Visa", "Vista");
            expect(sim).toBeGreaterThan(0.3);
            expect(sim).toBeLessThan(INSTITUTION_MATCH_THRESHOLD);
        });

        it("is low for unrelated names", () => {
            expect(institutionSimilarity("Spotify", "Banco Pichincha")).toBeLessThan(0.3);
        });

        it("is 0 when either side is empty", () => {
            expect(institutionSimilarity("", "Pichincha")).toBe(0);
            expect(institutionSimilarity("Pichincha", "")).toBe(0);
            expect(institutionSimilarity(null, "x")).toBe(0);
        });
    });

    describe("matchInstitutionName", () => {
        const institutions = ["Banco Pichincha", "Banco Guayaquil", "BBVA", "Netflix", "Spotify"];

        it("matches exactly, ignoring case and accents", () => {
            expect(matchInstitutionName("banco pichincha", institutions)).toBe("Banco Pichincha");
            expect(matchInstitutionName("BBVA", institutions)).toBe("BBVA");
        });

        it("matches via fuzzy containment above the threshold", () => {
            expect(matchInstitutionName("Banco Pichincha C.A.", ["Pichincha"])).toBe("Pichincha");
            expect(matchInstitutionName("Pago Netflix Premium", institutions)).toBe("Netflix");
        });

        it("returns null when the best candidate is below the threshold", () => {
            // "Visa" vs "Vista" ≈ 0.57 — close but not confident enough.
            expect(matchInstitutionName("Visa", ["Vista"])).toBeNull();
            // Unrelated merchant must not be coerced into an existing institution.
            expect(matchInstitutionName("Amazon Web Services", institutions)).toBeNull();
        });

        it("picks the best-scoring institution among several", () => {
            expect(matchInstitutionName("Banco Pichincha", institutions)).toBe("Banco Pichincha");
        });

        it("respects a custom threshold", () => {
            // Below default (0.7) → null, but accepted at a looser 0.5.
            expect(matchInstitutionName("Visa", ["Vista"])).toBeNull();
            expect(matchInstitutionName("Visa", ["Vista"], 0.5)).toBe("Vista");
        });

        it("returns null for empty merchant or empty institution list", () => {
            expect(matchInstitutionName("", institutions)).toBeNull();
            expect(matchInstitutionName(null, institutions)).toBeNull();
            expect(matchInstitutionName(undefined, institutions)).toBeNull();
            expect(matchInstitutionName("Pichincha", [])).toBeNull();
        });
    });

    describe("bestInstitutionMatch", () => {
        it("returns the highest-scoring candidate regardless of threshold", () => {
            const best = bestInstitutionMatch("Visa", ["Vista", "Mastercard"]);
            expect(best?.name).toBe("Vista");
            expect(best?.score).toBeGreaterThan(0);
            expect(best?.score).toBeLessThan(INSTITUTION_MATCH_THRESHOLD);
        });

        it("returns null when there is no overlap at all", () => {
            expect(bestInstitutionMatch("Spotify", ["Banco Pichincha"])).toBeNull();
            expect(bestInstitutionMatch("", ["Pichincha"])).toBeNull();
            expect(bestInstitutionMatch("Pichincha", [])).toBeNull();
        });
    });

    describe("getInstitutionMatchInfo", () => {
        it("flags a strong match as 'verified' with its name and score", () => {
            const info = getInstitutionMatchInfo("Banco Pichincha C.A.", ["Pichincha"]);
            expect(info.level).toBe("verified");
            expect(info.matchedName).toBe("Pichincha");
            expect(info.score).toBeGreaterThanOrEqual(0.85);
        });

        it("flags a partial match as 'warning'", () => {
            const info = getInstitutionMatchInfo("Visa", ["Vista"]);
            expect(info.level).toBe("warning");
            expect(info.matchedName).toBe("Vista");
            expect(info.score).toBeGreaterThanOrEqual(0.5);
            expect(info.score).toBeLessThan(0.85);
        });

        it("flags an unidentifiable merchant as 'none' (no name surfaced)", () => {
            const info = getInstitutionMatchInfo("Amazon Web Services", ["Banco Pichincha", "BBVA"]);
            expect(info.level).toBe("none");
            expect(info.matchedName).toBeNull();
            expect(info.score).toBeGreaterThanOrEqual(0);
        });

        it("treats a weak (below 0.5) candidate as 'none' without surfacing it", () => {
            const info = getInstitutionMatchInfo("ab", ["abxyz"]);
            expect(info.level).toBe("none");
            expect(info.score).toBeGreaterThan(0);
            expect(info.score).toBeLessThan(0.5);
            expect(info.matchedName).toBeNull();
        });
    });
});

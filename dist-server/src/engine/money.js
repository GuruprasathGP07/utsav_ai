/** @fileoverview Integer rupee arithmetic — no floats, no paise, no fractions.
 * AI SUGGESTS. CODE CHECKS. This engine owns every rupee in the plan. */
/** Multipliers for parseINR text recognition. */
const MULTIPLIERS = [
    [/cr(?:ore)?s?/i, 1_00_00_000],
    [/l(?:akh|ac|akhs)?/i, 1_00_000],
    [/k/i, 1_000],
];
/**
 * Parses human-entered rupee strings to integer rupees.
 * Understands: 8L, 8 lakh, 8,00,000, Rs 800000, ₹8.5 lac, 2 crore, 2Cr.
 * Returns null if the string cannot be parsed.
 */
export function parseINR(input) {
    const clean = input.replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '').trim();
    if (!clean)
        return null;
    for (const [pattern, multiplier] of MULTIPLIERS) {
        const m = pattern.exec(clean);
        if (m) {
            const prefix = clean.slice(0, m.index).trim();
            const num = Number(prefix);
            if (!isFinite(num) || num <= 0)
                return null;
            return Math.round(num * multiplier);
        }
    }
    const plain = Number(clean);
    if (!isFinite(plain) || plain <= 0)
        return null;
    return Math.round(plain);
}
/**
 * Formats integer rupees to Indian locale string.
 * Examples: 800000 → "₹8,00,000"  |  50000 → "₹50,000"
 */
export function formatINR(rupees) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(rupees);
}
/**
 * Formats integer rupees as a compact Indian string.
 * Examples: 800000 → "₹8L"  |  5000000 → "₹50L"  |  20000000 → "₹2Cr"
 */
export function formatINRCompact(rupees) {
    if (rupees >= 1_00_00_000) {
        const cr = rupees / 1_00_00_000;
        return `₹${cr % 1 === 0 ? cr.toString() : cr.toFixed(1)}Cr`;
    }
    if (rupees >= 1_00_000) {
        const L = rupees / 1_00_000;
        return `₹${L % 1 === 0 ? L.toString() : L.toFixed(1)}L`;
    }
    if (rupees >= 1_000) {
        const k = rupees / 1_000;
        return `₹${k % 1 === 0 ? k.toString() : k.toFixed(1)}K`;
    }
    return `₹${rupees.toString()}`;
}
/**
 * Distributes `total` integer rupees across weights using the Largest Remainder Method.
 * Guarantees: sum(result) === total for any non-negative weights summing to > 0.
 */
export function largestRemainder(total, weights) {
    if (weights.length === 0)
        return [];
    const raw = weights.map(w => ({
        key: w.key,
        exact: (total * w.percent) / 100,
        floor: Math.floor((total * w.percent) / 100),
        remainder: ((total * w.percent) / 100) % 1,
    }));
    const floorSum = raw.reduce((s, r) => s + r.floor, 0);
    const deficit = total - floorSum;
    const sorted = [...raw].sort((a, b) => b.remainder - a.remainder);
    const bumped = new Set(sorted.slice(0, deficit).map(r => r.key));
    return raw.map(r => ({ key: r.key, amount: r.floor + (bumped.has(r.key) ? 1 : 0) }));
}
/**
 * Asserts that an allocation sums exactly to total.
 * Throws in development if the invariant is violated.
 */
export function assertSum(total, amounts, label) {
    const sum = amounts.reduce((a, b) => a + b, 0);
    if (sum !== total) {
        throw new RangeError(`Money invariant violated${label ? ` (${label})` : ''}: sum ${sum} ≠ ${total}`);
    }
}
//# sourceMappingURL=money.js.map
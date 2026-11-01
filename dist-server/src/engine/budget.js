import { largestRemainder, assertSum } from './money.js';
/** Applies x1.25 priority weight, renormalizes non-contingency, leaves contingency alone. */
function applyPriority(weights) {
    const contingency = weights.find(w => w.key === 'contingency');
    const rest = weights.filter(w => w.key !== 'contingency');
    const boosted = rest.map(w => ({
        ...w,
        percent: w.priority === 'high' ? w.percent * 1.25 : w.percent,
    }));
    const restSum = boosted.reduce((s, w) => s + w.percent, 0);
    const targetRestPct = 100 - (contingency?.percent ?? 5);
    const factor = restSum > 0 ? targetRestPct / restSum : 1;
    const normalized = boosted.map(w => ({ ...w, percent: w.percent * factor }));
    return contingency ? [...normalized, contingency] : normalized;
}
/** Clamps each weight to its min/max bounds, returns clamped list. */
function clamp(weights, bounds) {
    return weights.map(w => {
        const b = bounds[w.key];
        if (!b)
            return w;
        return { ...w, percent: Math.max(b.min, Math.min(b.max, w.percent)) };
    });
}
/** Renormalizes weights so they sum to exactly 100. */
function normalize(weights) {
    const sum = weights.reduce((s, w) => s + w.percent, 0);
    if (sum <= 0)
        return weights;
    const factor = 100 / sum;
    return weights.map(w => ({ ...w, percent: w.percent * factor }));
}
/** Scales per-guest categories when guest count changes. */
function applyGuestScale(weights, perGuestKeys, guests, prevGuests) {
    if (guests === prevGuests || prevGuests === 0)
        return weights;
    const scale = guests / prevGuests;
    return weights.map(w => perGuestKeys.includes(w.key) ? { ...w, percent: w.percent * scale } : w);
}
/**
 * Computes the full budget allocation.
 * Locked categories keep their amount; unlocked categories share the remainder.
 * Uses LRM to guarantee sum === total.
 */
export function computeBudget(input) {
    const { total, bounds, perGuestKeys, guests, prevGuests } = input;
    const warnings = [];
    // 1. Guest scaling
    let weights = prevGuests != null && prevGuests !== guests
        ? applyGuestScale(input.weights, perGuestKeys, guests, prevGuests)
        : [...input.weights];
    // 2. Priority boost
    weights = applyPriority(weights);
    // 3. Clamp
    weights = clamp(weights, bounds);
    // 4. Locked categories: pre-allocate their amount, distribute rest
    const locked = weights.filter(w => w.locked);
    const unlocked = weights.filter(w => !w.locked);
    const lockedTotal = locked.reduce((s, w) => s + Math.round((total * w.percent) / 100), 0);
    const unlockedPool = total - lockedTotal;
    if (unlockedPool < 0) {
        warnings.push('Locked categories exceed total budget — some locks have been released.');
    }
    // 5. Normalise unlocked
    const unlockedNorm = normalize(unlocked);
    // 6. LRM allocation for unlocked slice
    const pool = Math.max(0, unlockedPool);
    const unlockedAlloc = largestRemainder(pool, unlockedNorm.map(w => ({ key: w.key, percent: w.percent })));
    const lockedAlloc = locked.map(w => ({
        key: w.key,
        amount: Math.round((total * w.percent) / 100),
    }));
    const allocMap = new Map([
        ...lockedAlloc.map(a => [a.key, a.amount]),
        ...unlockedAlloc.map(a => [a.key, a.amount]),
    ]);
    // 7. Build output categories in original order
    const categories = weights.map(w => ({
        key: w.key,
        label: w.label,
        amount: allocMap.get(w.key) ?? 0,
        percent: w.percent,
        locked: w.locked ?? false,
        priority: w.priority ?? 'normal',
        isExtras: w.isExtras ?? false,
        estimate: w.estimate ?? true,
    }));
    // 8. Enforce sum invariant
    const sum = categories.reduce((s, c) => s + c.amount, 0);
    if (sum !== total) {
        // Adjust the largest unlocked category
        const target = categories.find(c => !c.locked && c.amount > 0);
        if (target)
            target.amount += total - sum;
    }
    assertSum(total, categories.map(c => c.amount), 'budget');
    // 9. Contingency warning
    const contingencyPct = (categories.find(c => c.key === 'contingency')?.percent ?? 0);
    if (contingencyPct < 5) {
        warnings.push(`Contingency is ${contingencyPct.toFixed(1)}% — below the recommended 5%.`);
    }
    return { categories, warnings, total };
}
/**
 * Redistributes budget when the user changes one category amount.
 * The delta is spread proportionally across non-locked, non-contingency categories.
 */
export function redistributeCategory(budget, changedKey, newAmount) {
    const changed = budget.categories.find(c => c.key === changedKey);
    if (!changed)
        return budget;
    const delta = newAmount - changed.amount;
    const targets = budget.categories.filter(c => c.key !== changedKey && !c.locked && c.key !== 'contingency' && c.amount > 0);
    const targetTotal = targets.reduce((s, c) => s + c.amount, 0);
    const updated = budget.categories.map(c => {
        if (c.key === changedKey)
            return { ...c, amount: newAmount, percent: (newAmount / budget.total) * 100 };
        if (targets.includes(c) && targetTotal > 0) {
            const adj = Math.round((c.amount / targetTotal) * -delta);
            return { ...c, amount: Math.max(0, c.amount + adj), percent: ((Math.max(0, c.amount + adj)) / budget.total) * 100 };
        }
        return c;
    });
    // Re-apply LRM to ensure sum === total
    const rawTotal = updated.reduce((s, c) => s + c.amount, 0);
    const diff = budget.total - rawTotal;
    if (diff !== 0) {
        const flex = updated.find(c => !c.locked && c.key !== changedKey && c.amount > 0);
        if (flex)
            flex.amount += diff;
    }
    assertSum(budget.total, updated.map(c => c.amount), 'redistribute');
    return { ...budget, categories: updated };
}
//# sourceMappingURL=budget.js.map
import { z } from 'zod';
import { PlanSchema } from './plan.js';
/** @fileoverview Share-link codec schema — base64url, size-capped, consistency-checked. */
/** Maximum encoded share payload size in bytes. */
export const MAX_SHARE_BYTES = 48_000;
/** Encoded share payload — the plan JSON plus integrity fields. */
export const SharePayloadSchema = z.object({
    v: z.literal(2), // version
    ts: z.number().int().positive(), // unix timestamp ms
    plan: PlanSchema,
});
/**
 * Encodes a plan as a base64url share string.
 * Throws if the encoded size exceeds MAX_SHARE_BYTES.
 */
export function encodeShareLink(plan) {
    const payload = { v: 2, ts: Date.now(), plan };
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    if (bytes.length > MAX_SHARE_BYTES) {
        throw new Error(`Share payload too large: ${bytes.length} bytes (max ${MAX_SHARE_BYTES})`);
    }
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/**
 * Decodes a base64url share string, validates schema, and runs consistency checks.
 * Returns the plan or throws with a reason.
 */
export function decodeShareLink(encoded) {
    let json;
    try {
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        json = atob(base64);
    }
    catch {
        throw new Error('Invalid share link: base64url decode failed');
    }
    if (new TextEncoder().encode(json).length > MAX_SHARE_BYTES) {
        throw new Error('Share link too large');
    }
    let raw;
    try {
        raw = JSON.parse(json);
    }
    catch {
        throw new Error('Invalid share link: JSON parse failed');
    }
    const result = SharePayloadSchema.safeParse(raw);
    if (!result.success) {
        throw new Error(`Invalid share link: ${result.error.issues[0]?.message ?? 'schema mismatch'}`);
    }
    const { plan } = result.data;
    // Consistency check: budget sums
    const sum = plan.budget.categories.reduce((a, c) => a + c.amount, 0);
    if (sum !== plan.budget.total) {
        throw new Error(`Invalid share link: budget sum ${sum} ≠ total ${plan.budget.total}`);
    }
    // Consistency check: no dependency cycles
    const seen = new Set();
    const visiting = new Set();
    const hasCycle = (id) => {
        if (visiting.has(id))
            return true;
        if (seen.has(id))
            return false;
        visiting.add(id);
        const task = plan.tasks.find(t => t.id === id);
        for (const dep of task?.dependsOn ?? []) {
            if (hasCycle(dep))
                return true;
        }
        visiting.delete(id);
        seen.add(id);
        return false;
    };
    for (const t of plan.tasks) {
        if (hasCycle(t.id))
            throw new Error('Invalid share link: dependency cycle detected');
    }
    return plan;
}
//# sourceMappingURL=share.js.map
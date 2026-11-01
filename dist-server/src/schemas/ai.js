import { z } from 'zod';
/** @fileoverview Zod schemas for all Gemini I/O — generated as JSON schemas for responseSchema. */
// ── Parse-intake response ──────────────────────────────────────────────────────
export const ParseIntakeResponseSchema = z.object({
    occasion: z.string().optional(),
    city: z.string().max(100).optional(),
    eventDate: z.string().optional(),
    guests: z.number().int().min(1).max(10_000).optional(),
    budget: z.number().int().min(1000).optional(),
    vibe: z.string().max(300).optional(),
    extras: z.array(z.string().max(50)).max(10).optional(),
    priorities: z.array(z.string().max(50)).max(5).optional(),
});
// ── Quote extraction response ──────────────────────────────────────────────────
export const ExtractQuoteResponseSchema = z.object({
    vendorName: z.string().max(200).nullable(),
    totalPrice: z.number().int().min(0).nullable(),
    perPlate: z.number().int().min(0).nullable(),
    guestMinimum: z.number().int().min(0).nullable(),
    overtimeRatePerHr: z.number().int().min(0).nullable(),
    taxPercent: z.number().min(0).max(100).nullable(),
    advancePercent: z.number().min(0).max(100).nullable(),
    inclusions: z.array(z.string().max(200)),
    cancellationPolicy: z.string().max(500).nullable(),
});
// ── Ideas response ─────────────────────────────────────────────────────────────
export const IdeasResponseSchema = z.object({
    themes: z.array(z.string().max(100)).max(10),
    activities: z.array(z.string().max(200)).max(10),
    foodStyle: z.array(z.string().max(200)).max(8),
    personalTouches: z.array(z.string().max(200)).max(8),
    invitationLine: z.string().max(300),
});
// ── Risk (Gemini-suggested, max 3) ────────────────────────────────────────────
export const GeminiRiskSchema = z.object({
    title: z.string().min(1).max(200),
    reason: z.string().min(1).max(500),
    severity: z.number().int().min(1).max(5),
    likelihood: z.number().int().min(1).max(5),
    category: z.enum(['weather', 'vendor', 'venue', 'budget', 'timeline', 'guest', 'legal', 'health', 'other']),
    backup: z.object({
        action: z.string().min(1).max(500),
        costRupees: z.number().int().min(0).nullable(),
        dueDaysBefore: z.number().int().min(0),
    }),
});
export const GenerateRisksResponseSchema = z.object({
    risks: z.array(GeminiRiskSchema).max(3),
});
// ── Tradeoff explain ───────────────────────────────────────────────────────────
export const TradeoffExplainResponseSchema = z.object({
    explanation: z.string().min(1).max(2000),
});
// ── Plan review ────────────────────────────────────────────────────────────────
export const PlanReviewResponseSchema = z.object({
    steps: z.array(z.string().max(500)).min(3).max(3),
    note: z.string().max(500).optional(),
});
// ── Planner chat ───────────────────────────────────────────────────────────────
export const PlannerChatResponseSchema = z.object({
    answer: z.string().min(1).max(3000),
    citations: z.array(z.string().max(200)).max(5).default([]),
    model: z.string().max(100),
});
//# sourceMappingURL=ai.js.map
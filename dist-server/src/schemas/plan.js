import { z } from 'zod';
/** @fileoverview Core occasion, plan and budget Zod schemas — shared by client, server and tests. */
// ── Occasion ──────────────────────────────────────────────────────────────────
export const OCCASION_TYPES = [
    'wedding', 'engagement', 'birthday_kids', 'birthday_adult',
    'baby_shower', 'coming_of_age', 'community_festival',
];
export const LANGUAGES = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];
// ── Budget ─────────────────────────────────────────────────────────────────────
export const CategorySchema = z.object({
    key: z.string().min(1).max(50),
    label: z.string().min(1).max(100),
    amount: z.number().int().min(0), // integer rupees
    percent: z.number().min(0).max(100),
    locked: z.boolean().default(false),
    priority: z.enum(['normal', 'high']).default('normal'),
    isExtras: z.boolean().default(false),
    estimate: z.boolean().default(true), // false = verified quotation
});
export const BudgetSchema = z.object({
    total: z.number().int().min(1000).max(500_000_000), // ₹1K–₹50 Cr
    categories: z.array(CategorySchema).min(1).max(30),
});
// ── Timeline ───────────────────────────────────────────────────────────────────
export const TaskStatusSchema = z.enum(['pending', 'done', 'delayed', 'impossible']);
export const TaskSchema = z.object({
    id: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    phase: z.number().int().min(1).max(5),
    leadTimeDays: z.number().int().min(0).max(730),
    dependsOn: z.array(z.string()).default([]),
    assignee: z.string().max(100).optional(),
    categoryKey: z.string().min(1).max(50),
    status: TaskStatusSchema.default('pending'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    delayedByDays: z.number().int().min(0).default(0),
    delayReason: z.string().max(300).optional(),
    atRisk: z.boolean().default(false),
    isOverdue: z.boolean().default(false),
    essential: z.boolean().default(true),
});
// ── Vendor ─────────────────────────────────────────────────────────────────────
export const VendorStatusSchema = z.enum(['not_started', 'contacted', 'quoted', 'accepted']);
export const QuoteSchema = z.object({
    vendorName: z.string().max(200).optional(),
    totalPrice: z.number().int().min(0).nullable(),
    perPlate: z.number().int().min(0).nullable(),
    guestMinimum: z.number().int().min(0).nullable(),
    overtimeRatePerHr: z.number().int().min(0).nullable(),
    taxPercent: z.number().min(0).max(100).nullable(),
    advancePercent: z.number().min(0).max(100).nullable(),
    inclusions: z.array(z.string().max(200)).default([]),
    cancellationPolicy: z.string().max(500).nullable(),
    extractedAt: z.string().datetime().optional(),
    rawText: z.string().max(5000).optional(),
});
export const VendorSchema = z.object({
    id: z.string().min(1).max(50),
    categoryKey: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    status: VendorStatusSchema.default('not_started'),
    quotes: z.array(QuoteSchema).default([]),
    accepted: z.number().int().min(0).nullable().default(null), // index into quotes
    notes: z.string().max(1000).default(''),
});
// ── Brief (intake) ─────────────────────────────────────────────────────────────
export const BriefSchema = z.object({
    occasion: z.enum(OCCASION_TYPES),
    city: z.string().min(1).max(100),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.number().int().min(1).max(10_000),
    budget: z.number().int().min(1000).max(500_000_000),
    currency: z.literal('INR').default('INR'),
    priorities: z.array(z.string().max(50)).max(5).default([]),
    vibe: z.string().max(300).default(''),
    extras: z.array(z.string().max(50)).default([]),
    language: z.enum(LANGUAGES).default('en'),
    title: z.string().max(200).default(''),
});
// ── Plan (root state) ──────────────────────────────────────────────────────────
export const PlanSchema = z.object({
    id: z.string().min(1).max(50),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    brief: BriefSchema,
    budget: BudgetSchema,
    tasks: z.array(TaskSchema),
    vendors: z.array(VendorSchema).default([]),
    ideas: z.record(z.string(), z.array(z.string())).default({}),
    readyToShare: z.boolean().default(false),
});
//# sourceMappingURL=plan.js.map
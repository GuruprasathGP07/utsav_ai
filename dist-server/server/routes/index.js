import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { ParseIntakeResponseSchema, ExtractQuoteResponseSchema, IdeasResponseSchema, GenerateRisksResponseSchema, PlanReviewResponseSchema, PlannerChatResponseSchema, TradeoffExplainResponseSchema, } from '../../src/schemas/ai.js';
import { BriefSchema } from '../../src/schemas/plan.js';
import { geminiCall, wrapUserText } from '../lib/gemini.js';
import { parseINR } from '../../src/engine/money.js';
function fallbackParse(sentence) {
    const lower = sentence.toLowerCase();
    let occasion = 'wedding';
    if (/birthday|kids|child/i.test(lower))
        occasion = /kid|child|1st|5th|10th/i.test(lower) ? 'birthday_kids' : 'birthday_adult';
    else if (/engagement|roka|betrothal|saghai/i.test(lower))
        occasion = 'engagement';
    else if (/baby\s*shower|godh\s*bharai|seemantham|valaikappu/i.test(lower))
        occasion = 'baby_shower';
    else if (/festival|mela|community|diwali|pongal|society|pooja/i.test(lower))
        occasion = 'community_festival';
    else if (/coming\s*of\s*age|half\s*saree|dhoti/i.test(lower))
        occasion = 'coming_of_age';
    const guestMatch = lower.match(/(\d+)\s*(?:guests?|people|pax|members|families|kids)/i);
    const guests = guestMatch ? parseInt(guestMatch[1] ?? '150', 10) : 150;
    const budgetMatch = sentence.match(/(?:(?:rs\.?|₹)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|lac|crore|cr|k))?|\b[\d.]+\s*(?:lakh|lac|crore|cr|k)\b)/i);
    const budget = (budgetMatch ? parseINR(budgetMatch[0]) : null) ?? parseINR(sentence) ?? 500_000;
    const cities = ['Chennai', 'Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi', 'Thiruvananthapuram', 'Coimbatore'];
    const city = cities.find(c => new RegExp(`\\b${c}\\b`, 'i').test(sentence)) ?? 'Chennai';
    return { occasion, city, guests, budget };
}
/** @fileoverview All /api/* route handlers. Each handler: guard → validate → call → validate → respond. */
const aiLimiter = rateLimit({
    windowMs: 5 * 60_000, max: 20,
    standardHeaders: true, legacyHeaders: false,
    message: { error: { code: 'AI_RATE_LIMITED' } },
});
export const apiRouter = Router();
// ── Health ────────────────────────────────────────────────────────────────────
apiRouter.get('/health', (_req, res) => {
    res.json({ status: 'ok', demo: !process.env['GEMINI_API_KEY'] });
});
// ── Parse intake ─────────────────────────────────────────────────────────────
const ParseIntakeBody = z.object({
    sentence: z.string().min(1).max(2000),
    language: z.enum(['en', 'hi', 'ta', 'te', 'kn', 'ml']).default('en'),
});
apiRouter.post('/parse-intake', aiLimiter, async (req, res) => {
    const body = ParseIntakeBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
        return;
    }
    const { sentence, language } = body.data;
    const hash = await sha256(`parse:${sentence}:${language}`);
    const prompt = `
You are a smart Indian event planner assistant. The user describes their event in one sentence.
Extract structured data in ${language} locale context. Respond in JSON only.
User input: ${wrapUserText(sentence)}
Extract: occasion (wedding/engagement/birthday_kids/birthday_adult/baby_shower/coming_of_age/community_festival),
city, eventDate (YYYY-MM-DD, guess a date ~4 months from today if vague),
guests (integer), budget (integer rupees), vibe, extras, priorities.
If a field cannot be determined, omit it. Never invent prices beyond what the user stated.`;
    const result = await geminiCall({ prompt, schema: ParseIntakeResponseSchema, cacheKey: hash });
    const data = result ?? fallbackParse(sentence);
    res.json({ data, demo: !process.env['GEMINI_API_KEY'] });
});
// ── Extract quote ─────────────────────────────────────────────────────────────
const ExtractQuoteBody = z.object({
    quoteText: z.string().min(1).max(5000),
    language: z.enum(['en', 'hi', 'ta', 'te', 'kn', 'ml']).default('en'),
});
apiRouter.post('/extract-quote', aiLimiter, async (req, res) => {
    const body = ExtractQuoteBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
        return;
    }
    const { quoteText, language } = body.data;
    const hash = await sha256(`quote:${quoteText}`);
    const prompt = `
Extract vendor quote details from the following text. Language context: ${language}.
${wrapUserText(quoteText)}
Fields: vendorName, totalPrice (integer rupees or null), perPlate (integer rupees or null),
guestMinimum, overtimeRatePerHr, taxPercent, advancePercent, inclusions (array of strings),
cancellationPolicy. Use null for unstated fields. Never invent values.`;
    const result = await geminiCall({ prompt, schema: ExtractQuoteResponseSchema, cacheKey: hash });
    res.json({ data: result, demo: !process.env['GEMINI_API_KEY'] });
});
// ── Suggest ideas ─────────────────────────────────────────────────────────────
const IdeasBody = z.object({ brief: BriefSchema });
apiRouter.post('/suggest-ideas', aiLimiter, async (req, res) => {
    const body = IdeasBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
        return;
    }
    const { brief } = body.data;
    const hash = await sha256(`ideas:${JSON.stringify(brief)}`);
    const prompt = `
You are an Indian event ideas expert. Generate creative, culturally appropriate ideas for:
Occasion: ${brief.occasion}, City: ${brief.city}, Guests: ${brief.guests},
Budget band: ${brief.budget < 200000 ? 'budget' : brief.budget < 500000 ? 'mid' : 'premium'},
Vibe: ${wrapUserText(brief.vibe || 'traditional')}, Language: ${brief.language}.
Provide themes, activities, foodStyle, personalTouches, invitationLine.
No prices. No vendor names. Keep culturally rooted.`;
    const result = await geminiCall({ prompt, schema: IdeasResponseSchema, cacheKey: hash });
    res.json({ data: result, demo: !process.env['GEMINI_API_KEY'] });
});
// ── Generate risks ────────────────────────────────────────────────────────────
const RisksBody = z.object({ brief: BriefSchema, existingRiskIds: z.array(z.string()).max(20) });
apiRouter.post('/generate-risks', aiLimiter, async (req, res) => {
    const body = RisksBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
        return;
    }
    const { brief, existingRiskIds } = body.data;
    const hash = await sha256(`risks:${JSON.stringify(brief)}`);
    const prompt = `
You are a wedding and events risk advisor for Indian occasions.
Event: ${brief.occasion} in ${brief.city} on ${brief.eventDate}, ${brief.guests} guests, ₹${brief.budget}.
Existing rule-based risks (do NOT repeat): ${existingRiskIds.join(', ')}.
Suggest up to 3 ADDITIONAL contextual risks not already covered. Focus on local/cultural factors.
Each risk: title, reason, severity (1-5), likelihood (1-5), category, backup action.`;
    const result = await geminiCall({ prompt, schema: GenerateRisksResponseSchema, cacheKey: hash });
    res.json({ data: result, demo: !process.env['GEMINI_API_KEY'] });
});
// ── Plan review ───────────────────────────────────────────────────────────────
const ReviewBody = z.object({ brief: BriefSchema, summary: z.string().max(2000) });
apiRouter.post('/review-plan', aiLimiter, async (req, res) => {
    const body = ReviewBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
        return;
    }
    const { brief, summary } = body.data;
    const hash = await sha256(`review:${JSON.stringify(brief)}:${summary}`);
    const prompt = `
Based ONLY on the following plan facts, provide exactly 3 prioritized next steps.
Plan summary: ${wrapUserText(summary)}
Occasion: ${brief.occasion}, City: ${brief.city}, Guests: ${brief.guests}, Budget: ₹${brief.budget}.
Respond with steps (array of 3 strings) and an optional note. Use only stated facts.`;
    const result = await geminiCall({ prompt, schema: PlanReviewResponseSchema, cacheKey: hash });
    res.json({ data: result, demo: !process.env['GEMINI_API_KEY'] });
});
// ── Planner chat ──────────────────────────────────────────────────────────────
const ChatBody = z.object({
    question: z.string().min(1).max(1000),
    brief: BriefSchema,
    context: z.string().max(3000).default(''),
});
apiRouter.post('/ask-planner', aiLimiter, async (req, res) => {
    const body = ChatBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
        return;
    }
    const { question, brief, context } = body.data;
    const hash = await sha256(`chat:${question}:${JSON.stringify(brief)}`);
    const prompt = `
You are a helpful Indian wedding and events planning assistant.
Answer ONLY based on the plan facts below. State which model answered.
Plan context: ${wrapUserText(context)}
Occasion: ${brief.occasion}, City: ${brief.city}, Guests: ${brief.guests}, Budget: ₹${brief.budget}.
User question: ${wrapUserText(question)}
Give a practical, warm, helpful answer in ${brief.language}. Include citations to facts used.`;
    const result = await geminiCall({
        prompt,
        schema: PlannerChatResponseSchema,
        cacheKey: hash,
    });
    res.json({ data: result, demo: !process.env['GEMINI_API_KEY'] });
});
// ── Explain tradeoffs ─────────────────────────────────────────────────────────
const TradeoffBody = z.object({
    options: z.array(z.object({ label: z.string(), deltaRupees: z.number() })).max(5),
    brief: BriefSchema,
});
apiRouter.post('/explain-tradeoffs', aiLimiter, async (req, res) => {
    const body = TradeoffBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
        return;
    }
    const { options, brief } = body.data;
    const hash = await sha256(`tradeoffs:${JSON.stringify(options)}:${JSON.stringify(brief)}`);
    const optionText = options.map(o => `${o.label}: ₹${o.deltaRupees}`).join(', ');
    const prompt = `
Explain in plain, warm language (${brief.language}) what these budget adjustment options mean
for a ${brief.occasion} with ${brief.guests} guests in ${brief.city}.
Options: ${optionText}. Keep it to 2-3 sentences per option. No jargon.`;
    const result = await geminiCall({ prompt, schema: TradeoffExplainResponseSchema, cacheKey: hash });
    res.json({ data: result, demo: !process.env['GEMINI_API_KEY'] });
});
// ── 404 ───────────────────────────────────────────────────────────────────────
apiRouter.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND' } });
});
// ── Helper: SHA-256 hash of a string (Node built-in) ─────────────────────────
async function sha256(text) {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(text).digest('hex');
}
//# sourceMappingURL=index.js.map
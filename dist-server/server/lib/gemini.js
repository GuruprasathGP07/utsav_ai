import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { logger } from './logger.js';
/** @fileoverview Gemini client — failover, streaming, abort, per-model cooldown, LRU cache.
 * User text is always wrapped in <user_text> tags. */
// ── Model chain ───────────────────────────────────────────────────────────────
const MODEL_CHAIN = (process.env['GEMINI_MODELS'] ?? 'gemini-2.5-flash,gemini-2.5-flash-lite')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);
const cooldowns = new Map(); // model -> cooldown-until epoch ms
const COOLDOWN_MS = 60_000;
function setCooldown(model) {
    cooldowns.set(model, Date.now() + COOLDOWN_MS);
    logger.warn('Gemini model on cooldown', { model, cooldownMs: COOLDOWN_MS });
}
const CACHE_TTL_MS = 10 * 60 * 1_000;
const CACHE_MAX = 200;
const lruCache = new Map();
function cacheGet(key) {
    const entry = lruCache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
        lruCache.delete(key);
        return undefined;
    }
    lruCache.delete(key);
    lruCache.set(key, entry); // LRU bump
    return entry.value;
}
function cacheSet(key, value) {
    if (lruCache.size >= CACHE_MAX) {
        const oldest = lruCache.keys().next().value;
        if (oldest)
            lruCache.delete(oldest);
    }
    lruCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}
// ── Injection stripping ────────────────────────────────────────────────────────
function stripInjection(text) {
    return text.replace(/<\/user_text>/gi, '').replace(/IGNORE\s+PREVIOUS/gi, '[FILTERED]');
}
// ── Core call ─────────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] ?? '' });
/**
 * Calls Gemini with JSON mode using the provided Zod schema as responseSchema.
 * Validates output with the same schema. Fails over to the next model on quota/overload.
 * Returns null if the API key is missing (demo mode).
 */
export async function geminiCall(opts) {
    if (!process.env['GEMINI_API_KEY']) {
        logger.info('Gemini API key missing — demo mode');
        return null;
    }
    // Cache check
    if (opts.cacheKey) {
        const cached = cacheGet(opts.cacheKey);
        if (cached !== undefined) {
            logger.debug('Gemini cache hit', { key: opts.cacheKey });
            return cached;
        }
    }
    const jsonSchema = zodToJsonSchema(opts.schema, { target: 'openApi3' });
    const config = {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: jsonSchema,
    };
    const modelsToTry = [...MODEL_CHAIN];
    let lastErr;
    for (const model of modelsToTry) {
        if ((cooldowns.get(model) ?? 0) > Date.now())
            continue;
        const start = Date.now();
        try {
            const response = await ai.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
                config,
            });
            const text = response.text ?? '';
            const latency = Date.now() - start;
            logger.info('Gemini response', { model, latencyMs: latency });
            const parsed = JSON.parse(text);
            const validated = opts.schema.safeParse(parsed);
            if (!validated.success) {
                logger.warn('Gemini response failed validation', { model, issues: validated.error.issues });
                return null;
            }
            const result = validated.data;
            if (opts.cacheKey)
                cacheSet(opts.cacheKey, result);
            return result;
        }
        catch (err) {
            lastErr = err;
            const msg = String(err);
            if (/quota|resource_exhausted|overloaded|service_unavailable|deprecated|not_found/i.test(msg)) {
                setCooldown(model);
            }
            else {
                logger.error('Gemini error', { model, error: msg });
                break;
            }
        }
    }
    logger.error('All Gemini models failed', { error: String(lastErr) });
    return null;
}
/** Wraps user-supplied text in XML tags to prevent prompt injection. */
export function wrapUserText(text) {
    return `<user_text>${stripInjection(text)}</user_text>`;
}
export { MODEL_CHAIN };
//# sourceMappingURL=gemini.js.map
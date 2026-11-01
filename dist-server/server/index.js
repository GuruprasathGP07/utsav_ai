import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sameOriginGuard, requireJson } from './lib/guards.js';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes/index.js';
/** @fileoverview Express server — serves /api and the Vite-built SPA. */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const PORT = Number(process.env['PORT'] ?? 8080);
const app = express();
// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: false,
}));
// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED' } },
}));
// ── Body parsing (8KB cap) ────────────────────────────────────────────────────
app.use(express.json({ limit: '8kb' }));
// ── security.txt ──────────────────────────────────────────────────────────────
app.get('/.well-known/security.txt', (_req, res) => {
    res.type('text/plain').send('Contact: mailto:security@utsavai.example.com\n' +
        'Expires: 2027-01-01T00:00:00Z\n' +
        'Policy: https://utsavai.example.com/security\n');
});
// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    logger.debug('Request', { method: req.method, path: req.path });
    next();
});
// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', sameOriginGuard, requireJson, apiRouter);
// ── Serve Vite SPA ────────────────────────────────────────────────────────────
app.use(express.static(DIST));
app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
});
// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    logger.error('Unhandled error', { error: String(err) });
    res.status(500).json({ error: { code: 'INTERNAL_ERROR' } });
});
if (process.env['NODE_ENV'] !== 'test') {
    app.listen(PORT, () => {
        logger.info(`UtsavAI server running on port ${PORT}`);
    });
}
export { app };
//# sourceMappingURL=index.js.map
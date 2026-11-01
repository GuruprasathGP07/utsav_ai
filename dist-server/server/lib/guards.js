/** @fileoverview Same-origin guard — rejects cross-site and origin-less requests on AI routes. */
const ALLOWED_ORIGINS = new Set((process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173,http://localhost:8080')
    .split(',')
    .map(o => o.trim()));
/**
 * Requires Origin or Referer to match an allowed origin.
 * Returns 403 for cross-site or origin-less requests.
 */
export function sameOriginGuard(req, res, next) {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];
    const host = req.headers['host'];
    // Allow server-to-server health checks (no origin header)
    if (req.path === '/health' || req.path === '/api/health' || req.originalUrl.startsWith('/api/health')) {
        next();
        return;
    }
    // Allow requests from same host (Cloud Run internal)
    if (!origin && referer) {
        try {
            const refHost = new URL(referer).host;
            if (refHost === host) {
                next();
                return;
            }
        }
        catch { /* fall through */ }
    }
    if (!origin) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Missing Origin' } });
        return;
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Origin not allowed' } });
        return;
    }
    next();
}
/**
 * Enforces JSON Content-Type on POST requests.
 */
export function requireJson(req, res, next) {
    if (req.method === 'POST' && !req.is('application/json')) {
        res.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE' } });
        return;
    }
    next();
}
//# sourceMappingURL=guards.js.map
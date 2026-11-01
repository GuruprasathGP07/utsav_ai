# Security Policy — UtsavAI

## Security Principles

1. **Zero-Database Storage**: No user data, passwords, emails, or personal plans are persisted on backend servers. All plans live exclusively inside the user's browser `localStorage`.
2. **Deterministic Fallbacks**: AI is never trusted with critical math or arithmetic. LLM outputs are treated as untrusted user input and strictly validated with Zod schemas.
3. **Hardened HTTP Headers**: Protected with Helmet (CSP, HSTS with preload, no-sniff, frameguard deny).
4. **Rate Limiting**: Enforced on all AI and general endpoints to prevent denial-of-service and abuse.
5. **Origin Protection**: Non-health `/api` routes strictly enforce origin verification against whitelisted domains.

## Reporting a Vulnerability

If you discover a security vulnerability within UtsavAI, please do not open a public issue. Instead, report it privately to:

**Email**: `security@utsavai.example.com`

We will review your submission and respond within 48 hours.


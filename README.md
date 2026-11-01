# UtsavAI — GenAI Celebration Planner

> **CHALLENGE:**
> "Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."

> **PITCH:**
> "Describe your celebration in one sentence. Get one connected plan for budget, timeline and vendors. Then stress-test it: Plan Rescue finds what could go wrong and gives you a backup."

---

## Core Rule: AI Suggests, Code Checks

Deterministic TypeScript owns every rupee, date, and score. Gemini 2.5 Flash handles language understanding and idea synthesis.
- Every Gemini output is strictly validated against Zod schemas (`src/schemas/`).
- Invalid outputs immediately fall back to the deterministic local planner.
- The AI never invents prices, vendors, or availability.
- All monetary math runs in **integer rupees** via the Largest Remainder Method (`largestRemainder`) ensuring totals match the budget to the exact rupee.

---

## Key Features

1. **Intake (F1)**: Free text input (e.g. *"Shaadi in Pune, 200 guests, 8L, mid-Feb, premium food"*) parsed by Gemini or local regex fallback into structured celebration parameters. Robust `parseINR` parses amounts like `8 lakh`, `8L`, `8,00,000`, `Rs 800000`, `8.5 lac`, and `2 crore`.
2. **Budget Engine (F2 & F3)**: Preset allocations across 7 occasion types with priority weights (×1.25 on top priorities), per-category locks, live redistribution, and guest impact recalculation (per-plate catering estimates with flexible trimming options).
3. **Timeline & Compression (F4)**: Five-phase graph-based schedule with cycle detection, delay cascade propagation with plain-language explanations, and proportional timeline compression when runway < longest lead time. Includes RFC 5545 `.ics` export with standard line folding.
4. **Vendors (F5)**: Comprehensive checklist across Indian celebration categories, paste-and-extract quotation analyzer with GST and cancellation policy flags, and multi-quote comparison.
5. **Ideas (F6)**: Contextual themes, decor, curated menus, family activities, and invitation lines tuned to cultural tradition, vibe, guest count, and budget band.
6. **Planning Assistant (F7)**: Always-accessible ranked insights (Urgent, Attention, Suggestion) and contextual Q&A grounded in current plan facts.
7. **Plan Rescue (F8 - Signature)**: Deterministic safety engine with 7 core rules (monsoon weather tables by city and month, festival-season vendor shortage, single-vendor dependency, missing cancellation policies, thin contingency, venue capacity, delay cascade) + AI contextual risks. Computes a dynamic Readiness Score (0–100) with Diya gauge animation and petal celebration.
8. **Share & Privacy (F9)**: Zero-database architecture. Autosaved locally in `localStorage`. Shareable via URL-safe Base64url tokens (<48KB) with Zod consistency validation and read-only views.
9. **Multilingual (F10)**: First-class support for 6 Indian languages: English (`en`), हिन्दी (`hi`), தமிழ் (`ta`), తెలుగు (`te`), ಕನ್ನಡ (`kn`), and മലയാളം (`ml`) with live `<html lang="...">` switching.
10. **Festive Stationery Studio UI (F11)**: Premium, authentic Indian aesthetic featuring rich dark palette, paper textures, marigold accents, thoranam motifs, and full WCAG 2.1 AA accessibility compliance.

---

## Architecture

Single repository, single package. Built as an Express 4 application serving the Vite-compiled React 18 single-page app and `/api` endpoints.

```
utsavai/
├── src/
│   ├── engine/       # Pure TS deterministic engines (money, budget, timeline, compression, risks, readiness, presets)
│   ├── schemas/      # Zod schemas shared across client, server, and tests
│   ├── state/        # Pure plan reducer, store provider, and localStorage autosave
│   ├── components/   # UI panels (Overview, Budget, Timeline, Vendors, Ideas, Rescue, Share, Assistant)
│   ├── pages/        # Landing, Planner, SharedPlan, NotFound
│   ├── lib/          # Typed API client, theme manager, a11y announcer, i18n
│   ├── locales/      # Complete translation dictionaries (en, hi, ta, te, kn, ml)
│   └── styles/       # tokens.css and globals.css
├── server/
│   ├── index.ts      # Express 4 server, Helmet CSP, rate-limiting, static bundle serving
│   ├── routes/       # API endpoints (/health, /parse-intake, /extract-quote, /generate-ideas, etc.)
│   └── lib/          # Gemini SDK client, security guards, logger, prompts
├── tests/
│   ├── engine/       # Comprehensive pure engine unit & property tests
│   ├── schemas/      # Zod schema validation & share codec invertibility tests
│   ├── server/       # API endpoint & security guard integration tests
│   ├── ui/           # Accessibility & component interaction tests
│   └── hygiene/      # Zero console.log & zero TODO checks
├── docs/             # ARCHITECTURE.md, TESTING.md, ACCESSIBILITY.md, DEPLOYMENT.md
├── Dockerfile        # Production multi-stage container
├── cloudbuild.yaml   # Google Cloud Build configuration
└── .github/          # CI and CodeQL security workflows
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation & Run
```bash
# Install dependencies
npm install

# Run development server (both Express API and Vite SPA concurrently)
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Quality Assurance & Verification

```bash
# Type check TypeScript in strict mode
npm run type-check

# Run full Vitest suite (100% green across all engine, schema, server, ui, and hygiene tests)
npm test

# Build production assets (Vite SPA + compiled Express server)
npm run build

# Start production server locally
npm start
```

---

## Security & Compliance

- **No Database / No Accounts**: Zero PII stored on remote servers; all plans persist in client storage.
- **Strict Headers**: Helmet configured with strict CSP, HSTS preload, frameguard deny, and no-sniff.
- **Input Sanitization**: 8KB request payload limit, Zod validation on every route, prompt injection isolation via `<user_text>` tags.
- **Security Policy**: Documented at `SECURITY.md` and served at `/.well-known/security.txt`.

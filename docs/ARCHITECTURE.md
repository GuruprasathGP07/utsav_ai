# Architecture Specification — UtsavAI

## Overview

UtsavAI is a production-grade, zero-database GenAI celebration planner engineered specifically for Indian families and events. It operates on a single unified deployment model serving a compiled React 18 single-page application and strict Express 4 API backend.

```mermaid
flowchart TD
    User["User Interface (React 18 + Vite)"] --> Reducer["Pure State Reducer (localStorage Autosave)"]
    Reducer --> Codec["Base64url Share Codec (<48KB)"]
    User --> ClientAPI["Typed API Client"]
    ClientAPI --> Express["Express Server (Node 20)"]
    Express --> SecurityGuard["Security Guards (Same-Origin & Rate Limiting)"]
    SecurityGuard --> FallbackEngine["Deterministic Rule & Regex Fallbacks"]
    SecurityGuard --> Gemini["Google Gemini 2.5 Flash API"]
    
    subgraph Deterministic Engines
        MoneyEngine["Money Engine (LRM Integer Arithmetic)"]
        BudgetEngine["Budget Engine (Weights, Bounds, Locks)"]
        TimelineEngine["Timeline Engine (Graph, Propagation, Compression)"]
        RiskEngine["Risk Engine (7 Deterministic Safety Rules)"]
        ReadinessEngine["Readiness Engine (Diya Score 0-100)"]
        PresetEngine["7 Occasion Presets (12-14 Task Templates)"]
    end
    
    Reducer --> Deterministic Engines
    FallbackEngine --> Deterministic Engines
```

---

## Core Tenets

### 1. AI Suggests, Code Checks
- Natural language parsing, quotation text extraction, artistic theme ideation, and contextual risk scanning are handled by **Gemini 2.5 Flash**.
- All mathematical operations (rupee allocation, deadline calculation, graph dependency cycles, delay cascades, and readiness scores) are executed by **pure deterministic TypeScript engines**.
- Under zero circumstances does the LLM perform arithmetic.

### 2. Zero-Database Architecture
- No accounts, no credentials, no MongoDB, and no external user storage.
- Plans persist locally in `localStorage` via a debounced autosave mechanism.
- Sharing is accomplished using a compressed, URL-safe Base64url token with strict schema validation. The link size is capped at 48KB.

### 3. Resilient Failover & Demo Mode
- If `GEMINI_API_KEY` is absent or the model hits quota or network limits, the backend automatically transitions to deterministic template extraction.
- The UI never breaks due to an upstream AI error.

---

## Directory Structure

```
utsavai/
├── src/
│   ├── engine/       # Pure TypeScript deterministic logic (money, budget, timeline, compression, risks, readiness, presets)
│   ├── schemas/      # Shared Zod schemas (PlanSchema, BriefSchema, AiSchemas, ShareCodec)
│   ├── state/        # Pure plan reducer, store provider, and localStorage autosave
│   ├── components/   # Modular UI panels (Overview, Budget, Timeline, Vendors, Ideas, Rescue, Share)
│   ├── pages/        # Landing, Planner shell, SharedPlan read-only, NotFound
│   ├── lib/          # Typed API client, theme manager, a11y announcer, i18n initialization
│   ├── locales/      # Localization dictionaries (en, hi, ta, te, kn, ml)
│   └── styles/       # Design tokens and global CSS
├── server/
│   ├── index.ts      # Express application entry point
│   ├── routes/       # /api route handlers
│   └── lib/          # Gemini API client, security guards, Winston structured logger
├── tests/
│   ├── engine/       # Unit tests for pure deterministic engines
│   ├── schemas/      # Validation and share codec tests
│   ├── hygiene/      # Codebase cleanliness invariant tests
│   ├── server/       # Integration tests with supertest
│   └── ui/           # Accessibility and React component tests
└── docs/             # Technical documentation
```


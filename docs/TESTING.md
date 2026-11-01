# Testing Guide — UtsavAI

## Overview

UtsavAI employs a multi-tier testing strategy covering unit, property-based, integration, accessibility, and hygiene invariants. All tests are powered by **Vitest**.

---

## Test Suites

### 1. Engine Tests (`tests/engine/`)
- `money.test.ts`:
  - `parseINR`: Verifies parsing of Lakh, Crore, K, commas, and currency symbols across 100+ variations.
  - `largestRemainder`: Verifies Largest Remainder Method distributes rounding fractions to sum exactly to the target integer without losing even ₹1.
- `budget.test.ts`:
  - Mathematical property tests verifying 100 arbitrary budget amounts sum to the exact target.
  - Verification of high-priority ×1.25 multiplier redistribution and category lock preservation.
- `timeline.test.ts`:
  - Lead time scheduling, due date calculation, DFS cycle detection, and prerequisite delay propagation.
- `compression.test.ts`:
  - Proportional timeline compression when runway < longest lead time.
  - Verification that no task's due date is scheduled before today.
  - RFC 5545 `.ics` line-folding and calendar format compliance.
- `risks.test.ts`:
  - 7 deterministic risk rules: monsoon weather, thin contingency (<5%), overdue tasks, and capacity warnings.
- `readiness.test.ts`:
  - Score bounds (0–100), penalty calculations, and score elevation upon completing backups.
- `presets.test.ts`:
  - Parametrized test suite running 6 invariant checks across all 7 occasion types.

### 2. Schema Tests (`tests/schemas/`)
- Strict validation of `PlanSchema` and `BriefSchema`.
- Base64url encode and decode invertibility testing.
- URL-safe token limit (<48KB) and corruption rejection.

### 3. Server Integration Tests (`tests/server/`)
- Health check verification (`GET /api/health`).
- Same-origin security guard enforcement.
- Demo mode fallback execution for `/api/parse-intake`.

### 4. UI & Accessibility Tests (`tests/ui/`)
- Skip-to-content accessibility link.
- Language switcher verification across all 6 Indian languages.
- Hero input and call-to-action button rendering.

### 5. Hygiene Tests (`tests/hygiene/`)
- Enforces zero `console.log` statements in engine files.
- Enforces zero `TODO`, `FIXME`, or `STUB` markers in production code.

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Check TypeScript types
npm run type-check

# Run codebase metrics
npm run metrics
```


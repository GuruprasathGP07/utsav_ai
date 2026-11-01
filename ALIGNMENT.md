# ALIGNMENT.md — UtsavAI

## Challenge (verbatim)

> "Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."

## Pitch (verbatim)

> "Describe your celebration in one sentence. Get one connected plan for budget, timeline and vendors. Then stress-test it: Plan Rescue finds what could go wrong and gives you a backup."

---

## Traceability & Requirement Alignment

### 1. Weddings, Birthdays, and Community Events
- **Implementation**: `src/engine/presets.ts` provides complete, domain-specific templates for 7 celebration types:
  - `wedding` (Big Fat Indian Wedding / Traditional Shaadi)
  - `engagement` (Sangeet & Roka ceremony)
  - `birthday_kids` (Themed children's celebration)
  - `birthday_adult` (Milestone adult celebration)
  - `baby_shower` (Godh Bharai / Seemantham)
  - `coming_of_age` (Upanayanam / Half Saree)
  - `community_festival` (Ganesh Utsav, Diwali Mela, Durga Puja pandal)
- Each occasion includes budget category bounds, priority weightings, 12–14 task dependency templates with Indian market lead times, vendor checklists, and customizable extras.
- Verified by parametrized tests in `tests/engine/presets.test.ts`.

### 2. Connected Budgets
- **Implementation**: `src/engine/money.ts` and `src/engine/budget.ts`.
- **Integer Rupee Rule**: Pure integer math throughout. No floating-point inaccuracies.
- **Largest Remainder Method (LRM)**: Guarantees that `sum(category.amount) === totalBudget` to the exact rupee without off-by-one errors.
- **Interactive Redistribution**: Supports priority multipliers (×1.25 on top priorities), per-category locks, and guest-count impact via per-plate catering adjustments.
- Verified by property tests in `tests/engine/money.test.ts` and `tests/engine/budget.test.ts`.

### 3. Timelines & Run Sheets
- **Implementation**: `src/engine/timeline.ts` and `src/engine/compression.ts`.
- **Dependency Graph**: 5 distinct phases with cycle detection and automated delay propagation (e.g. marking "Book venue" delayed by 40 days automatically recalculates and warns dependent tasks with plain-language explanations).
- **Proportional Compression**: When runway < longest lead time, the engine scales lead times proportionally so no task starts in the past while preserving prerequisite ordering.
- **Export**: Generates RFC 5545 compliant `.ics` calendar files with proper line folding and character escaping.
- Verified by tests in `tests/engine/timeline.test.ts` and `tests/engine/compression.test.ts`.

### 4. Vendor Checklists & Quotation Analyzer
- **Implementation**: `src/components/plan/VendorsPanel.tsx`, `server/routes/index.ts`, and `src/schemas/ai.ts`.
- Extracts structured quotation metadata from pasted vendor emails or WhatsApp messages: total price, advance requirement, per-plate rate, guest minimum, GST status, overtime rates, and cancellation policy.
- Flags missing GST, unstated cancellation policies, and compares up to 3 vendor quotes side by side.

### 5. Personalized Ideas
- **Implementation**: `src/components/plan/IdeasPanel.tsx`, `server/routes/index.ts`, and `src/schemas/ai.ts`.
- Synthesizes cultural themes, festive decor accents, traditional & fusion food menus, family activities, and invitation messages tuned to the occasion, vibe, and guest count.

### 6. Signature Feature: Plan Rescue
- **Implementation**: `src/engine/risks.ts`, `src/engine/readiness.ts`, and `src/components/plan/RescuePanel.tsx`.
- **Deterministic Risk Engine**: 7 core rules evaluating:
  - Season/city monsoon weather lookup.
  - Auspicious festival-season vendor shortage (Diwali, Muhurat peak).
  - Single-vendor critical path bottlenecks.
  - Vendor quotations lacking cancellation clauses.
  - Thin emergency contingency (< 5%).
  - Guest counts exceeding venue capacity.
  - Overdue critical path tasks.
- **AI Contextual Risks**: Gemini proposes up to 3 contextual risks validated against `GeminiRiskSchema`.
- **Readiness Score (0–100)**: Evaluated dynamically using quadratic severity × likelihood penalties; completed backup plans reduce penalty impact by 80%, animating the Diya gauge and firing celebratory petal bursts when reaching ≥ 90.

### 7. Multi-Language Localization
- **Implementation**: `src/locales/` (`en`, `hi`, `ta`, `te`, `kn`, `ml`), `src/lib/i18n.ts`, and `src/components/shared/LanguageSelector.tsx`.
- Complete coverage across 6 Indian languages with live `<html lang="...">` updates for screen readers.

### 8. Architectural Rigor
- Single repo, single deployable package (Node 20 + Express 4 serving compiled Vite SPA).
- Zero-database, zero-account architecture; plans live in local storage and shareable via compressed Base64url tokens (<48KB).
- Full WCAG 2.1 AA accessibility compliance and tested dark/light contrast ratios.

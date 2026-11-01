# Accessibility Architecture (a11y) — UtsavAI

## Overview

UtsavAI is built to conform strictly with **WCAG 2.1 AA** accessibility guidelines, ensuring complete usability for screen reader users, keyboard-only navigators, and users requiring high-contrast or multilingual interfaces.

---

## Key Accessibility Features

### 1. Keyboard Navigation
- **Skip Links**: The root of the application provides a `#main-content` skip link (`SkipLink.tsx`) allowing keyboard users to bypass navigation headers immediately.
- **Focus Trap & Move**: Changing tabs in the planner automatically shifts focus to the panel's level 1 heading, announcing the current screen to screen readers.
- **Visible Focus Rings**: All interactive controls feature high-contrast `3px` focus rings (`var(--focus-ring)`).

### 2. Screen Reader Live Announcements
- The `announceToScreenReader` utility in `src/lib/a11y.ts` injects polite live region updates when:
  - Language is changed.
  - Categories are locked or unlocked.
  - Budget redistribution occurs.
  - Backups are completed in Plan Rescue.

### 3. Native Indian Typography & High Contrast
- The UI defaults to a dark mode palette (`var(--paper)`, `var(--ink)`) inspired by celebratory stationery with high contrast ratios (> 7:1 for text).
- Font sizes dynamically scale using clamp functions (`clamp(2.8rem, 7vw, 5.5rem)`).
- Touch targets meet the minimum 44px × 44px standard (`var(--touch)`).

### 4. Multilingual Switching
- All 6 Indian languages (English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം) are selectable via accessible radio group components (`LanguageSelector.tsx`).
- Selecting a language dynamically updates the root `<html lang="...">` attribute so assistive technologies can switch pronunciation and synthesis engines instantly.


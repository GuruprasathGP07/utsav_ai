import type { PlanState } from './reducer.js';

/** @fileoverview Debounced localStorage autosave and load. */

const STORAGE_KEY = 'utsavai_plan_v2';
const DEBOUNCE_MS = 800;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Saves plan state to localStorage, debounced by 800ms. */
export function autosave(state: PlanState): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const json = JSON.stringify(state);
      if (json.length > 2_000_000) return; // 2MB cap
      localStorage.setItem(STORAGE_KEY, json);
    } catch {
      // QuotaExceededError — silently ignore
    }
  }, DEBOUNCE_MS);
}

/** Loads saved plan state from localStorage. Returns null on any failure. */
export function loadSaved(): PlanState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlanState;
  } catch {
    return null;
  }
}

/** Clears the saved plan from localStorage. */
export function clearSaved(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

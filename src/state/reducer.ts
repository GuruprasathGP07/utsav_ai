import type { Plan, Brief, Task, Vendor } from '../schemas/plan.js';
import { computeTimeline } from '../engine/timeline.js';
import { computeBudget } from '../engine/budget.js';
import { getPreset } from '../engine/presets.js';

/** @fileoverview Pure plan reducer — all state transitions live here. No side-effects. */

export type PlanAction =
  | { type: 'INIT_PLAN';     payload: { plan: Plan } }
  | { type: 'UPDATE_BRIEF';  payload: Partial<Brief> }
  | { type: 'UPDATE_BUDGET'; payload: { categoryKey: string; amount: number } }
  | { type: 'TOGGLE_LOCK';   payload: { categoryKey: string } }
  | { type: 'SET_PRIORITY';  payload: { categoryKey: string; priority: 'normal' | 'high' } }
  | { type: 'UPDATE_TASK';   payload: Partial<Task> & { id: string } }
  | { type: 'ADD_VENDOR';    payload: { vendor: Vendor } }
  | { type: 'UPDATE_VENDOR'; payload: Partial<Vendor> & { id: string } }
  | { type: 'REMOVE_VENDOR'; payload: { id: string } }
  | { type: 'ACCEPT_QUOTE';  payload: { vendorId: string; quoteIndex: number } }
  | { type: 'TOGGLE_BACKUP_DONE'; payload: { riskId: string } }
  | { type: 'SET_IDEAS';     payload: { ideas: Record<string, string[]> } }
  | { type: 'RESET_PLAN' };

export interface PlanState {
  plan:    Plan | null;
  backups: Record<string, boolean>; // riskId -> done
}

export const initialPlanState: PlanState = { plan: null, backups: {} };

function now(): string { return new Date().toISOString(); }

export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {

    case 'INIT_PLAN':
      return { ...state, plan: action.payload.plan, backups: {} };

    case 'RESET_PLAN':
      return initialPlanState;

    case 'UPDATE_BRIEF': {
      if (!state.plan) return state;
      const brief = { ...state.plan.brief, ...action.payload };
      // Recompute timeline when date changes
      const today = new Date().toISOString().slice(0, 10);
      const preset = getPreset(brief.occasion);
      const { tasks } = computeTimeline({
        tasks: state.plan.tasks,
        eventDate: brief.eventDate,
        today,
      });
      // Recompute budget when guests change
      let budget = state.plan.budget;
      if (action.payload.guests != null && action.payload.guests !== state.plan.brief.guests) {
        const result = computeBudget({
          total:        brief.budget,
          weights:      state.plan.budget.categories,
          bounds:       preset.bounds,
          perGuestKeys: preset.perGuestKeys,
          guests:       brief.guests,
          prevGuests:   state.plan.brief.guests,
        });
        budget = { total: brief.budget, categories: [...result.categories] };
      }
      return {
        ...state,
        plan: { ...state.plan, brief, tasks: [...tasks], budget, updatedAt: now() },
      };
    }

    case 'UPDATE_BUDGET': {
      if (!state.plan) return state;
      const { categoryKey, amount } = action.payload;
      const preset = getPreset(state.plan.brief.occasion);
      const result = computeBudget({
        total:        state.plan.budget.total,
        weights:      state.plan.budget.categories.map(c =>
          c.key === categoryKey ? { ...c, percent: (amount / state.plan!.budget.total) * 100 } : c,
        ),
        bounds:       preset.bounds,
        perGuestKeys: preset.perGuestKeys,
        guests:       state.plan.brief.guests,
      });
      return {
        ...state,
        plan: {
          ...state.plan,
          budget: { total: state.plan.budget.total, categories: [...result.categories] },
          updatedAt: now(),
        },
      };
    }

    case 'TOGGLE_LOCK': {
      if (!state.plan) return state;
      const cats = state.plan.budget.categories.map(c =>
        c.key === action.payload.categoryKey ? { ...c, locked: !c.locked } : c,
      );
      return { ...state, plan: { ...state.plan, budget: { ...state.plan.budget, categories: cats }, updatedAt: now() } };
    }

    case 'SET_PRIORITY': {
      if (!state.plan) return state;
      const cats = state.plan.budget.categories.map(c =>
        c.key === action.payload.categoryKey ? { ...c, priority: action.payload.priority } : c,
      );
      return { ...state, plan: { ...state.plan, budget: { ...state.plan.budget, categories: cats }, updatedAt: now() } };
    }

    case 'UPDATE_TASK': {
      if (!state.plan) return state;
      const { id, ...updates } = action.payload;
      const tasks = state.plan.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      const today = new Date().toISOString().slice(0, 10);
      const { tasks: recomputed } = computeTimeline({ tasks, eventDate: state.plan.brief.eventDate, today });
      return { ...state, plan: { ...state.plan, tasks: [...recomputed], updatedAt: now() } };
    }

    case 'ADD_VENDOR': {
      if (!state.plan) return state;
      return { ...state, plan: { ...state.plan, vendors: [...state.plan.vendors, action.payload.vendor], updatedAt: now() } };
    }

    case 'UPDATE_VENDOR': {
      if (!state.plan) return state;
      const { id, ...updates } = action.payload;
      const vendors = state.plan.vendors.map(v => v.id === id ? { ...v, ...updates } : v);
      return { ...state, plan: { ...state.plan, vendors, updatedAt: now() } };
    }

    case 'REMOVE_VENDOR': {
      if (!state.plan) return state;
      return { ...state, plan: { ...state.plan, vendors: state.plan.vendors.filter(v => v.id !== action.payload.id), updatedAt: now() } };
    }

    case 'ACCEPT_QUOTE': {
      if (!state.plan) return state;
      const vendors = state.plan.vendors.map(v =>
        v.id === action.payload.vendorId
          ? { ...v, accepted: action.payload.quoteIndex, status: 'accepted' as const }
          : v,
      );
      return { ...state, plan: { ...state.plan, vendors, updatedAt: now() } };
    }

    case 'TOGGLE_BACKUP_DONE': {
      const { riskId } = action.payload;
      return { ...state, backups: { ...state.backups, [riskId]: !state.backups[riskId] } };
    }

    case 'SET_IDEAS': {
      if (!state.plan) return state;
      return { ...state, plan: { ...state.plan, ideas: action.payload.ideas, updatedAt: now() } };
    }

    default:
      return state;
  }
}

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { planReducer, initialPlanState, type PlanState, type PlanAction } from './reducer.js';
import { autosave, loadSaved } from './autosave.js';

/** @fileoverview React context + useReducer store for the plan. Autosaves on every change. */

interface PlanContextValue {
  state:    PlanState;
  dispatch: React.Dispatch<PlanAction>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

/** Provides plan state to the entire app. Loads from localStorage on mount. */
export function PlanProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [state, dispatch] = useReducer(planReducer, initialPlanState, () => {
    const saved = loadSaved();
    return saved ?? initialPlanState;
  });

  // Autosave on every state change (debounced inside autosave)
  useEffect(() => {
    if (state.plan) autosave(state);
  }, [state]);

  return (
    <PlanContext.Provider value={{ state, dispatch }}>
      {children}
    </PlanContext.Provider>
  );
}

/** Returns plan state and dispatch. Throws if used outside PlanProvider. */
export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}

/** Convenience selector — returns the current plan or null. */
export function usePlanData() {
  return usePlan().state.plan;
}

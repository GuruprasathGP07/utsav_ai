import type {
  ParseIntakeResponse,
  ExtractQuoteResponse,
  IdeasResponse,
  GenerateRisksResponse,
  PlanReviewResponse,
  PlannerChatResponse,
  TradeoffExplainResponse,
} from '../schemas/ai.js';
import type { Brief, Budget, Task, Vendor } from '../schemas/plan.js';

/** @fileoverview Typed API client for client-server communication. */

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function postJson<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return { ok: false, error: errJson.error?.message ?? `Request failed with status ${res.status}` };
    }
    const json = await res.json() as { data?: T };
    if (json.data === undefined) {
      return { ok: false, error: 'Empty response payload' };
    }
    return { ok: true, data: json.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const apiClient = {
  checkHealth: async (): Promise<{ ok: boolean; demo: boolean }> => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json() as { demo?: boolean };
        return { ok: true, demo: json.demo ?? false };
      }
      return { ok: false, demo: true };
    } catch {
      return { ok: false, demo: true };
    }
  },

  parseIntake: (sentence: string, language = 'en') =>
    postJson<ParseIntakeResponse>('/api/parse-intake', { sentence, language }),

  extractQuote: (rawText: string, categoryHint?: string) =>
    postJson<ExtractQuoteResponse>('/api/extract-quote', { rawText, categoryHint }),

  generateIdeas: (brief: Brief) =>
    postJson<IdeasResponse>('/api/generate-ideas', { brief }),

  generateRisks: (brief: Brief, budget: Budget, tasks: ReadonlyArray<Task>, vendors: ReadonlyArray<Vendor>) =>
    postJson<GenerateRisksResponse>('/api/generate-risks', { brief, budget, tasks, vendors }),

  explainTradeoffs: (brief: Brief, overage: number, options: Array<{ label: string; effect: string }>) =>
    postJson<TradeoffExplainResponse>('/api/explain-options', { brief, overage, options }),

  reviewPlan: (brief: Brief, budget: Budget, tasks: ReadonlyArray<Task>, vendors: ReadonlyArray<Vendor>) =>
    postJson<PlanReviewResponse>('/api/review-plan', { brief, budget, tasks, vendors }),

  chat: (message: string, history: Array<{ role: 'user' | 'assistant'; text: string }>, planSummary: string) =>
    postJson<PlannerChatResponse>('/api/chat', { message, history, planSummary }),
};

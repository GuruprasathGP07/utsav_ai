import type { Risk } from './risks.js';

/** @fileoverview Plan Rescue readiness score engine.
 * score = 100 - Σ(severity × likelihood × 0.8); backupDone reduces penalty by 80%.
 * Clamped to [0, 100]. No AI calls. */

export interface ReadinessResult {
  score:      number;  // 0-100, integer
  breakdown:  Readonly<Record<string, number>>; // by risk category
  topActions: ReadonlyArray<{
    riskId:          string;
    title:           string;
    penaltyReduction: number;
    costRupees:      number | null;
    dueDaysBefore:   number;
  }>;
}

const SCALE = 0.8;
const BACKUP_DONE_FACTOR = 0.2; // backupDone counts only 20% of penalty

/**
 * Computes penalty for a single risk.
 * If backup is done, only 20% of the penalty applies.
 */
function penalty(risk: Risk): number {
  const raw = risk.severity * risk.likelihood * SCALE;
  return risk.backupDone ? raw * BACKUP_DONE_FACTOR : raw;
}

/** Maximum possible penalty (all risks at severity=5, likelihood=5, undone). */
function maxPenalty(risks: ReadonlyArray<Risk>): number {
  return risks.reduce((s, r) => s + r.severity * r.likelihood * SCALE, 0);
}

/**
 * Computes the readiness score, category breakdown, and top-3 actions
 * ranked by penalty reduction per day (most urgent first).
 */
export function computeReadiness(risks: ReadonlyArray<Risk>): ReadinessResult {
  if (risks.length === 0) {
    return { score: 100, breakdown: {}, topActions: [] };
  }

  const totalPenalty = risks.reduce((s, r) => s + penalty(r), 0);
  const max          = maxPenalty(risks);
  const raw          = max > 0 ? 100 - (totalPenalty / max) * 100 : 100;
  const score        = Math.round(Math.max(0, Math.min(100, raw)));

  // Category breakdown: each category's penalty as a share of max (0-100)
  const catPenalty: Record<string, number> = {};
  for (const r of risks) {
    catPenalty[r.category] = (catPenalty[r.category] ?? 0) + penalty(r);
  }
  const breakdown: Record<string, number> = {};
  for (const [cat, p] of Object.entries(catPenalty)) {
    breakdown[cat] = Math.round(max > 0 ? (p / max) * 100 : 0);
  }

  // Top 3 actions: undone risks ranked by penaltyReduction / dueDaysBefore
  const undone = risks.filter(r => !r.backupDone);
  const ranked = undone
    .map(r => ({
      riskId:           r.id,
      title:            r.backup.action,
      penaltyReduction: Math.round(penalty(r) - penalty({ ...r, backupDone: true })),
      costRupees:       r.backup.costRupees,
      dueDaysBefore:    r.backup.dueDaysBefore,
    }))
    .sort((a, b) => {
      // Sort by penalty reduction / max(dueDaysBefore, 1) descending
      const urgencyA = a.penaltyReduction / Math.max(a.dueDaysBefore, 1);
      const urgencyB = b.penaltyReduction / Math.max(b.dueDaysBefore, 1);
      return urgencyB - urgencyA;
    })
    .slice(0, 3);

  return { score, breakdown, topActions: ranked };
}

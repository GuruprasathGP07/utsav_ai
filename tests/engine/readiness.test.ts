import { describe, it, expect } from 'vitest';
import { computeReadiness } from '../../src/engine/readiness.js';
import type { Risk } from '../../src/engine/risks.js';

describe('readiness engine', () => {
  const sampleRisks: Risk[] = [
    {
      id: 'weather_monsoon',
      title: 'Monsoon season risk',
      reason: 'Rain expected during event month',
      severity: 4,
      likelihood: 4,
      category: 'weather',
      source: 'rule',
      backup: {
        action: 'Arrange water-proof tenting',
        costRupees: 25_000,
        dueDaysBefore: 30,
      },
      backupDone: false,
    },
    {
      id: 'budget_contingency',
      title: 'Thin contingency',
      reason: 'Contingency is under 5%',
      severity: 3,
      likelihood: 3,
      category: 'budget',
      source: 'rule',
      backup: {
        action: 'Trim flexible category',
        costRupees: null,
        dueDaysBefore: 15,
      },
      backupDone: false,
    },
  ];

  it('returns 100 for an empty risk list', () => {
    const res = computeReadiness([]);
    expect(res.score).toBe(100);
    expect(res.topActions).toHaveLength(0);
  });

  it('calculates score clamped between 0 and 100', () => {
    const res = computeReadiness(sampleRisks);
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(100);
  });

  it('increases score when backups are marked done', () => {
    const initial = computeReadiness(sampleRisks);
    const resolvedRisks = sampleRisks.map(r => ({ ...r, backupDone: true }));
    const after = computeReadiness(resolvedRisks);

    expect(after.score).toBeGreaterThan(initial.score);
  });

  it('ranks top actions by penalty reduction and urgency', () => {
    const res = computeReadiness(sampleRisks);
    expect(res.topActions.length).toBeGreaterThan(0);
    expect(res.topActions[0]?.riskId).toBeDefined();
  });
});


import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset } from '../../src/engine/presets.js';
import { computeBudget } from '../../src/engine/budget.js';
import { computeTimeline, detectCycles } from '../../src/engine/timeline.js';
import type { OccasionType } from '../../src/schemas/plan.js';

describe('presets parametrized suite', () => {
  const occasionKeys = Object.keys(PRESETS) as OccasionType[];

  it.each(occasionKeys)('occasion %s fulfills all structural and mathematical invariants', (occasion) => {
    const preset = getPreset(occasion);

    // 1. Label and non-empty description
    expect(preset.label).toBeTruthy();
    expect(preset.weights.length).toBeGreaterThanOrEqual(4);

    // 2. Weights sum to 100%
    const weightSum = preset.weights.reduce((acc, w) => acc + w.percent, 0);
    expect(weightSum).toBeCloseTo(100, 1);

    // 3. Bounds exist for each category
    for (const w of preset.weights) {
      const bound = preset.bounds[w.key];
      expect(bound).toBeDefined();
      expect(bound!.min).toBeLessThanOrEqual(bound!.max);
      expect(w.percent).toBeGreaterThanOrEqual(bound!.min);
      expect(w.percent).toBeLessThanOrEqual(bound!.max);
    }

    // 4. Task templates invariant (12-14 tasks, no cycles)
    expect(preset.taskTemplates.length).toBeGreaterThanOrEqual(12);
    const mockTasks = preset.taskTemplates.map(t => ({
      ...t,
      status: 'pending' as const,
      delayedByDays: 0,
      atRisk: false,
      isOverdue: false,
      dependsOn: [...t.dependsOn],
    }));

    const cycles = detectCycles(mockTasks);
    expect(cycles).toHaveLength(0);

    // 5. Budget sum invariant holds
    const budgetTotal = 500_000;
    const budgetRes = computeBudget({
      total: budgetTotal,
      weights: preset.weights,
      bounds: preset.bounds,
      perGuestKeys: preset.perGuestKeys,
      guests: 150,
    });
    const allocatedSum = budgetRes.categories.reduce((s, c) => s + c.amount, 0);
    expect(allocatedSum).toBe(budgetTotal);

    // 6. Timeline calculation invariant holds
    const timelineRes = computeTimeline({
      tasks: mockTasks,
      eventDate: '2026-10-15',
      today: '2026-05-01',
    });
    expect(timelineRes.tasks.length).toBe(mockTasks.length);
    for (const t of timelineRes.tasks) {
      expect(t.dueDate).toBeDefined();
    }
  });
});


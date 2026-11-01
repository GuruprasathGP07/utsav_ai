import { describe, it, expect } from 'vitest';
import { computeBudget, redistributeCategory } from '../../src/engine/budget.js';
import { getPreset } from '../../src/engine/presets.js';

describe('budget engine', () => {
  const weddingPreset = getPreset('wedding');

  it('guarantees that category amounts sum exactly to total integer rupees', () => {
    const total = 800_000;
    const result = computeBudget({
      total,
      weights: weddingPreset.weights,
      bounds: weddingPreset.bounds,
      perGuestKeys: weddingPreset.perGuestKeys,
      guests: 300,
    });

    const sum = result.categories.reduce((acc, c) => acc + c.amount, 0);
    expect(sum).toBe(total);
    expect(result.total).toBe(total);
  });

  it('property check: 100 arbitrary budget amounts all sum to exact total', () => {
    for (let i = 0; i < 100; i++) {
      const total = 10_000 + Math.floor(Math.random() * 5_000_000);
      const guests = 20 + Math.floor(Math.random() * 800);
      const result = computeBudget({
        total,
        weights: weddingPreset.weights,
        bounds: weddingPreset.bounds,
        perGuestKeys: weddingPreset.perGuestKeys,
        guests,
      });

      const sum = result.categories.reduce((acc, c) => acc + c.amount, 0);
      expect(sum).toBe(total);
    }
  });

  it('respects high priority weighting (boosted by x1.25)', () => {
    const normalResult = computeBudget({
      total: 1_000_000,
      weights: weddingPreset.weights.map(w => ({ ...w, priority: 'normal' as const })),
      bounds: weddingPreset.bounds,
      perGuestKeys: weddingPreset.perGuestKeys,
      guests: 200,
    });

    const highResult = computeBudget({
      total: 1_000_000,
      weights: weddingPreset.weights.map(w =>
        w.key === 'decor' ? { ...w, priority: 'high' as const } : { ...w, priority: 'normal' as const },
      ),
      bounds: weddingPreset.bounds,
      perGuestKeys: weddingPreset.perGuestKeys,
      guests: 200,
    });

    const decorNormal = normalResult.categories.find(c => c.key === 'decor')!.amount;
    const decorHigh = highResult.categories.find(c => c.key === 'decor')!.amount;
    expect(decorHigh).toBeGreaterThan(decorNormal);
  });

  it('redistributeCategory maintains exact sum when user increases one category', () => {
    const initial = computeBudget({
      total: 500_000,
      weights: weddingPreset.weights,
      bounds: weddingPreset.bounds,
      perGuestKeys: weddingPreset.perGuestKeys,
      guests: 150,
    });

    const budget = { total: 500_000, categories: [...initial.categories] };
    const changed = redistributeCategory(budget, 'photography', 80_000);
    const sum = changed.categories.reduce((acc, c) => acc + c.amount, 0);
    expect(sum).toBe(500_000);
    expect(changed.categories.find(c => c.key === 'photography')!.amount).toBe(80_000);
  });
});


import { describe, it, expect } from 'vitest';
import { computeRisks } from '../../src/engine/risks.js';
import { getPreset } from '../../src/engine/presets.js';

describe('risks engine', () => {
  const weddingPreset = getPreset('wedding');

  it('detects thin contingency risk when contingency < 5%', () => {
    const risks = computeRisks({
      brief: {
        occasion: 'wedding',
        city: 'Chennai',
        eventDate: '2026-12-15',
        guests: 300,
        budget: 800_000,
        currency: 'INR',
        priorities: [],
        vibe: 'traditional',
        extras: [],
        language: 'en',
        title: 'Meena Wedding',
      },
      budget: {
        total: 800_000,
        categories: [
          { key: 'catering', label: 'Catering', percent: 50, amount: 400_000, locked: false, priority: 'normal', isExtras: false, estimate: true },
          { key: 'contingency', label: 'Contingency', percent: 2, amount: 16_000, locked: false, priority: 'normal', isExtras: false, estimate: true },
        ],
      },
      tasks: [],
      vendors: [],
      today: '2026-06-01',
    });

    const contingencyRisk = risks.find(r => r.id === 'budget_thin_contingency');
    expect(contingencyRisk).toBeDefined();
    expect(contingencyRisk?.severity).toBe(3);
  });

  it('detects monsoon risk for coastal cities during monsoon months', () => {
    const risks = computeRisks({
      brief: {
        occasion: 'wedding',
        city: 'Mumbai',
        eventDate: '2026-07-20',
        guests: 200,
        budget: 500_000,
        currency: 'INR',
        priorities: [],
        vibe: '',
        extras: [],
        language: 'en',
        title: 'Mumbai Monsoon Wedding',
      },
      budget: {
        total: 500_000,
        categories: weddingPreset.weights.map(w => ({ ...w, amount: 50_000, locked: false, priority: 'normal' as const, isExtras: false, estimate: true })),
      },
      tasks: [],
      vendors: [],
      today: '2026-01-01',
    });

    const weatherRisk = risks.find(r => r.category === 'weather');
    expect(weatherRisk).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';
import { PlanSchema, BriefSchema } from '../../src/schemas/plan.js';
import { encodeShareLink, decodeShareLink } from '../../src/schemas/share.js';
import type { Plan } from '../../src/schemas/plan.js';

describe('schemas & share codec', () => {
  const samplePlan: Plan = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    brief: {
      occasion: 'wedding',
      city: 'Chennai',
      eventDate: '2026-12-15',
      guests: 300,
      budget: 800_000,
      currency: 'INR',
      priorities: ['catering', 'decor'],
      vibe: 'Traditional Chettinad',
      extras: ['dj', 'mehndi'],
      language: 'en',
      title: "Meena's Sister Wedding",
    },
    budget: {
      total: 800_000,
      categories: [
        { key: 'catering', label: 'Catering', percent: 40, amount: 320_000, locked: false, priority: 'normal', isExtras: false, estimate: true },
        { key: 'venue', label: 'Venue', percent: 25, amount: 200_000, locked: false, priority: 'normal', isExtras: false, estimate: true },
        { key: 'decor', label: 'Decor', percent: 15, amount: 120_000, locked: false, priority: 'normal', isExtras: false, estimate: true },
        { key: 'contingency', label: 'Contingency', percent: 20, amount: 160_000, locked: false, priority: 'normal', isExtras: false, estimate: true },
      ],
    },
    tasks: [
      {
        id: 't_venue',
        title: 'Book Kalyana Mandapam',
        phase: 1,
        leadTimeDays: 180,
        dependsOn: [],
        categoryKey: 'venue',
        status: 'pending',
        delayedByDays: 0,
        atRisk: false,
        isOverdue: false,
        essential: true,
      },
    ],
    vendors: [],
    ideas: {
      decor: ['Marigold flower toran with brass bells', 'Chettinad wooden pillar backdrop'],
    },
    readyToShare: true,
  };

  it('validates a correct plan against PlanSchema', () => {
    const parsed = PlanSchema.safeParse(samplePlan);
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid brief with negative budget or zero guests', () => {
    const invalidBrief = {
      ...samplePlan.brief,
      budget: -100,
      guests: 0,
    };
    const parsed = BriefSchema.safeParse(invalidBrief);
    expect(parsed.success).toBe(false);
  });

  it('encodeShareLink generates a URL-safe string < 48KB', () => {
    const token = encodeShareLink(samplePlan);
    expect(typeof token).toBe('string');
    expect(token.length).toBeLessThan(48 * 1024);
    // URL safe characters only (no + or / or =)
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
  });

  it('decodeShareLink inverts encodeShareLink exactly', () => {
    const token = encodeShareLink(samplePlan);
    const decoded = decodeShareLink(token);

    expect(decoded.id).toBe(samplePlan.id);
    expect(decoded.brief.city).toBe(samplePlan.brief.city);
    expect(decoded.brief.budget).toBe(samplePlan.brief.budget);
    expect(decoded.budget.total).toBe(samplePlan.budget.total);
    expect(decoded.tasks.length).toBe(samplePlan.tasks.length);
  });

  it('throws on tampered or corrupted token', () => {
    const token = encodeShareLink(samplePlan);
    const tampered = token.slice(0, -6) + 'XXXXXX';
    expect(() => decodeShareLink(tampered)).toThrow();
  });
});


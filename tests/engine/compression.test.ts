import { describe, it, expect } from 'vitest';
import {
  compressTimeline,
  buildRunSheet,
  exportToICS,
} from '../../src/engine/compression.js';
import type { Task } from '../../src/schemas/plan.js';

describe('compression engine', () => {
  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Long Lead Item',
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
    {
      id: 't2',
      title: 'Medium Lead Item',
      phase: 2,
      leadTimeDays: 90,
      dependsOn: [],
      categoryKey: 'catering',
      status: 'pending',
      delayedByDays: 0,
      atRisk: false,
      isOverdue: false,
      essential: true,
    },
    {
      id: 't3',
      title: 'Day-of Setup',
      phase: 5,
      leadTimeDays: 0,
      dependsOn: [],
      categoryKey: 'decor',
      status: 'pending',
      delayedByDays: 0,
      atRisk: false,
      isOverdue: false,
      essential: true,
    },
  ];

  it('compresses lead times uniformly when runway < maxLeadTime', () => {
    const today = '2026-01-01';
    const eventDate = '2026-03-01'; // 59 days runway < 180 days max lead time
    const runway = 59;

    const result = compressTimeline({ tasks, eventDate, today, runway });

    expect(result.isCompressed).toBe(true);
    expect(result.scaleFactor).toBeCloseTo(59 / 180, 2);
    // Verified invariant: no task dueDate is set before today
    for (const t of result.tasks) {
      if (t.dueDate) {
        expect(t.dueDate >= today).toBe(true);
      }
    }
  });

  it('builds run sheet including day-of tasks', () => {
    const runSheet = buildRunSheet(tasks, '2026-03-01');
    expect(runSheet.some(t => t.id === 't3')).toBe(true);
  });

  it('exports RFC 5545 valid .ics calendar string', () => {
    const tasksWithDueDates = tasks.map(t => ({ ...t, dueDate: '2026-03-01' }));
    const ics = exportToICS(tasksWithDueDates, 'Tamil Wedding', '2026-03-01');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//UtsavAI//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});

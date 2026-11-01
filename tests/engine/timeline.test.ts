import { describe, it, expect } from 'vitest';
import {
  computeTimeline,
  detectCycles,
  daysBetween,
  addDays,
} from '../../src/engine/timeline.js';
import type { Task } from '../../src/schemas/plan.js';

describe('timeline engine', () => {
  const sampleTasks: Task[] = [
    {
      id: 'task_venue',
      title: 'Book Venue',
      phase: 1,
      leadTimeDays: 120,
      dependsOn: [],
      categoryKey: 'venue',
      status: 'pending',
      delayedByDays: 0,
      atRisk: false,
      isOverdue: false,
      essential: true,
    },
    {
      id: 'task_caterer',
      title: 'Book Caterer',
      phase: 2,
      leadTimeDays: 90,
      dependsOn: ['task_venue'],
      categoryKey: 'catering',
      status: 'pending',
      delayedByDays: 0,
      atRisk: false,
      isOverdue: false,
      essential: true,
    },
  ];

  it('computes due dates based on event date and lead times', () => {
    const today = '2026-01-01';
    const eventDate = '2026-06-01'; // 151 days away
    const result = computeTimeline({ tasks: sampleTasks, eventDate, today });

    expect(result.daysToEvent).toBe(daysBetween(today, eventDate));
    expect(result.tasks[0]?.dueDate).toBe(addDays(eventDate, -120));
    expect(result.tasks[1]?.dueDate).toBe(addDays(eventDate, -90));
  });

  it('detects cycles in task dependencies', () => {
    const cyclicTasks: Task[] = [
      {
        ...sampleTasks[0]!,
        id: 'A',
        dependsOn: ['B'],
      },
      {
        ...sampleTasks[1]!,
        id: 'B',
        dependsOn: ['A'],
      },
    ];

    const cycle = detectCycles(cyclicTasks);
    expect(cycle.length).toBeGreaterThan(0);
  });

  it('flags dependent tasks when a prerequisite is delayed', () => {
    const delayedTasks: Task[] = [
      {
        ...sampleTasks[0]!,
        delayedByDays: 45,
        status: 'delayed',
      },
      {
        ...sampleTasks[1]!,
        delayedByDays: 0,
      },
    ];

    const result = computeTimeline({
      tasks: delayedTasks,
      eventDate: '2026-06-01',
      today: '2026-01-01',
    });

    const caterer = result.tasks.find(t => t.id === 'task_caterer');
    expect(caterer?.atRisk).toBe(true);
    expect(caterer?.delayReason).toContain('Book Venue delayed by 45 days');
  });
});

import type { Task } from '../schemas/plan.js';

/** @fileoverview Timeline engine — dependency graph, phases, delay propagation, compression.
 * "today" is always a parameter; no Date.now() calls inside this engine. */

export interface TimelineInput {
  tasks:     ReadonlyArray<Task>;
  eventDate: string;   // YYYY-MM-DD
  today:     string;   // YYYY-MM-DD — injected, not read from clock
}

export interface TimelineOutput {
  tasks:        ReadonlyArray<Task>;
  isCompressed: boolean;
  daysToEvent:  number;
  warnings:     ReadonlyArray<string>;
}

/** Parses YYYY-MM-DD to UTC midnight. */
function parseDate(d: string): Date {
  const [y, mo, day] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, mo - 1, day));
}

/** Formats UTC Date to YYYY-MM-DD. */
export function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns days between two YYYY-MM-DD strings (positive = b is after a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

/** Adds N days to a YYYY-MM-DD string. */
export function addDays(d: string, days: number): string {
  const date = parseDate(d);
  date.setUTCDate(date.getUTCDate() + days);
  return toYMD(date);
}

/**
 * Detects dependency cycles using DFS.
 * Returns the IDs involved in the first cycle found, or empty array if none.
 */
export function detectCycles(tasks: ReadonlyArray<Task>): ReadonlyArray<string> {
  const map = new Map(tasks.map(t => [t.id, t]));
  const visiting = new Set<string>();
  const visited  = new Set<string>();

  const dfs = (id: string, path: string[]): string[] | null => {
    if (visiting.has(id)) return [...path, id];
    if (visited.has(id))  return null;
    visiting.add(id);
    for (const dep of map.get(id)?.dependsOn ?? []) {
      const cycle = dfs(dep, [...path, id]);
      if (cycle) return cycle;
    }
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const t of tasks) {
    const cycle = dfs(t.id, []);
    if (cycle) return cycle;
  }
  return [];
}

/**
 * Computes due dates for all tasks respecting dependencies.
 * Due date = eventDate - leadTimeDays (after propagating delays).
 * Returns tasks with dueDate, atRisk, isOverdue populated.
 */
export function computeTimeline(input: TimelineInput): TimelineOutput {
  const { eventDate, today } = input;
  const warnings: string[] = [];
  const daysToEvent = daysBetween(today, eventDate);

  // Cycle detection
  const cycles = detectCycles(input.tasks);
  if (cycles.length > 0) {
    warnings.push(`Dependency cycle detected: ${cycles.join(' → ')}`);
  }

  const taskMap = new Map(input.tasks.map(t => [t.id, { ...t }]));

  // Propagate delays: when a task is delayed, all dependents get flagged
  const propagateDelay = (id: string, delayDays: number, reason: string): void => {
    for (const t of taskMap.values()) {
      if (t.dependsOn.includes(id) && delayDays > 0) {
        const prev = t.delayedByDays;
        t.delayedByDays = Math.max(prev, delayDays);
        t.delayReason = reason;
        t.atRisk = true;
        propagateDelay(t.id, delayDays, `cascade from: ${reason}`);
      }
    }
  };

  for (const t of taskMap.values()) {
    if (t.delayedByDays > 0 && t.status === 'delayed') {
      propagateDelay(t.id, t.delayedByDays, t.delayReason ?? `${t.title} delayed by ${t.delayedByDays} days`);
    }
  }

  // Compute due dates
  const tasks: Task[] = [];
  for (const t of taskMap.values()) {
    const effectiveLeadTime = t.leadTimeDays + t.delayedByDays;
    const dueDate = addDays(eventDate, -effectiveLeadTime);
    const isOverdue = t.status !== 'done' && daysBetween(today, dueDate) < 0;
    const atRisk    = t.atRisk || (t.status !== 'done' && daysBetween(today, dueDate) < 7);

    tasks.push({ ...t, dueDate, isOverdue, atRisk });
  }

  // Sort by dueDate ascending
  tasks.sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return a.dueDate < b.dueDate ? -1 : 1;
  });

  // Check if compression needed
  const maxLeadTime = Math.max(...input.tasks.map(t => t.leadTimeDays), 0);
  const isCompressed = daysToEvent < maxLeadTime;

  if (isCompressed) {
    warnings.push(
      `Event is ${daysToEvent} days away but longest lead time is ${maxLeadTime} days. Timeline compressed.`,
    );
  }

  return { tasks, isCompressed, daysToEvent, warnings };
}

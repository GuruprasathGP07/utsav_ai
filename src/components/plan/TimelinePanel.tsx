import React from 'react';
import { usePlan } from '../../state/store.js';
import { useToast } from '../shared/Toast.js';
import { daysBetween } from '../../engine/timeline.js';
import { CheckCircle, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

/** @fileoverview Timeline tab — phased task list with status, delay propagation, due dates. */

const PHASE_LABELS = ['', 'Foundations', 'Planning', 'Confirmation', 'Final week', 'Day-of'];
const STATUS_ICONS = {
  done:       <CheckCircle  size={16} style={{ color: 'var(--leaf)' }}          aria-hidden="true" />,
  pending:    <Clock        size={16} style={{ color: 'var(--ink-muted)' }}      aria-hidden="true" />,
  delayed:    <AlertCircle  size={16} style={{ color: 'var(--kumkum)' }}         aria-hidden="true" />,
  impossible: <AlertTriangle size={16} style={{ color: 'var(--marigold-mid)' }}  aria-hidden="true" />,
};

export default function TimelinePanel(): React.ReactElement {
  const { state, dispatch } = usePlan();
  const { toast } = useToast();
  const plan = state.plan!;
  const today = new Date().toISOString().slice(0, 10);

  const byPhase = [1,2,3,4,5].map(phase => ({
    phase,
    label: PHASE_LABELS[phase] ?? `Phase ${phase}`,
    tasks: plan.tasks.filter(t => t.phase === phase),
  }));

  const toggleDone = (id: string, isDone: boolean) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, status: isDone ? 'done' : 'pending' } });
    const task = plan.tasks.find(t => t.id === id);
    toast(`${task?.title} marked ${isDone ? 'done' : 'pending'}`, 'success');
  };

  const markDelayed = (id: string, days: number) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, status: 'delayed', delayedByDays: days } });
    const task = plan.tasks.find(t => t.id === id);
    toast(`${task?.title} delayed by ${days} days — cascade updated`, 'warning');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-10)' }}>
      {byPhase.map(({ phase, label, tasks }) => {
        if (tasks.length === 0) return null;
        return (
          <section key={phase} aria-labelledby={`phase-${phase}`}>
            <h2 id={`phase-${phase}`} style={{
              fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)',
              paddingBottom: 'var(--sp-3)', borderBottom: 'var(--border)',
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--peacock)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-sm)', fontWeight: 700,
              }} aria-hidden="true">{phase}</span>
              {label}
            </h2>
            <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {tasks.map(task => {
                const dueIn = task.dueDate ? daysBetween(today, task.dueDate) : null;
                const isDone = task.status === 'done';
                return (
                  <li key={task.id} className="card" style={{
                    padding: 'var(--sp-4) var(--sp-5)',
                    borderLeft: `4px solid ${
                      isDone ? 'var(--leaf)' :
                      task.isOverdue ? 'var(--kumkum)' :
                      task.atRisk ? 'var(--marigold-mid)' : 'var(--line-strong)'
                    }`,
                    opacity: isDone ? 0.7 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
                      {/* Status icon */}
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        {STATUS_ICONS[task.status]}
                      </div>

                      {/* Task info */}
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          marginBottom: 'var(--sp-1)',
                        }}>
                          {task.title}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                          <span>Due: {task.dueDate ?? '—'}</span>
                          {dueIn !== null && !isDone && (
                            <span style={{ color: dueIn < 0 ? 'var(--kumkum)' : dueIn < 14 ? 'var(--marigold-mid)' : 'var(--leaf)' }}>
                              {dueIn < 0 ? `${Math.abs(dueIn)} days overdue` : `in ${dueIn} days`}
                            </span>
                          )}
                          {task.delayReason && (
                            <span style={{ color: 'var(--kumkum)' }}>⚠ {task.delayReason}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexShrink: 0 }}>
                        <button
                          onClick={() => toggleDone(task.id, !isDone)}
                          className="btn btn-secondary btn-sm"
                          aria-label={isDone ? `Mark ${task.title} as pending` : `Mark ${task.title} as done`}
                        >
                          {isDone ? 'Undo' : 'Done'}
                        </button>
                        {!isDone && (
                          <button
                            onClick={() => markDelayed(task.id, 14)}
                            className="btn btn-ghost btn-sm"
                            aria-label={`Mark ${task.title} as delayed by 14 days`}
                          >
                            +14d delay
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

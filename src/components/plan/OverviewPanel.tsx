import React from 'react';
import { usePlan } from '../../state/store.js';
import { formatINR, formatINRCompact } from '../../engine/money.js';
import { computeRisks } from '../../engine/risks.js';
import { computeReadiness } from '../../engine/readiness.js';
import { daysBetween } from '../../engine/timeline.js';
import { CalendarDays, CheckCircle, AlertCircle, Clock } from 'lucide-react';

/** @fileoverview Overview tab — Health gauge, Readiness diya, budget donut, next 3 actions. */

function DiyaGauge({ score }: { score: number }): React.ReactElement {
  const r    = 46;
  const circ = 2 * Math.PI * r;
  const pct  = score / 100;
  const color = score >= 90 ? 'var(--leaf)' : score >= 60 ? 'var(--marigold)' : 'var(--kumkum)';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 120 120" width="120" height="120" role="img"
        aria-label={`Plan Readiness ${score} out of 100`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--paper-3)" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1.4s var(--ease-out)' }}
        />
        <text x="60" y="58" textAnchor="middle" fontSize="22"
          fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)">{score}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="9"
          fill="var(--ink-muted)" fontFamily="var(--font-ui)">Readiness</text>
      </svg>
    </div>
  );
}

export default function OverviewPanel(): React.ReactElement {
  const { state } = usePlan();
  const plan = state.plan!;
  const today = new Date().toISOString().slice(0, 10);
  const daysToEvent = daysBetween(today, plan.brief.eventDate);

  const risks = computeRisks({
    brief: plan.brief, budget: plan.budget,
    tasks: plan.tasks, vendors: plan.vendors, today,
  }).map(r => ({ ...r, backupDone: state.backups[r.id] ?? false }));

  const { score, topActions } = computeReadiness(risks);

  const doneTasks    = plan.tasks.filter(t => t.status === 'done').length;
  const overdueTasks = plan.tasks.filter(t => t.isOverdue && t.status !== 'done').length;
  const atRiskTasks  = plan.tasks.filter(t => t.atRisk   && t.status !== 'done').length;

  const HEALTH_METRICS = [
    { label: 'Tasks done',    value: `${doneTasks}/${plan.tasks.length}`,  icon: CheckCircle, color: 'var(--leaf)' },
    { label: 'Overdue',       value: String(overdueTasks),                  icon: AlertCircle, color: 'var(--kumkum)' },
    { label: 'At risk',       value: String(atRiskTasks),                   icon: Clock,       color: 'var(--marigold-mid)' },
    { label: 'Days to event', value: daysToEvent > 0 ? `T-${daysToEvent}` : 'Event day!', icon: CalendarDays, color: 'var(--peacock)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>

      {/* Stat row */}
      <div className="grid-4" style={{ gap: 'var(--sp-4)' }}>
        {HEALTH_METRICS.map(m => (
          <div key={m.label} className="card" style={{ padding: 'var(--sp-5)' }}>
            <m.icon size={20} style={{ color: m.color, marginBottom: 'var(--sp-2)' }} aria-hidden="true" />
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{m.value}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: 'var(--sp-1)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Readiness + budget */}
      <div className="grid-2" style={{ gap: 'var(--sp-6)' }}>
        {/* Readiness diya */}
        <div className="card-elevated" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-8)', flexWrap: 'wrap' }}>
          <DiyaGauge score={score} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-3)' }}>Plan Rescue</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: 'var(--sp-4)' }}>
              {risks.filter(r => !r.backupDone).length} open risks · {risks.filter(r => r.backupDone).length} resolved
            </p>
            {topActions.length > 0 && (
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Top actions
                </p>
                {topActions.slice(0, 3).map((a, i) => (
                  <div key={a.riskId} style={{
                    display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start',
                    marginBottom: 'var(--sp-2)',
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--kumkum-pale)', color: 'var(--kumkum)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }} aria-hidden="true">{i + 1}</span>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                      {a.title.slice(0, 100)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget summary */}
        <div className="card-elevated">
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)' }}>
            Budget — {formatINRCompact(plan.budget.total)}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <caption className="sr-only">Budget categories</caption>
            <thead>
              <tr style={{ borderBottom: 'var(--border-strong)' }}>
                <th scope="col" style={{ textAlign: 'left', padding: 'var(--sp-2)' }}>Category</th>
                <th scope="col" style={{ textAlign: 'right', padding: 'var(--sp-2)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {plan.budget.categories.slice(0, 6).map(c => (
                <tr key={c.key} style={{ borderBottom: 'var(--border)' }}>
                  <td style={{ padding: 'var(--sp-2)' }}>{c.label}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--sp-2)', fontWeight: 600 }}>
                    {formatINRCompact(c.amount)}
                  </td>
                </tr>
              ))}
              {plan.budget.categories.length > 6 && (
                <tr>
                  <td colSpan={2} style={{ padding: 'var(--sp-2)', color: 'var(--ink-muted)', fontSize: 'var(--text-xs)' }}>
                    +{plan.budget.categories.length - 6} more categories
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: 'var(--border-strong)', fontWeight: 700 }}>
                <td style={{ padding: 'var(--sp-3)' }}>Total</td>
                <td style={{ textAlign: 'right', padding: 'var(--sp-3)' }}>
                  {formatINR(plan.budget.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

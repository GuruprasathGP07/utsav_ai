import React, { useEffect, useState } from 'react';
import { usePlan } from '../../state/store.js';
import { useToast } from '../shared/Toast.js';
import { computeRisks } from '../../engine/risks.js';
import { computeReadiness } from '../../engine/readiness.js';
import { formatINR } from '../../engine/money.js';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

/** @fileoverview Plan Rescue tab — deterministic risks + up to 3 AI risks, readiness score. */

const SEV_COLORS = ['', 'var(--leaf)', 'var(--leaf-mid)', 'var(--marigold)', 'var(--marigold-mid)', 'var(--kumkum)'];
const SEV_LABELS = ['', 'Minimal', 'Low', 'Medium', 'High', 'Critical'];
const CAT_EMOJIS: Record<string, string> = {
  weather: '🌧', vendor: '🤝', venue: '🏟', budget: '💰',
  timeline: '⏰', guest: '👥', legal: '⚖', health: '🏥', other: '⚡',
};

export default function RescuePanel(): React.ReactElement {
  const { state, dispatch } = usePlan();
  const { toast } = useToast();
  const plan = state.plan!;
  const today = new Date().toISOString().slice(0, 10);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRisks, setAiRisks] = useState<typeof computeRisks extends (...a: Parameters<typeof computeRisks>) => infer R ? R : never>([]);

  const ruleRisks = computeRisks({
    brief: plan.brief, budget: plan.budget,
    tasks: plan.tasks, vendors: plan.vendors, today,
  });

  const allRisks = [
    ...ruleRisks,
    ...aiRisks,
  ].map(r => ({ ...r, backupDone: state.backups[r.id] ?? false }));

  const { score } = computeReadiness(allRisks);

  // Petal burst on crossing 90
  useEffect(() => {
    if (score >= 90) spawnPetals();
  }, [score]);

  const fetchAiRisks = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/generate-risks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: plan.brief,
          existingRiskIds: ruleRisks.map(r => r.id),
        }),
      });
      if (!res.ok) { toast('AI risks unavailable', 'warning'); return; }
      const j = await res.json() as { data?: { risks?: typeof aiRisks }; demo?: boolean };
      if (j.demo) { toast('Demo mode — add GEMINI_API_KEY for AI risks', 'info'); return; }
      setAiRisks((j.data?.risks ?? []) as typeof aiRisks);
      toast(`${(j.data?.risks ?? []).length} AI risks added`, 'success');
    } catch { toast('Network error', 'error'); }
    finally { setAiLoading(false); }
  };

  const toggleBackup = (riskId: string, isDone: boolean) => {
    dispatch({ type: 'TOGGLE_BACKUP_DONE', payload: { riskId } });
    if (isDone) toast('Backup marked done — Readiness updated', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>

      {/* Score + AI generate */}
      <div className="card-elevated" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-8)', flexWrap: 'wrap' }}>
        {/* Score ring */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label={`Readiness score ${score} out of 100`}>
            <circle cx="60" cy="60" r="46" fill="none" stroke="var(--paper-3)" strokeWidth="12" />
            <circle cx="60" cy="60" r="46" fill="none"
              stroke={score >= 90 ? 'var(--leaf)' : score >= 60 ? 'var(--marigold)' : 'var(--kumkum)'}
              strokeWidth="12"
              strokeDasharray={2*Math.PI*46}
              strokeDashoffset={2*Math.PI*46*(1-score/100)}
              strokeLinecap="round" transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1.4s var(--ease-out)' }}
            />
            <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)">{score}</text>
            <text x="60" y="74" textAnchor="middle" fontSize="9" fill="var(--ink-muted)" fontFamily="var(--font-ui)">/ 100</text>
          </svg>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: score >= 90 ? 'var(--leaf)' : score >= 60 ? 'var(--marigold-deep)' : 'var(--kumkum)' }}>
            {score >= 90 ? '🎉 Excellent' : score >= 60 ? '⚠ Needs work' : '🔴 At risk'}
          </p>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 'var(--sp-3)' }}>Plan Rescue</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 'var(--sp-4)' }}>
            {allRisks.filter(r => !r.backupDone).length} open risks ·{' '}
            {allRisks.filter(r => r.backupDone).length} resolved ·{' '}
            {ruleRisks.length} rule-based · {aiRisks.length} AI risks
          </p>
          <button
            onClick={fetchAiRisks}
            disabled={aiLoading}
            className="btn btn-secondary btn-sm"
          >
            {aiLoading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</> : <><Shield size={14} /> Scan with AI</>}
          </button>
        </div>
      </div>

      {/* Risk list */}
      {allRisks.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }} aria-hidden="true">✅</div>
          <p style={{ color: 'var(--ink-soft)' }}>No risks detected — your plan looks clean!</p>
        </div>
      )}

      {allRisks.map(risk => (
        <div key={risk.id} className="card" style={{
          borderLeft: `4px solid ${SEV_COLORS[risk.severity]}`,
          opacity: risk.backupDone ? 0.65 : 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)', flexWrap: 'wrap' }}>
                <span aria-hidden="true">{CAT_EMOJIS[risk.category] ?? '⚡'}</span>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, textDecoration: risk.backupDone ? 'line-through' : 'none' }}>
                  {risk.title}
                </h3>
                <span className="badge" style={{
                  background: `${SEV_COLORS[risk.severity]}22`,
                  color: SEV_COLORS[risk.severity],
                }}>
                  {SEV_LABELS[risk.severity]}
                </span>
                {risk.source === 'gemini' && <span className="badge badge-marigold">AI</span>}
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: 'var(--sp-3)' }}>
                {risk.reason}
              </p>

              {/* Backup action */}
              <div style={{
                background: risk.backupDone ? 'var(--leaf-pale)' : 'var(--peacock-pale)',
                border: `1px solid ${risk.backupDone ? 'var(--leaf)' : 'var(--peacock)'}`,
                borderRadius: 'var(--r-sm)', padding: 'var(--sp-3) var(--sp-4)',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: risk.backupDone ? 'var(--leaf)' : 'var(--peacock)', marginBottom: 'var(--sp-1)' }}>
                  ⚡ Backup plan
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
                  {risk.backup.action}
                </p>
                {risk.backup.costRupees != null && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: 'var(--sp-1)' }}>
                    Est. cost: {formatINR(risk.backup.costRupees)} · {risk.backup.dueDaysBefore} days before event
                  </p>
                )}
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggleBackup(risk.id, !risk.backupDone)}
              aria-pressed={risk.backupDone}
              aria-label={risk.backupDone ? `Mark backup for "${risk.title}" as not done` : `Mark backup for "${risk.title}" as done`}
              className={`btn btn-sm ${risk.backupDone ? 'btn-secondary' : 'btn-peacock'}`}
              style={{ flexShrink: 0 }}
            >
              {risk.backupDone
                ? <><CheckCircle size={14} aria-hidden="true" /> Done</>
                : <><AlertTriangle size={14} aria-hidden="true" /> Mark done</>}
            </button>
          </div>
        </div>
      ))}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Creates 20 petal elements and removes them after animation. */
function spawnPetals(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#F2A71B', '#B3261E', '#2F6B3A', '#0F5C5C', '#F6C94E'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'petal';
    el.style.left  = `${Math.random() * 100}vw`;
    el.style.top   = '0';
    el.style.background = colors[Math.floor(Math.random() * colors.length)] ?? '#F2A71B';
    el.style.setProperty('--px', `${(Math.random() - 0.5) * 300}px`);
    el.style.setProperty('--py', `${Math.random() * 600 + 200}px`);
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

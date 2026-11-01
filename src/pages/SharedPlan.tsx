import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decodeShareLink } from '../schemas/share.js';
import type { Plan } from '../schemas/plan.js';
import { formatINR } from '../engine/money.js';
import { daysBetween } from '../engine/timeline.js';
import { LanguageSelector } from '../components/shared/LanguageSelector.js';
import { useTranslation } from 'react-i18next';

/** @fileoverview Read-only shared plan view — no editing controls. */

export default function SharedPlan(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!token) { setError('Missing share token'); return; }
    try {
      setPlan(decodeShareLink(token));
    } catch (e) {
      setError(String(e));
    }
  }, [token]);

  if (error) return (
    <div style={{ padding: '4rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--kumkum)', marginBottom: 'var(--sp-4)' }}>
        Invalid share link
      </h1>
      <p style={{ color: 'var(--ink-soft)' }}>{error}</p>
      <div style={{ marginTop: 'var(--sp-6)' }}>
        <Link to="/" style={{ color: 'var(--peacock)', fontWeight: 600 }}>{t('common.backToHome')}</Link>
      </div>
    </div>
  );

  if (!plan) return <div aria-busy="true" style={{ padding: '4rem', textAlign: 'center' }}>{t('common.loading')}</div>;

  const today = new Date().toISOString().slice(0, 10);
  const daysToEvent = daysBetween(today, plan.brief.eventDate);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--sp-8) var(--sp-6)' }}>
      {/* Top action header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)',
      }}>
        <Link to="/" style={{ color: 'var(--ink-soft)', textDecoration: 'none', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
          ← {t('common.backToHome')}
        </Link>
        <LanguageSelector variant="compact" />
      </div>

      {/* Privacy banner */}
      <div style={{
        background: 'var(--peacock-pale)', border: '1px solid var(--peacock)',
        borderRadius: 'var(--r-md)', padding: 'var(--sp-3) var(--sp-5)',
        marginBottom: 'var(--sp-8)', fontSize: 'var(--text-sm)', color: 'var(--peacock)',
      }} role="note">
        👁 {t('common.readOnlyMode')} — {t('landing.how5Desc')}
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--sp-2)' }}>
        {plan.brief.occasion.replace(/_/g,' ')} — {plan.brief.city}
      </h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 'var(--sp-8)' }}>
        {plan.brief.eventDate} · {plan.brief.guests} guests · {formatINR(plan.brief.budget)} · T-{daysToEvent} days
      </p>

      {/* Budget summary */}
      <section aria-labelledby="budget-heading" style={{ marginBottom: 'var(--sp-10)' }}>
        <h2 id="budget-heading" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--sp-6)' }}>Budget</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: 'var(--border-strong)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)' }}>Category</th>
              <th style={{ textAlign: 'right', padding: 'var(--sp-2) var(--sp-3)' }}>Amount</th>
              <th style={{ textAlign: 'right', padding: 'var(--sp-2) var(--sp-3)' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {plan.budget.categories.map(c => (
              <tr key={c.key} style={{ borderBottom: 'var(--border)' }}>
                <td style={{ padding: 'var(--sp-2) var(--sp-3)' }}>{c.label}</td>
                <td style={{ textAlign: 'right', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 600 }}>{formatINR(c.amount)}</td>
                <td style={{ textAlign: 'right', padding: 'var(--sp-2) var(--sp-3)', color: 'var(--ink-muted)' }}>{c.percent.toFixed(1)}%</td>
              </tr>
            ))}
            <tr style={{ borderTop: 'var(--border-strong)', fontWeight: 700 }}>
              <td style={{ padding: 'var(--sp-3) var(--sp-3)' }}>Total</td>
              <td style={{ textAlign: 'right', padding: 'var(--sp-3)' }}>{formatINR(plan.budget.total)}</td>
              <td style={{ textAlign: 'right', padding: 'var(--sp-3)' }}>100%</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Timeline */}
      <section aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--sp-6)' }}>Timeline</h2>
        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {plan.tasks.slice(0, 10).map(t => (
            <li key={t.id} className="card" style={{ padding: 'var(--sp-4) var(--sp-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>{t.title}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                {t.dueDate ?? '—'}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

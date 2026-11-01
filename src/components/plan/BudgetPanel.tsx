import React from 'react';
import { usePlan } from '../../state/store.js';
import { useToast } from '../shared/Toast.js';
import { formatINR } from '../../engine/money.js';
import { Lock, Unlock, Star } from 'lucide-react';

/** @fileoverview Budget tab — sliders, lock, priority, live redistribution, change toasts. */

export default function BudgetPanel(): React.ReactElement {
  const { state, dispatch } = usePlan();
  const { toast } = useToast();
  const plan = state.plan!;

  const handleAmountChange = (key: string, value: number) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: { categoryKey: key, amount: value } });
    const cat = plan.budget.categories.find(c => c.key === key);
    if (cat) toast(`${cat.label} updated — other categories adjusted`, 'info');
  };

  const handleLock = (key: string) => {
    dispatch({ type: 'TOGGLE_LOCK', payload: { categoryKey: key } });
    const cat = plan.budget.categories.find(c => c.key === key);
    const isLocked = !cat?.locked;
    toast(`${cat?.label} ${isLocked ? 'locked' : 'unlocked'}`, 'info');
  };

  const handlePriority = (key: string, priority: 'normal' | 'high') => {
    dispatch({ type: 'SET_PRIORITY', payload: { categoryKey: key, priority } });
    const cat = plan.budget.categories.find(c => c.key === key);
    toast(`${cat?.label} marked as ${priority === 'high' ? 'high priority (+25%)' : 'normal priority'}`, 'info');
  };

  const contingencyPct = ((plan.budget.categories.find(c => c.key === 'contingency')?.amount ?? 0) / plan.budget.total) * 100;

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Summary */}
      <div className="card" style={{ marginBottom: 'var(--sp-6)', display: 'flex', gap: 'var(--sp-6)', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: 'var(--sp-1)' }}>Total budget</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--ink)' }}>
            {formatINR(plan.budget.total)}
          </p>
        </div>
        {contingencyPct < 5 && (
          <div style={{ background: 'var(--kumkum-pale)', borderRadius: 'var(--r-md)', padding: 'var(--sp-4) var(--sp-5)', flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--kumkum)', fontWeight: 600 }}>
              ⚠ Contingency at {contingencyPct.toFixed(1)}% — below recommended 5%
            </p>
          </div>
        )}
      </div>

      {/* Category sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
        {plan.budget.categories.map(cat => {
          const maxAmount = Math.floor(plan.budget.total * 0.7);
          return (
            <div key={cat.key} className="card" style={{ padding: 'var(--sp-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>{cat.label}</h3>
                  {cat.estimate && (
                    <span className="badge badge-marigold" style={{ fontSize: '10px' }}>Estimate</span>
                  )}
                  {!cat.estimate && (
                    <span className="badge badge-leaf" style={{ fontSize: '10px' }}>Verified</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  {/* Priority */}
                  <button
                    onClick={() => handlePriority(cat.key, cat.priority === 'high' ? 'normal' : 'high')}
                    aria-pressed={cat.priority === 'high'}
                    aria-label={`Mark ${cat.label} as ${cat.priority === 'high' ? 'normal' : 'high'} priority`}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 'var(--sp-2)', color: cat.priority === 'high' ? 'var(--marigold-mid)' : 'var(--ink-muted)' }}
                  >
                    <Star size={15} fill={cat.priority === 'high' ? 'var(--marigold-mid)' : 'none'} aria-hidden="true" />
                  </button>
                  {/* Lock */}
                  <button
                    onClick={() => handleLock(cat.key)}
                    aria-pressed={cat.locked}
                    aria-label={cat.locked ? `Unlock ${cat.label}` : `Lock ${cat.label}`}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 'var(--sp-2)' }}
                  >
                    {cat.locked
                      ? <Lock size={15} style={{ color: 'var(--peacock)' }} aria-hidden="true" />
                      : <Unlock size={15} style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />}
                  </button>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--ink)', minWidth: 120, textAlign: 'right' }}>
                    {formatINR(cat.amount)}
                  </span>
                </div>
              </div>

              {/* Slider */}
              <label className="sr-only" htmlFor={`slider-${cat.key}`}>
                {cat.label} amount in rupees
              </label>
              <input
                id={`slider-${cat.key}`}
                type="range"
                min={0}
                max={maxAmount}
                step={1000}
                value={cat.amount}
                disabled={cat.locked}
                onChange={e => handleAmountChange(cat.key, Number(e.target.value))}
                aria-valuetext={`${formatINR(cat.amount)} for ${cat.label}`}
                style={{
                  width: '100%', accentColor: cat.locked ? 'var(--peacock)' : 'var(--kumkum)',
                  cursor: cat.locked ? 'not-allowed' : 'pointer',
                  height: 6, borderRadius: 3,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: 'var(--sp-1)' }}>
                <span>₹0</span>
                <span>{cat.percent.toFixed(1)}% of budget</span>
                <span>{formatINR(maxAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

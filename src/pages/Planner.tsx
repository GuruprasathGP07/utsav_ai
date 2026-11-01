import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, CalendarDays, Store,
  Lightbulb, Shield, Share2, ChevronLeft, ChevronRight,
  Flame, ArrowLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlan } from '../state/store.js';
import { daysBetween } from '../engine/timeline.js';
import { formatINRCompact } from '../engine/money.js';
import { computeRisks } from '../engine/risks.js';
import { computeReadiness } from '../engine/readiness.js';
import { LanguageSelector } from '../components/shared/LanguageSelector.js';

/** @fileoverview Planner shell — left rail, tab routing, invitation card. */

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'budget',    label: 'Budget',    icon: Wallet           },
  { id: 'timeline',  label: 'Timeline',  icon: CalendarDays     },
  { id: 'vendors',   label: 'Vendors',   icon: Store            },
  { id: 'ideas',     label: 'Ideas',     icon: Lightbulb        },
  { id: 'rescue',    label: 'Rescue',    icon: Shield           },
  { id: 'share',     label: 'Share',     icon: Share2           },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Tab panels (lazy-loaded inline for simplicity) ────────────────────────────
const OverviewPanel  = React.lazy(() => import('../components/plan/OverviewPanel.js'));
const BudgetPanel    = React.lazy(() => import('../components/plan/BudgetPanel.js'));
const TimelinePanel  = React.lazy(() => import('../components/plan/TimelinePanel.js'));
const VendorsPanel   = React.lazy(() => import('../components/plan/VendorsPanel.js'));
const IdeasPanel     = React.lazy(() => import('../components/plan/IdeasPanel.js'));
const RescuePanel    = React.lazy(() => import('../components/plan/RescuePanel.js'));
const SharePanel     = React.lazy(() => import('../components/plan/SharePanel.js'));

const PANELS: Record<TabId, React.LazyExoticComponent<() => React.ReactElement>> = {
  overview: OverviewPanel, budget: BudgetPanel, timeline: TimelinePanel,
  vendors:  VendorsPanel,  ideas:  IdeasPanel,  rescue:   RescuePanel,
  share:    SharePanel,
};

// ── Main component ────────────────────────────────────────────────────────────

export default function Planner(): React.ReactElement {
  const { tab = 'overview' } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = usePlan();
  const { t } = useTranslation();
  const [railCollapsed, setRailCollapsed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const activeTab = (TABS.find(t => t.id === tab)?.id ?? 'overview') as TabId;

  const getTabLabel = (id: TabId): string => {
    switch (id) {
      case 'overview': return t('planner.tabOverview');
      case 'budget':   return t('planner.tabBudget');
      case 'timeline': return t('planner.tabTimeline');
      case 'vendors':  return t('planner.tabVendors');
      case 'ideas':    return t('planner.tabIdeas');
      case 'rescue':   return t('planner.tabRescue');
      case 'share':    return t('planner.tabShare');
    }
  };

  // Redirect to landing if no plan
  useEffect(() => {
    if (!state.plan) navigate('/', { replace: true });
  }, [state.plan, navigate]);

  // Move focus to heading on tab change
  useEffect(() => {
    headingRef.current?.focus();
  }, [activeTab]);

  if (!state.plan) return <div aria-busy="true" style={{ padding: '4rem', textAlign: 'center' }}>Loading…</div>;

  const { plan, backups } = state;
  const today = new Date().toISOString().slice(0, 10);
  const daysToEvent = daysBetween(today, plan.brief.eventDate);
  const risks = computeRisks({
    brief: plan.brief, budget: plan.budget,
    tasks: plan.tasks, vendors: plan.vendors, today,
  }).map(r => ({ ...r, backupDone: backups[r.id] ?? false }));
  const { score } = computeReadiness(risks);

  const Panel = PANELS[activeTab];

  return (
    <div className="app-shell">
      {/* Left Rail */}
      <nav
        className={`left-rail ${railCollapsed ? 'collapsed' : ''}`}
        aria-label="Plan navigation"
        style={{ justifyContent: 'space-between' }}
      >
        {/* Logo */}
        <div>
          <div style={{
            padding: 'var(--sp-5) var(--sp-4)',
            borderBottom: 'var(--border)',
            display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          }}>
            <Flame size={22} style={{ color: 'var(--kumkum)', flexShrink: 0 }} aria-hidden="true" />
            {!railCollapsed && (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--kumkum)', fontSize: 'var(--text-xl)' }}>
                UtsavAI
              </span>
            )}
          </div>

          {/* Invitation summary */}
          {!railCollapsed && (
            <div className="invitation-card" style={{ margin: 'var(--sp-4)', padding: 'var(--sp-4)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: 'var(--sp-1)' }}>
                {plan.brief.occasion.replace(/_/g, ' ')}
              </p>
              <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--ink)', marginBottom: 'var(--sp-1)' }}>
                {plan.brief.city}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-soft)' }}>
                {plan.brief.eventDate} · {plan.brief.guests} guests
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--marigold-deep)', fontWeight: 600, marginTop: 'var(--sp-2)' }}>
                {formatINRCompact(plan.brief.budget)} · T-{daysToEvent} days
              </p>
              <div style={{
                marginTop: 'var(--sp-3)', padding: 'var(--sp-2) var(--sp-3)',
                background: score >= 90 ? 'var(--leaf-pale)' : score >= 60 ? 'var(--marigold-pale)' : 'var(--kumkum-pale)',
                borderRadius: 'var(--r-sm)', textAlign: 'center',
              }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: score >= 90 ? 'var(--leaf)' : score >= 60 ? 'var(--marigold-deep)' : 'var(--kumkum)' }}>
                  🔥 Readiness {score}/100
                </span>
              </div>
            </div>
          )}

          {/* Tab list */}
          <ul role="list" style={{ padding: 'var(--sp-2)', listStyle: 'none' }}>
            {TABS.map(t => {
              const isActive = t.id === activeTab;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => navigate(`/plan/${t.id}`)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 'var(--sp-3)', padding: 'var(--sp-3) var(--sp-4)',
                      borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--kumkum)' : 'var(--ink-soft)',
                      background: isActive ? 'var(--kumkum-pale)' : 'transparent',
                      transition: 'all var(--dur-fast)',
                      textAlign: 'left', whiteSpace: 'nowrap',
                    }}
                  >
                    <t.icon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
                    {!railCollapsed && getTabLabel(t.id)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setRailCollapsed(r => !r)}
          aria-label={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          style={{
            margin: 'var(--sp-4)', padding: 'var(--sp-2)',
            borderRadius: 'var(--r-sm)', border: 'var(--border)',
            background: 'var(--paper-3)', color: 'var(--ink-muted)',
            cursor: 'pointer', display: 'flex', justifyContent: 'center',
          }}
        >
          {railCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </nav>

      {/* Bottom tab bar (mobile) */}
      <div className="bottom-tab-bar" role="navigation" aria-label="Plan navigation">
        {TABS.slice(0, 6).map(t => {
          const isActive = t.id === activeTab;
          return (
            <button
              key={t.id}
              onClick={() => navigate(`/plan/${t.id}`)}
              aria-label={getTabLabel(t.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '2px', padding: 'var(--sp-2)', border: 'none',
                background: 'none', cursor: 'pointer',
                color: isActive ? 'var(--kumkum)' : 'var(--ink-muted)',
                fontSize: '10px', fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--font-ui)', minWidth: 'var(--touch)',
                minHeight: 'var(--touch)',
              }}
            >
              <t.icon size={20} aria-hidden="true" />
              {getTabLabel(t.id)}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="main-area" style={{ padding: 'var(--sp-8) var(--sp-8) var(--sp-16)' }}>
        {/* Top bar with back link, autosave pill and language switcher */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-6)', paddingBottom: 'var(--sp-4)',
          borderBottom: 'var(--border)',
        }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              border: 'none', background: 'transparent', color: 'var(--ink-soft)',
              cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>{t('common.backToHome')}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: 'var(--text-xs)', color: 'var(--leaf)', fontWeight: 600,
              background: 'var(--leaf-pale)', padding: '3px 10px', borderRadius: 'var(--r-full)',
            }}>
              ✓ {t('common.saveStatus')}
            </span>
            <LanguageSelector
              variant="compact"
              onLanguageChange={(lang) => {
                dispatch({ type: 'UPDATE_BRIEF', payload: { language: lang } });
              }}
            />
          </div>
        </div>

        <h1
          ref={headingRef}
          tabIndex={-1}
          style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)',
            marginBottom: 'var(--sp-8)', outline: 'none',
            color: 'var(--ink)',
          }}
        >
          {getTabLabel(activeTab)}
        </h1>

        <React.Suspense fallback={
          <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-lg)' }} />)}
          </div>
        }>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <Panel />
            </motion.div>
          </AnimatePresence>
        </React.Suspense>
      </div>
    </div>
  );
}

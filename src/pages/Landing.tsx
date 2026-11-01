import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Sparkles, Shield, Clock, IndianRupee,
  Flame, Leaf,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlan } from '../state/store.js';
import { useToast } from '../components/shared/Toast.js';
import { LanguageSelector } from '../components/shared/LanguageSelector.js';
import { getPreset, PRESETS } from '../engine/presets.js';
import { parseINR } from '../engine/money.js';
import { computeBudget } from '../engine/budget.js';
import { computeTimeline } from '../engine/timeline.js';
import type { Plan, OccasionType } from '../schemas/plan.js';
import { PlanSchema } from '../schemas/plan.js';

/** @fileoverview Premium Landing page — marketing, intake, FAQ, no placeholders. */

// ── Data ─────────────────────────────────────────────────────────────────────

const PLACEHOLDER_BRIEFS = [
  'Shaadi in Pune, 200 guests, 8 lakh, mid-February, premium food',
  'Ammu\'s 5th birthday party in Chennai for 60 kids, ₹40K budget',
  'Annual colony Diwali festival in Hyderabad, 500 families, January',
];

const TRUST_CHIPS = [
  { icon: IndianRupee, label: 'Exact rupee sums' },
  { icon: Clock,       label: 'T-minus timeline' },
  { icon: Shield,      label: 'Plan Rescue' },
  { icon: Leaf,        label: 'Works offline' },
];

const FAQ_ITEMS = [
  {
    q: 'Is UtsavAI free?',
    a: 'Yes — the full planner works without an account or payment. AI features require a Gemini API key (available free from Google AI Studio). Without one the built-in planner handles everything.',
  },
  {
    q: 'Does my plan data leave my device?',
    a: 'Your plan lives in your browser\'s localStorage. The only data that reaches our server is your event description, used to generate suggestions. We log latency and token counts, never your event details.',
  },
  {
    q: 'What is Plan Rescue?',
    a: 'Plan Rescue is our signature risk engine. It checks your plan against 7 deterministic rules (weather, vendor gaps, thin contingency, overdue tasks, venue capacity and more) and gives you a Readiness Score from 0–100. Each risk comes with a specific backup action. Completing backups raises your score.',
  },
  {
    q: 'What languages are supported?',
    a: 'The UI and AI output work in English, Hindi, Tamil, Telugu, Kannada and Malayalam. Select your language after entering the event description.',
  },
  {
    q: 'Can I share the plan with family?',
    a: 'Yes — use the Share tab to generate a read-only link. The entire plan is encoded in the URL (no server storage needed) and validated before it is displayed.',
  },
];

const HOW_STEPS = [
  {
    n: '1', label: 'Describe',
    desc: 'Type one sentence about your celebration. Gemini extracts occasion, city, date, budget and guest count.',
    color: 'var(--kumkum)',
  },
  {
    n: '2', label: 'Design',
    desc: 'Review your budget split, adjust priorities, lock categories. Every rupee is accounted for — guaranteed.',
    color: 'var(--marigold-mid)',
  },
  {
    n: '3', label: 'Coordinate',
    desc: 'Follow a dependency-ordered timeline. Delay one task and the cascade propagates with plain-language reasons.',
    color: 'var(--peacock)',
  },
  {
    n: '4', label: 'Protect',
    desc: 'Run Plan Rescue. Get a Readiness Score and a ranked list of backup actions. Reach 90 and earn a petal burst.',
    color: 'var(--leaf)',
  },
  {
    n: '5', label: 'Celebrate',
    desc: 'Export your run-sheet, share the read-only link with family, and enjoy the day.',
    color: 'var(--rose)',
  },
];

const OCCASION_TILES: ReadonlyArray<{
  type: OccasionType;
  emoji: string;
  color: string;
  bg: string;
}> = [
  { type: 'wedding',           emoji: '💍', color: 'var(--kumkum)',       bg: 'var(--kumkum-pale)'  },
  { type: 'engagement',        emoji: '💐', color: 'var(--marigold-mid)',  bg: 'var(--marigold-pale)' },
  { type: 'birthday_kids',     emoji: '🎂', color: 'var(--peacock)',       bg: 'var(--peacock-pale)' },
  { type: 'birthday_adult',    emoji: '🎉', color: 'var(--rose)',          bg: 'var(--rose-pale)'    },
  { type: 'baby_shower',       emoji: '👶', color: 'var(--leaf)',          bg: 'var(--leaf-pale)'    },
  { type: 'community_festival',emoji: '🪔', color: 'var(--marigold-deep)', bg: 'var(--marigold-light)'},
];

const SAMPLE_STORIES = [
  {
    name: 'Priya & Karthik (Sample story)',
    event: 'Tamil Wedding · 280 guests · Chennai',
    story:
      'With UtsavAI we had a budget breakdown in 30 seconds. When father insisted on 350 guests, the catering line updated instantly and a hall-capacity risk appeared. We fixed it the same afternoon.',
  },
  {
    name: 'Anjali\'s Diwali Mela (Sample story)',
    event: 'Community Festival · 600 families · Hyderabad',
    story:
      'The timeline dependency graph showed that our stage booking depended on the permit, which we had not applied for. That alone saved us from a catastrophic last-minute scramble.',
  },
];

// ── Thoranam SVG ──────────────────────────────────────────────────────────────

function ThoranamOrnament(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="thoranam"
      viewBox="0 0 1200 80"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {/* Main rope */}
      <path
        d="M0,20 Q150,50 300,20 Q450,0 600,20 Q750,40 900,20 Q1050,0 1200,20"
        fill="none" stroke="#C07800" strokeWidth="2.5" opacity="0.7"
      />
      {/* Hanging leaves/lanterns */}
      {[60,160,260,360,460,560,660,760,860,960,1060,1140].map((x, i) => (
        <g key={i} transform={`translate(${x},${i%3===0?28:i%3===1?32:24})`}>
          {i % 3 === 0 ? (
            <ellipse rx="10" ry="16" fill={i%2===0 ? '#F2A71B' : '#3DC8C8'} opacity="0.9" />
          ) : (
            <path d="M0,-14 Q8,0 0,14 Q-8,0 0,-14" fill={i%2===0 ? '#2F6B3A' : '#B3261E'} opacity="0.85" />
          )}
          <circle cy={i%3===0?16:14} r="3" fill="#C07800" opacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

// ── Readiness mini-gauge ──────────────────────────────────────────────────────

function MiniGauge({ score }: { score: number }): React.ReactElement {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct  = score / 100;
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" role="img" aria-label={`Readiness ${score}%`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--paper-3)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={score >= 90 ? 'var(--leaf)' : score >= 60 ? 'var(--marigold)' : 'var(--kumkum)'}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1.2s var(--ease-out)' }}
      />
      <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700"
        fill="var(--ink)" fontFamily="var(--font-display)">{score}</text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Landing(): React.ReactElement {
  const navigate = useNavigate();
  const { dispatch } = usePlan();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [sentence, setSentence] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check demo mode
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json() as Promise<{ demo?: boolean }>)
      .then(d => setDemoMode(d.demo ?? false))
      .catch(() => setDemoMode(true));
  }, []);

  // Cycle placeholder
  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_BRIEFS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim()) { inputRef.current?.focus(); return; }

    setLoading(true);
    try {
      // Try AI parse
      let brief: Partial<{ occasion: string; city: string; eventDate: string; guests: number; budget: number; vibe: string }> = {};
      try {
        const res = await fetch('/api/parse-intake', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence, language: i18n.language }),
        });
        if (res.ok) {
          const j = await res.json() as { data?: typeof brief };
          brief = j.data ?? {};
        }
      } catch { /* demo mode — use defaults */ }

      // Build plan with defaults
      const occasion = (brief.occasion ?? 'wedding') as OccasionType;
      const preset   = getPreset(occasion);
      const today    = new Date().toISOString().slice(0, 10);
      const eventDate = (typeof brief.eventDate === 'string' && brief.eventDate) || addMonths(today, 4);
      const guests   = Number(brief.guests ?? 150);
      const budget   = Number(brief.budget ?? parseINR('5L') ?? 500_000);

      const budgetResult = computeBudget({
        total:        budget,
        weights:      preset.weights as Parameters<typeof computeBudget>[0]['weights'],
        bounds:       preset.bounds,
        perGuestKeys: preset.perGuestKeys,
        guests,
      });

      const tasks = preset.taskTemplates.map(t => ({
        id:            t.id,
        title:         t.title,
        phase:         t.phase,
        leadTimeDays:  t.leadTimeDays,
        dependsOn:     [...t.dependsOn],
        categoryKey:   t.categoryKey,
        essential:     t.essential,
        status:        'pending' as const,
        delayedByDays: 0,
        atRisk:        false,
        isOverdue:     false,
      }));
      const { tasks: timedTasks } = computeTimeline({ tasks, eventDate, today });

      const plan: Plan = PlanSchema.parse({
        id:        crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        brief: {
          occasion, city: String(brief.city ?? 'Your City'), eventDate,
          guests, budget, currency: 'INR',
          priorities: [], vibe: String(brief.vibe ?? ''),
          extras: [], language: i18n.language, title: '',
        },
        budget: { total: budget, categories: [...budgetResult.categories] },
        tasks:   timedTasks,
        vendors: [],
        ideas:   {},
        readyToShare: false,
      });

      dispatch({ type: 'INIT_PLAN', payload: { plan } });
      navigate('/plan/overview');
    } catch {
      toast('Something went wrong building your plan — try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOccasionTile = (type: OccasionType) => {
    setSentence(`I want to plan a ${PRESETS[type].label.toLowerCase()}`);
    inputRef.current?.focus();
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)' }}>
      {/* Status bar */}
      <div className="status-bar" role="status" aria-live="polite">
        <span className={`status-dot ${demoMode ? 'demo' : ''}`} aria-hidden="true" />
        {demoMode
          ? '✦ Demo mode — add GEMINI_API_KEY to unlock AI features'
          : '✦ AI online — powered by Gemini 2.5 Flash'}
      </div>

      {/* Nav */}
      <nav role="navigation" aria-label="Main navigation" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-4) var(--sp-8)',
        borderBottom: 'var(--border)',
        background: 'var(--paper)',
      }}>
        <a href="/" aria-label="UtsavAI home" style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)',
          fontWeight: 700, color: 'var(--kumkum)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        }}>
          <Flame size={22} aria-hidden="true" /> UtsavAI
        </a>
        <ul style={{ display: 'flex', gap: 'var(--sp-4)', listStyle: 'none', alignItems: 'center' }}>
          <li>
            <LanguageSelector variant="compact" />
          </li>
          <li>
            <button
              onClick={() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="btn btn-primary btn-sm"
            >
              {t('landing.heroCTA')}
            </button>
          </li>
        </ul>
      </nav>

      <main id="main-content">
        {/* Thoranam */}
        <ThoranamOrnament />

        {/* Hero */}
        <section aria-labelledby="hero-heading" style={{
          textAlign: 'center', padding: 'var(--sp-16) var(--sp-6) var(--sp-12)',
          maxWidth: '900px', margin: '0 auto',
        }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>

            <span className="badge badge-marigold" style={{ marginBottom: 'var(--sp-6)', fontSize: 'var(--text-xs)' }}>
              <Sparkles size={11} aria-hidden="true" /> {t('common.badge')}
            </span>

            <h1 id="hero-heading" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
              fontWeight: 700, lineHeight: 1.08,
              color: 'var(--ink)', marginBottom: 'var(--sp-6)',
            }}>
              {t('landing.heroHeadline')}{' '}
              <em style={{ color: 'var(--kumkum)', fontStyle: 'italic' }}>{t('landing.heroHighlight')}</em>
            </h1>

            <p style={{
              fontSize: 'var(--text-xl)', color: 'var(--ink-soft)',
              marginBottom: 'var(--sp-10)', maxWidth: '620px',
              margin: '0 auto var(--sp-10)', lineHeight: 'var(--leading-relaxed)',
            }}>
              {t('landing.heroSubtitle')}{' '}
              <strong style={{ color: 'var(--peacock)' }}>{t('landing.heroPlanRescue')}</strong>
            </p>

            {/* Hero input */}
            <form onSubmit={handleSubmit} aria-label="Event description form"
              style={{ position: 'relative', maxWidth: '700px', margin: '0 auto var(--sp-6)' }}>
              <label htmlFor="event-sentence" className="sr-only">
                {t('landing.how1Title')}
              </label>
              <AnimatePresence mode="wait">
                <motion.input
                  key={placeholderIdx}
                  id="event-sentence"
                  ref={inputRef}
                  type="text"
                  value={sentence}
                  onChange={e => setSentence(e.target.value)}
                  placeholder={PLACEHOLDER_BRIEFS[placeholderIdx]}
                  disabled={loading}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  className="hero-input"
                  style={{ paddingRight: '170px' }}
                />
              </AnimatePresence>
              <button
                type="submit"
                disabled={loading || !sentence.trim()}
                className="btn btn-primary"
                style={{
                  position: 'absolute', right: 'var(--sp-2)', top: '50%',
                  transform: 'translateY(-50%)',
                }}
                aria-label="Create celebration plan"
              >
                {loading ? t('landing.planning') : <>{t('landing.heroCTA')} <ArrowRight size={16} aria-hidden="true" /></>}
              </button>
            </form>

            {/* Language Selection Chips */}
            <div style={{ marginBottom: 'var(--sp-8)' }}>
              <LanguageSelector variant="chips" />
            </div>

            {/* Trust chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)', justifyContent: 'center' }}>
              {TRUST_CHIPS.map(c => (
                <span key={c.label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)',
                  padding: 'var(--sp-2) var(--sp-4)',
                  background: 'var(--paper-2)', border: 'var(--border)',
                  borderRadius: 'var(--r-full)',
                  fontSize: 'var(--text-xs)', color: 'var(--ink-soft)', fontWeight: 500,
                }}>
                  <c.icon size={13} style={{ color: 'var(--peacock)' }} aria-hidden="true" />
                  {c.label}
                </span>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Occasion tiles */}
        <section id="occasions" aria-labelledby="occasions-heading"
          style={{ padding: '0 var(--sp-6) var(--sp-20)', maxWidth: '1100px', margin: '0 auto' }}>
          <h2 id="occasions-heading" style={{
            textAlign: 'center', marginBottom: 'var(--sp-10)',
            fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-display)',
          }}>
            Or choose your celebration type
          </h2>
          <div className="grid-auto">
            {OCCASION_TILES.map(tile => {
              const preset = PRESETS[tile.type];
              return (
                <motion.button
                  key={tile.type}
                  type="button"
                  onClick={() => handleOccasionTile(tile.type)}
                  whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
                  whileTap={{ scale: 0.97 }}
                  className="card"
                  style={{
                    all: 'unset', cursor: 'pointer', display: 'flex',
                    flexDirection: 'column', gap: 'var(--sp-3)',
                    padding: 'var(--sp-6)', background: 'var(--paper-2)',
                    border: 'var(--border)', borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-sm)', textAlign: 'left', width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tile.color; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
                  aria-label={`Plan a ${preset.label}`}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--r-md)',
                    background: tile.bg, fontSize: '1.6rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} aria-hidden="true">
                    {tile.emoji}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: tile.color }}>
                    {preset.label}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    {preset.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-heading"
          style={{ background: 'var(--paper-2)', borderTop: 'var(--border)', borderBottom: 'var(--border)', padding: 'var(--sp-20) var(--sp-6)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 id="how-heading" style={{ textAlign: 'center', marginBottom: 'var(--sp-14)' }}>
              How UtsavAI works
            </h2>
            <ol style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--sp-8)' }}>
              {HOW_STEPS.map((s, i) => (
                <motion.li
                  key={s.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: s.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 'var(--text-2xl)', margin: '0 auto var(--sp-4)',
                    boxShadow: '0 4px 16px rgba(0,0,0,.15)',
                  }} aria-hidden="true">
                    {s.n}
                  </div>
                  <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--sp-2)' }}>{s.label}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', lineHeight: 1.6 }}>{s.desc}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Plan Rescue spotlight */}
        <section aria-labelledby="rescue-heading"
          style={{ padding: 'var(--sp-20) var(--sp-6)', maxWidth: '900px', margin: '0 auto' }}>
          <div className="card-elevated" style={{ display: 'flex', gap: 'var(--sp-10)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <span className="badge badge-kumkum" style={{ marginBottom: 'var(--sp-4)' }}>
                <Shield size={11} aria-hidden="true" /> Signature feature
              </span>
              <h2 id="rescue-heading" style={{ marginBottom: 'var(--sp-4)' }}>Plan Rescue</h2>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--sp-4)' }}>
                Seven deterministic risk rules scan your plan — monsoon weather, vendor shortage season,
                single-vendor dependencies, thin contingency, overdue tasks and more.
                Each risk comes with a concrete backup action and a cost estimate.
                Completing backups raises your Readiness Score. Cross 90 and earn a petal burst.
              </p>
              <ul style={{ paddingLeft: 'var(--sp-5)', color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', lineHeight: 2 }}>
                <li>Weather risk table by city and month</li>
                <li>Festival-season vendor shortage detection</li>
                <li>Delay cascade visualisation</li>
                <li>Ranked backups by penalty-per-day</li>
              </ul>
            </div>
            <div style={{ flexShrink: 0 }}>
              <MiniGauge score={72} />
              <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: 'var(--sp-2)' }}>
                Readiness Score
              </p>
            </div>
          </div>
        </section>

        {/* Sample stories */}
        <section aria-labelledby="stories-heading"
          style={{ background: 'var(--paper-2)', borderTop: 'var(--border)', padding: 'var(--sp-20) var(--sp-6)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 id="stories-heading" style={{ textAlign: 'center', marginBottom: 'var(--sp-10)' }}>
              Families who planned with UtsavAI
            </h2>
            <div className="grid-2">
              {SAMPLE_STORIES.map(s => (
                <blockquote
                  key={s.name}
                  className="card"
                  style={{ borderLeft: '4px solid var(--marigold)' }}
                >
                  <p style={{ fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--sp-4)' }}>
                    "{s.story}"
                  </p>
                  <footer>
                    <strong style={{ display: 'block', fontSize: 'var(--text-sm)' }}>{s.name}</strong>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>{s.event}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-heading"
          style={{ padding: 'var(--sp-20) var(--sp-6)', maxWidth: '760px', margin: '0 auto' }}>
          <h2 id="faq-heading" style={{ textAlign: 'center', marginBottom: 'var(--sp-10)' }}>
            Frequently asked questions
          </h2>
          {FAQ_ITEMS.map(item => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <div className="faq-body">{item.a}</div>
            </details>
          ))}
        </section>

        {/* Final CTA band */}
        <section style={{
          background: 'var(--kumkum)', color: '#fff',
          padding: 'var(--sp-16) var(--sp-6)', textAlign: 'center',
        }}>
          <h2 style={{ color: '#fff', marginBottom: 'var(--sp-4)', fontFamily: 'var(--font-display)' }}>
            Ready to plan?
          </h2>
          <p style={{ marginBottom: 'var(--sp-8)', opacity: 0.9 }}>
            One sentence. One connected plan. No sign-up required.
          </p>
          <button
            onClick={() => { inputRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); }}
            className="btn"
            style={{ background: '#fff', color: 'var(--kumkum)', fontWeight: 700 }}
          >
            Start planning <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      </main>

      <footer role="contentinfo" style={{
        borderTop: 'var(--border)', padding: 'var(--sp-8)',
        textAlign: 'center', color: 'var(--ink-muted)', fontSize: 'var(--text-sm)',
      }}>
        <p>
          UtsavAI — GenAI Celebration Planner · Built with Gemini 2.5 Flash ·{' '}
          <a href="/.well-known/security.txt">security.txt</a>
        </p>
      </footer>
    </div>
  );
}

function addMonths(date: string, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

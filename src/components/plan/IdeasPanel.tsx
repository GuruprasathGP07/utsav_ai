import React, { useState } from 'react';
import { usePlan } from '../../state/store.js';
import { useToast } from '../shared/Toast.js';
import { Sparkles, RefreshCw } from 'lucide-react';

/** @fileoverview Ideas tab — Gemini-generated themes, activities, food, personal touches. */

export default function IdeasPanel(): React.ReactElement {
  const { state, dispatch } = usePlan();
  const { toast } = useToast();
  const plan = state.plan!;
  const ideas = plan.ideas;
  const [loading, setLoading] = useState(false);

  const generateIdeas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suggest-ideas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: plan.brief }),
      });
      if (!res.ok) { toast('AI unavailable — check API key', 'warning'); return; }
      const j = await res.json() as {
        data?: {
          themes?: string[]; activities?: string[];
          foodStyle?: string[]; personalTouches?: string[];
          invitationLine?: string;
        };
        demo?: boolean;
      };
      if (j.demo) { toast('Demo mode — add GEMINI_API_KEY for real ideas', 'info'); return; }
      if (j.data) {
        dispatch({ type: 'SET_IDEAS', payload: { ideas: {
          themes:          j.data.themes ?? [],
          activities:      j.data.activities ?? [],
          foodStyle:       j.data.foodStyle ?? [],
          personalTouches: j.data.personalTouches ?? [],
          invitationLine:  j.data.invitationLine ? [j.data.invitationLine] : [],
        }}});
        toast('Ideas generated!', 'success');
      }
    } catch { toast('Network error', 'error'); }
    finally { setLoading(false); }
  };

  const SECTIONS: Array<{ key: string; label: string; emoji: string }> = [
    { key: 'themes',          label: 'Themes',           emoji: '🎨' },
    { key: 'activities',      label: 'Activities',       emoji: '🎭' },
    { key: 'foodStyle',       label: 'Food & Drinks',    emoji: '🍛' },
    { key: 'personalTouches', label: 'Personal Touches', emoji: '💛' },
  ];

  const hasIdeas = Object.values(ideas).some(arr => (arr as string[]).length > 0);

  return (
    <div>
      {/* Generate button */}
      <div className="card" style={{ marginBottom: 'var(--sp-8)', textAlign: 'center', padding: 'var(--sp-10)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }} aria-hidden="true">✨</div>
        <h2 style={{ marginBottom: 'var(--sp-3)' }}>
          {hasIdeas ? 'Regenerate ideas' : 'Generate celebration ideas'}
        </h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 'var(--sp-6)', maxWidth: 420, margin: '0 auto var(--sp-6)' }}>
          Gemini will suggest culturally rooted themes, activities, food styles and personal touches for your {plan.brief.occasion.replace(/_/g,' ')} in {plan.brief.city}.
        </p>
        <button
          onClick={generateIdeas}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading
            ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Generating…</>
            : <><Sparkles size={16} aria-hidden="true" /> {hasIdeas ? 'Regenerate' : 'Generate ideas'}</>}
        </button>
      </div>

      {/* Invitation line */}
      {(ideas['invitationLine'] as string[] | undefined)?.length ? (
        <blockquote className="card" style={{ borderLeft: '4px solid var(--marigold)', marginBottom: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontStyle: 'italic', color: 'var(--ink)' }}>
            "{(ideas['invitationLine'] as string[])[0]}"
          </p>
          <footer style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
            Suggested invitation line
          </footer>
        </blockquote>
      ) : null}

      {/* Idea sections */}
      {hasIdeas && (
        <div className="grid-2" style={{ gap: 'var(--sp-6)' }}>
          {SECTIONS.map(s => {
            const items = (ideas[s.key] as string[] | undefined) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={s.key} className="card-elevated" aria-labelledby={`ideas-${s.key}`}>
                <h3 id={`ideas-${s.key}`} style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                  <span aria-hidden="true">{s.emoji}</span> {s.label}
                </h3>
                <ul style={{ paddingLeft: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  {items.map((item, i) => (
                    <li key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

import React, { useState } from 'react';
import { usePlan } from '../../state/store.js';
import { useToast } from '../shared/Toast.js';
import { encodeShareLink } from '../../schemas/share.js';
import { exportToICS } from '../../engine/compression.js';
import { Copy, Download, FileText, Share2 } from 'lucide-react';

/** @fileoverview Share tab — base64url share link, .ics export, print summary. */

export default function SharePanel(): React.ReactElement {
  const { state } = usePlan();
  const { toast } = useToast();
  const plan = state.plan!;
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateLink = () => {
    setGenerating(true);
    try {
      const encoded = encodeShareLink(plan);
      const url = `${window.location.origin}/shared/${encoded}`;
      setShareUrl(url);
    } catch (e) {
      toast(`Could not generate link: ${String(e)}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard', 'success'); }
    catch { toast('Copy failed — please copy manually', 'warning'); }
  };

  const downloadICS = () => {
    const ics = exportToICS(plan.tasks, `${plan.brief.occasion.replace(/_/g,' ')} — ${plan.brief.city}`, plan.brief.eventDate);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'utsavai-plan.ics';
    a.click();
    URL.revokeObjectURL(url);
    toast('.ics downloaded — add to Google Calendar or Apple Calendar', 'success');
  };

  return (
    <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      {/* Privacy note */}
      <div style={{
        background: 'var(--peacock-pale)', border: '1px solid var(--peacock)',
        borderRadius: 'var(--r-md)', padding: 'var(--sp-4) var(--sp-5)',
        fontSize: 'var(--text-sm)', color: 'var(--peacock)',
      }} role="note">
        🔒 Your plan is encoded directly in the link — no server storage. Anyone with the link can view (but not edit) the plan.
      </div>

      {/* Generate link */}
      <div className="card-elevated">
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)' }}>
          <Share2 size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} aria-hidden="true" />
          Share read-only link
        </h2>
        {!shareUrl ? (
          <button onClick={generateLink} disabled={generating} className="btn btn-primary">
            {generating ? 'Generating…' : 'Generate share link'}
          </button>
        ) : (
          <div>
            <label htmlFor="share-url" className="label">Share URL</label>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <input
                id="share-url"
                type="text"
                readOnly
                value={shareUrl}
                className="input"
                style={{ flex: 1, fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}
              />
              <button onClick={() => copy(shareUrl)} className="btn btn-secondary btn-sm">
                <Copy size={14} aria-hidden="true" /> Copy
              </button>
            </div>
            <button onClick={() => setShareUrl(null)} className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--sp-3)' }}>
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Calendar export */}
      <div className="card-elevated">
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)' }}>
          <Download size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} aria-hidden="true" />
          Export calendar (.ics)
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-5)' }}>
          Download an RFC 5545 .ics file with all {plan.tasks.length} tasks. Works with Google Calendar, Apple Calendar, and Outlook.
        </p>
        <button onClick={downloadICS} className="btn btn-peacock">
          <Download size={16} aria-hidden="true" /> Download .ics
        </button>
      </div>

      {/* Print */}
      <div className="card-elevated">
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)' }}>
          <FileText size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} aria-hidden="true" />
          Print run-sheet
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-5)' }}>
          Print a one-page day-of coordinator run-sheet.
        </p>
        <button onClick={() => window.print()} className="btn btn-secondary">
          Print run-sheet
        </button>
      </div>
    </div>
  );
}

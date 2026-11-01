import React, { useState } from 'react';
import { usePlan } from '../../state/store.js';
import { useToast } from '../shared/Toast.js';
import { formatINR } from '../../engine/money.js';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import type { Vendor } from '../../schemas/plan.js';

/** @fileoverview Vendors tab — add vendors, paste quotes, AI extraction, accept quote. */

const STATUS_LABELS = { not_started: 'Not started', contacted: 'Contacted', quoted: 'Quoted', accepted: 'Accepted' };
const STATUS_COLORS = { not_started: 'var(--ink-ghost)', contacted: 'var(--marigold-mid)', quoted: 'var(--peacock)', accepted: 'var(--leaf)' };

export default function VendorsPanel(): React.ReactElement {
  const { state, dispatch } = usePlan();
  const { toast } = useToast();
  const plan = state.plan!;

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newVendorName, setNewVendorName] = useState('');
  const [extracting, setExtracting] = useState<string | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [quoteVendorId, setQuoteVendorId] = useState<string | null>(null);

  const categories = [...new Set(plan.tasks.map(t => t.categoryKey))];

  const addVendor = (categoryKey: string) => {
    if (!newVendorName.trim()) { toast('Enter a vendor name', 'warning'); return; }
    const vendor: Vendor = {
      id:          crypto.randomUUID(),
      categoryKey,
      name:        newVendorName.trim(),
      status:      'contacted',
      quotes:      [],
      accepted:    null,
      notes:       '',
    };
    dispatch({ type: 'ADD_VENDOR', payload: { vendor } });
    toast(`${vendor.name} added`, 'success');
    setNewVendorName('');
    setAddingFor(null);
  };

  const extractQuote = async (vendorId: string) => {
    if (!quoteText.trim()) { toast('Paste quote text first', 'warning'); return; }
    setExtracting(vendorId);
    try {
      const res = await fetch('/api/extract-quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteText, language: plan.brief.language }),
      });
      if (res.ok) {
        const j = await res.json() as { data?: { totalPrice?: number | null; perPlate?: number | null; inclusions?: string[]; cancellationPolicy?: string | null } };
        if (j.data) {
          const vendor = plan.vendors.find(v => v.id === vendorId);
          dispatch({ type: 'UPDATE_VENDOR', payload: {
            id: vendorId,
            status: 'quoted',
            quotes: [
              ...(vendor?.quotes ?? []),
              {
                totalPrice:         j.data.totalPrice ?? null,
                perPlate:           j.data.perPlate ?? null,
                guestMinimum:       null,
                overtimeRatePerHr:  null,
                taxPercent:         null,
                advancePercent:     null,
                inclusions:         j.data.inclusions ?? [],
                cancellationPolicy: j.data.cancellationPolicy ?? null,
                rawText:            quoteText,
                extractedAt:        new Date().toISOString(),
              },
            ],
          }});
          toast('Quote extracted successfully', 'success');
          setQuoteText(''); setQuoteVendorId(null);
        }
      } else {
        toast('AI extraction failed — check API key', 'warning');
      }
    } catch {
      toast('Network error during extraction', 'error');
    } finally { setExtracting(null); }
  };

  const acceptQuote = (vendorId: string, idx: number) => {
    dispatch({ type: 'ACCEPT_QUOTE', payload: { vendorId, quoteIndex: idx } });
    toast('Quote accepted — budget may update', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
      {categories.map(cat => {
        const catVendors = plan.vendors.filter(v => v.categoryKey === cat);
        return (
          <section key={cat} aria-labelledby={`vendor-cat-${cat}`}>
            <h2 id={`vendor-cat-${cat}`} style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)', textTransform: 'capitalize' }}>
              {cat.replace(/_/g, ' ')}
            </h2>

            {catVendors.map(v => (
              <div key={v.id} className="card" style={{ marginBottom: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{v.name}</h3>
                    <span style={{ fontSize: 'var(--text-xs)', color: STATUS_COLORS[v.status], fontWeight: 600 }}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_VENDOR', payload: { id: v.id } })}
                    aria-label={`Remove ${v.name}`}
                    className="btn btn-ghost btn-sm"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>

                {/* Quotes */}
                {v.quotes.map((q, i) => (
                  <div key={i} style={{
                    background: v.accepted === i ? 'var(--leaf-pale)' : 'var(--paper-3)',
                    border: `1px solid ${v.accepted === i ? 'var(--leaf)' : 'var(--line)'}`,
                    borderRadius: 'var(--r-md)', padding: 'var(--sp-3) var(--sp-4)',
                    marginBottom: 'var(--sp-2)', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-3)',
                  }}>
                    <div style={{ fontSize: 'var(--text-sm)' }}>
                      {q.totalPrice != null && <span style={{ fontWeight: 700, marginRight: 'var(--sp-3)' }}>{formatINR(q.totalPrice)}</span>}
                      {q.perPlate != null  && <span style={{ color: 'var(--ink-muted)' }}>{formatINR(q.perPlate)}/plate</span>}
                    </div>
                    {v.accepted !== i ? (
                      <button onClick={() => acceptQuote(v.id, i)} className="btn btn-secondary btn-sm">Accept</button>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--leaf)', fontWeight: 600 }}>
                        <CheckCircle size={13} aria-hidden="true" /> Accepted
                      </span>
                    )}
                  </div>
                ))}

                {/* Extract quote */}
                {quoteVendorId === v.id ? (
                  <div style={{ marginTop: 'var(--sp-3)' }}>
                    <label htmlFor={`quote-${v.id}`} className="label">Paste quote text from email / WhatsApp</label>
                    <textarea
                      id={`quote-${v.id}`}
                      value={quoteText}
                      onChange={e => setQuoteText(e.target.value)}
                      rows={4}
                      className="input"
                      style={{ fontFamily: 'var(--font-ui)', resize: 'vertical', minHeight: 100 }}
                      placeholder="Paste the quote or price breakdown here…"
                    />
                    <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
                      <button
                        onClick={() => extractQuote(v.id)}
                        disabled={!!extracting}
                        className="btn btn-primary btn-sm"
                      >
                        {extracting === v.id ? 'Extracting…' : 'Extract with AI'}
                      </button>
                      <button onClick={() => { setQuoteVendorId(null); setQuoteText(''); }} className="btn btn-ghost btn-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuoteVendorId(v.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 'var(--sp-2)' }}
                  >
                    + Add quote
                  </button>
                )}
              </div>
            ))}

            {/* Add vendor form */}
            {addingFor === cat ? (
              <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                <label htmlFor={`new-vendor-${cat}`} className="sr-only">Vendor name</label>
                <input
                  id={`new-vendor-${cat}`}
                  type="text"
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  placeholder="Vendor name"
                  className="input"
                  style={{ flex: 1, maxWidth: 300 }}
                  onKeyDown={e => { if (e.key === 'Enter') addVendor(cat); if (e.key === 'Escape') setAddingFor(null); }}
                  autoFocus
                />
                <button onClick={() => addVendor(cat)} className="btn btn-primary btn-sm">Add</button>
                <button onClick={() => { setAddingFor(null); setNewVendorName(''); }} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => { setAddingFor(cat); setNewVendorName(''); }}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} aria-hidden="true" /> Add {cat.replace(/_/g,' ')} vendor
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

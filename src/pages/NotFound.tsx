import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';

/** @fileoverview 404 Not Found page. */
export default function NotFound(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '8rem var(--sp-6)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: 'var(--sp-6)' }} aria-hidden="true">🪔</div>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--sp-4)', color: 'var(--kumkum)' }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 'var(--sp-8)', maxWidth: 400 }}>
        The celebration you were looking for has moved or the link has expired.
      </p>
      <button onClick={() => navigate('/')} className="btn btn-primary">
        <Flame size={16} aria-hidden="true" /> Go home
      </button>
    </div>
  );
}

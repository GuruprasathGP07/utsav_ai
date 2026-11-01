import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/** @fileoverview Accessible toast notification system with aria-live. */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id:      string;
  message: string;
  type:    ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ReactElement> = {
  success: <CheckCircle  size={18} style={{ color: 'var(--leaf)',    flexShrink: 0 }} />,
  error:   <AlertCircle  size={18} style={{ color: 'var(--kumkum)',  flexShrink: 0 }} />,
  info:    <Info         size={18} style={{ color: 'var(--peacock)', flexShrink: 0 }} />,
  warning: <AlertTriangle size={18} style={{ color: 'var(--marigold-mid)', flexShrink: 0 }} />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'var(--leaf)',
  error:   'var(--kumkum)',
  info:    'var(--peacock)',
  warning: 'var(--marigold-mid)',
};

let counter = 0;

/** Provides toast context to the tree. Renders an aria-live toasts region. */
export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = String(++counter);
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    const t = setTimeout(() => dismiss(id), 4500);
    timers.current.set(id, t);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="toast-region"
      >
        {toasts.map(item => (
          <div
            key={item.id}
            className="toast"
            style={{ borderLeft: `4px solid ${BORDER_COLORS[item.type]}` }}
          >
            {ICONS[item.type]}
            <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px', color: 'var(--ink-muted)', flexShrink: 0,
                minWidth: 'var(--touch)', minHeight: 'var(--touch)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns the toast function. Throws if used outside ToastProvider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

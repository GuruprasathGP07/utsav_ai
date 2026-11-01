import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlanProvider } from './state/store.js';
import { ToastProvider } from './components/shared/Toast.js';
import { SkipLink } from './components/shared/SkipLink.js';
import { OfflineBanner } from './components/shared/OfflineBanner.js';
import './lib/i18n.js';
import './styles/globals.css';

/** @fileoverview Application entry — lazy routes, global providers. */

const Landing    = lazy(() => import('./pages/Landing.js'));
const Planner    = lazy(() => import('./pages/Planner.js'));
const SharedPlan = lazy(() => import('./pages/SharedPlan.js'));
const NotFound   = lazy(() => import('./pages/NotFound.js'));

function PageFallback(): React.ReactElement {
  return (
    <div aria-live="polite" aria-busy="true" style={{ padding: '4rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
      Loading…
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <PlanProvider>
      <ToastProvider>
        <BrowserRouter>
          <SkipLink />
          <OfflineBanner />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/"         element={<Landing />} />
              <Route path="/plan"     element={<Planner />} />
              <Route path="/plan/:tab" element={<Planner />} />
              <Route path="/shared/:token" element={<SharedPlan />} />
              <Route path="*"         element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </PlanProvider>
  </React.StrictMode>,
);

/** @vitest-environment jsdom */
import './setup.js';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Landing from '../../src/pages/Landing.js';
import { PlanProvider } from '../../src/state/store.js';
import { ToastProvider } from '../../src/components/shared/Toast.js';

describe('Landing Page Component', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders landing hero, brand, intake input and call-to-action button', () => {
    render(
      <PlanProvider>
        <ToastProvider>
          <BrowserRouter>
            <Landing />
          </BrowserRouter>
        </ToastProvider>
      </PlanProvider>,
    );

    expect(screen.getAllByText(/UtsavAI/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create celebration plan/i })).toBeInTheDocument();
  });
});

/** @vitest-environment jsdom */
import './setup.js';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { LanguageSelector } from '../../src/components/shared/LanguageSelector.js';
import { SkipLink } from '../../src/components/shared/SkipLink.js';
import i18n from '../../src/lib/i18n.js';

describe('UI & Accessibility Tests', () => {
  afterEach(() => {
    cleanup();
  });
  it('SkipLink renders with accessible href and content', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('LanguageSelector renders all 6 Indian language options', () => {
    render(<LanguageSelector variant="chips" />);
    expect(screen.getByRole('radio', { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /हिन्दी/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /தமிழ்/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /తెలుగు/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /ಕನ್ನಡ/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /മലയാളം/i })).toBeInTheDocument();
  });

  it('clicking a language button switches i18n language and html lang attribute', async () => {
    render(<LanguageSelector variant="chips" />);
    const tamilBtn = screen.getByRole('radio', { name: /தமிழ்/i });
    fireEvent.click(tamilBtn);

    await waitFor(() => {
      expect(i18n.language).toBe('ta');
      expect(document.documentElement.getAttribute('lang')).toBe('ta');
    });

    // Switch back to en
    const englishBtn = screen.getByRole('radio', { name: /English/i });
    fireEvent.click(englishBtn);
    await waitFor(() => {
      expect(i18n.language).toBe('en');
    });
  });
});

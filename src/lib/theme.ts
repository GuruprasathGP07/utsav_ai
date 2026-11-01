/** @fileoverview Theme switcher and high-contrast accessibility mode. */

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'utsavai_theme';
const CONTRAST_STORAGE_KEY = 'utsavai_high_contrast';

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // ignore
  }
  return 'dark'; // Dark mode default as specified for premium luxury aesthetic
}

export function applyTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.documentElement.setAttribute('data-theme', mode);
  } catch {
    // ignore
  }
}

export function isHighContrast(): boolean {
  try {
    return localStorage.getItem(CONTRAST_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setHighContrast(enabled: boolean): void {
  try {
    localStorage.setItem(CONTRAST_STORAGE_KEY, String(enabled));
    if (enabled) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  } catch {
    // ignore
  }
}


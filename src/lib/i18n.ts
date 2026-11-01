import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, type SupportedLanguage } from '../locales/index.js';

/** @fileoverview i18next initialization with all 6 Indian languages. */

const SAVED_LANG_KEY = 'utsavai_language';

const initialLang = ((): SupportedLanguage => {
  try {
    const saved = localStorage.getItem(SAVED_LANG_KEY);
    if (saved && ['en', 'hi', 'ta', 'te', 'kn', 'ml'].includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // ignore
  }
  return 'en';
})();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * Changes language globally, updates HTML lang attribute, and persists preference.
 */
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lang);
  }
  try {
    localStorage.setItem(SAVED_LANG_KEY, lang);
  } catch {
    // ignore
  }
}

// Initial document sync
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', initialLang);
}

export default i18n;


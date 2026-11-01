/** @fileoverview Locales barrel. */
import { en } from './en.js';
import { hi } from './hi.js';
import { ta } from './ta.js';
import { te } from './te.js';
import { kn } from './kn.js';
import { ml } from './ml.js';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
} as const;

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';

export const LANGUAGE_OPTIONS: ReadonlyArray<{
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}> = [
  { code: 'en', label: 'English',   nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi',     nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil',     nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu',    nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada',   nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
];


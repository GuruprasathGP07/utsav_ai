import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '../../locales/index.js';
import { setLanguage } from '../../lib/i18n.js';
import { announceToScreenReader } from '../../lib/a11y.js';

/** @fileoverview Premium Language Selector — native typography, animated pill selection. */

interface LanguageSelectorProps {
  variant?: 'chips' | 'dropdown' | 'compact';
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export function LanguageSelector({
  variant = 'chips',
  onLanguageChange,
}: LanguageSelectorProps): React.ReactElement {
  const { i18n, t } = useTranslation();
  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguage) || 'en';

  const handleSelect = async (code: SupportedLanguage) => {
    await setLanguage(code);
    announceToScreenReader(`Language changed to ${code}`);
    onLanguageChange?.(code);
  };

  if (variant === 'compact') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <Globe size={14} style={{ color: 'var(--marigold)' }} aria-hidden="true" />
        <select
          aria-label={t('common.selectLanguage')}
          value={currentLang}
          onChange={(e) => handleSelect(e.target.value as SupportedLanguage)}
          style={{
            background: 'var(--paper-2)',
            color: 'var(--ink)',
            border: '1px solid var(--paper-3)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.nativeLabel} ({opt.label})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('common.selectLanguage')}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginRight: '6px',
          color: 'var(--ink-soft)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        <Globe size={14} style={{ color: 'var(--marigold)' }} aria-hidden="true" />
        <span>{t('common.language')}:</span>
      </div>

      {LANGUAGE_OPTIONS.map((lang) => {
        const isSelected = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(lang.code)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: isSelected ? '1.5px solid var(--marigold)' : '1px solid var(--paper-3)',
              background: isSelected
                ? 'linear-gradient(135deg, rgba(242, 167, 27, 0.18) 0%, rgba(212, 58, 27, 0.12) 100%)'
                : 'var(--paper-1)',
              color: isSelected ? 'var(--marigold)' : 'var(--ink-soft)',
              fontSize: 'var(--text-sm)',
              fontWeight: isSelected ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s var(--ease-out)',
              transform: isSelected ? 'scale(1.04)' : 'scale(1)',
              boxShadow: isSelected ? '0 2px 8px rgba(242, 167, 27, 0.2)' : 'none',
              fontFamily: 'inherit',
            }}
          >
            <span>{lang.nativeLabel}</span>
          </button>
        );
      })}
    </div>
  );
}


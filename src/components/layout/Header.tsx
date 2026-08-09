// src/components/layout/Header.tsx

import { useState, useEffect } from 'react';
import type React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useTranslation } from '../../context/LocaleContext';
import AISearchBar from '../ai/AISearchBar';
import { Button } from '../ui/Button';

interface HeaderProps {
  onAIAction?: (action: any) => void;
}

const Header: React.FC<HeaderProps> = ({ onAIAction }) => {
  const { keyNote, mode } = useMusic();
  const { t, toggleLocale, locale } = useTranslation();
  const [theme, setTheme] = useState(() => localStorage.getItem('fretlab_theme') || 'default');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fretlab_theme', theme);
  }, [theme]);

  return (
    <header className="app-header">

      {/* ЛЕВАЯ СЕКЦИЯ: Логотип + тема */}
      <div className="header-brand">
        <div className="header-logo">
          # FRETLAB
        </div>
        <select
          className="header-theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="default">🎚 Default</option>
          <option value="nebula">🌌 Nebula</option>
          <option value="titanium">⚡ Citrine</option>
          <option value="crimson">🩸 Onyx</option>
        </select>
        <button
          onClick={toggleLocale}
          aria-label="Switch language"
          title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer',
            padding: '0 8px',
            height: '28px',
            minWidth: '40px',
            letterSpacing: '0.5px',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          {locale === 'ru' ? 'EN' : 'RU'}
        </button>
      </div>

      {/* ЦЕНТРАЛЬНАЯ СЕКЦИЯ: AI Search Bar */}
      <div className="header-center">
        <AISearchBar onAction={onAIAction} />
      </div>

      {/* ПРАВАЯ СЕКЦИЯ: Key + Mode */}
      <div className="header-meta">
        <span className="header-meta-item">
          <span className="header-meta-label">{t.header.key}</span>
          <span className="header-meta-value">{keyNote}</span>
        </span>
        <span className="header-meta-item">
          <span className="header-meta-label">{t.header.mode}</span>
          <span className="header-meta-value header-meta-accent">{mode.replace('_', ' ')}</span>
        </span>
      </div>

    </header>
  );
};

export default Header;
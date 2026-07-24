// src/components/layout/Header.tsx

import { useState, useEffect } from 'react';
import type React from 'react';
import { useMusic } from '../../context/MusicContext';
import AISearchBar from '../ai/AISearchBar';

interface HeaderProps {
  onAIAction?: (action: any) => void;
}

const Header: React.FC<HeaderProps> = ({ onAIAction }) => {
  const { keyNote, mode } = useMusic();
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
      </div>

      {/* ЦЕНТРАЛЬНАЯ СЕКЦИЯ: AI Search Bar */}
      <div className="header-center">
        <AISearchBar onAction={onAIAction} />
      </div>

      {/* ПРАВАЯ СЕКЦИЯ: Key + Mode */}
      <div className="header-meta">
        <span className="header-meta-item">
          <span className="header-meta-label">Key</span>
          <span className="header-meta-value">{keyNote}</span>
        </span>
        <span className="header-meta-item">
          <span className="header-meta-label">Mode</span>
          <span className="header-meta-value header-meta-accent">{mode.replace('_', ' ')}</span>
        </span>
      </div>

    </header>
  );
};

export default Header;
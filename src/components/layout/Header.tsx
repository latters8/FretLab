import React, { useState, useEffect } from 'react';
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
    <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      
      {/* ЛЕВАЯ СЕКЦИЯ */}
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '20px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>
          # FRETLAB
        </div>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
        >
          <option value="default">🎚 Default Steel</option>
          <option value="nebula">🌌 Nebula Graphite</option>
          <option value="titanium">⚡ Titanium Citrine</option>
          <option value="crimson">🩸 Crimson Onyx</option>
        </select>
      </div>

      {/* ЦЕНТРАЛЬНАЯ СЕКЦИЯ: Глобальный поиск ИИ */}
      <div style={{ flex: 1, maxWidth: '500px', display: 'flex', justifyContent: 'center' }}>
        <AISearchBar onAction={onAIAction} />
      </div>

      {/* ПРАВАЯ СЕКЦИЯ: Чистый статус тональности без кнопок-лесенок */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, minWidth: '160px', justifyContent: 'flex-end' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Key <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{keyNote}</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Mode <span style={{ color: 'var(--accent)', fontSize: '14px' }}>{mode.replace('_', ' ')}</span></span>
      </div>

    </header>
  );
};

export default Header;
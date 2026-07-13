import React, { useState, useEffect } from 'react';
import AISearchBar from '../ai/AISearchBar';

interface HeaderProps {
  onAIAction?: (action: any) => void;
}

const Header: React.FC<HeaderProps> = ({ onAIAction }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('fretlab_theme') || 'default');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fretlab_theme', theme);
  }, [theme]);

  return (
    <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '20px', letterSpacing: '2px' }}># FRETLAB</div>
        <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
          <option value="default">🎚 Default</option>
          <option value="nebula">🌌 Nebula</option>
          <option value="titanium">⚡ Titanium</option>
          <option value="crimson">🩸 Crimson</option>
        </select>
      </div>

      <div style={{ flex: 1, maxWidth: '600px', display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
        <AISearchBar onAction={onAIAction} />
      </div>

      {/* Оставляем пустое место для баланса или можно добавить User Profile в будущем */}
      <div style={{ width: '100px' }} />
    </header>
  );
};

export default Header;
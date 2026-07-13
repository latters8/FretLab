import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';
import AISearchBar from '../ai/AISearchBar';

// 🔥 Возвращаем пропсы
interface HeaderProps {
  onAIAction?: (action: any) => void;
}

const Header: React.FC<HeaderProps> = ({ onAIAction }) => {
  const { keyNote, mode, bpm, setBpm, isPlaying, togglePlay } = useMusic();
  const [theme, setTheme] = useState(() => localStorage.getItem('fretlab_theme') || 'default');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fretlab_theme', theme);
  }, [theme]);

  useMetronome(bpm);

  return (
    <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      
      {/* ЛЕВАЯ КОЛОНКА (Логотип и темы) */}
      <div className="header-brand" style={{ width: '300px', display: 'flex', alignItems: 'center', gap: '16px' }}>
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

      {/* 🔥 ЦЕНТРАЛЬНАЯ КОЛОНКА (Поиск встроен в прехедер!) */}
      <div style={{ flex: 1, maxWidth: '600px', display: 'flex', justifyContent: 'center' }}>
        <AISearchBar onAction={onAIAction} />
      </div>

      {/* ПРАВАЯ КОЛОНКА (Метроном и данные) */}
      <div className="header-controls" style={{ width: '300px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, flexShrink: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Key <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{keyNote}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Mode <span style={{ color: 'var(--accent)', fontSize: '14px' }}>{mode.replace('_', ' ')}</span></span>
        </div>

        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border-color)', flexShrink: 0, minWidth: '110px', justifyContent: 'center'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>BPM</span>
          <input type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} style={{ width: '50px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px', outline: 'none', textAlign: 'center', padding: 0 }} />
        </div>

        <button onClick={togglePlay} style={{ width: '40px', height: '40px', borderRadius: '50%', background: isPlaying ? 'var(--accent)' : 'var(--bg-primary)', color: isPlaying ? '#000' : 'var(--accent)', border: `2px solid var(--accent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', boxShadow: isPlaying ? '0 0 16px var(--accent)' : 'none', flexShrink: 0 }}>
          {isPlaying ? '■' : '▶'}
        </button>
      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';

const Header: React.FC = () => {
  const { keyNote, mode, bpm, setBpm, isPlaying, togglePlay } = useMusic();
  
  // Инициализируем тему из localStorage или ставим дефолтную
  const [theme, setTheme] = useState(() => localStorage.getItem('fretlab_theme') || 'default');

  // 🔥 Эффект применения темы к документу
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fretlab_theme', theme);
  }, [theme]);

  // Передаем текущий bpm в хук метронома
  useMetronome(bpm);

  return (
    <header style={{ height: '64px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '20px', letterSpacing: '2px' }}>
          # FRETLAB
        </div>

        {/* 🔥 СЕЛЕКТОР ТЕМ ОФОРМЛЕНИЯ (ВОЗВРАЩЕН НА МЕСТО) */}
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

      {/* Context Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Key <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{keyNote}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Mode <span style={{ color: 'var(--accent)', fontSize: '14px' }}>{mode}</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>BPM</span>
          <input type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px', outline: 'none' }} />
        </div>

        <button onClick={togglePlay} style={{ width: '40px', height: '40px', borderRadius: '50%', background: isPlaying ? 'var(--accent)' : 'var(--bg-primary)', color: isPlaying ? '#000' : 'var(--accent)', border: `2px solid var(--accent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', boxShadow: isPlaying ? '0 0 16px var(--accent)' : 'none' }}>
          {isPlaying ? '■' : '▶'}
        </button>
      </div>
    </header>
  );
};

export default Header;
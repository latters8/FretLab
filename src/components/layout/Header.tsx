import React, { useEffect, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import AISearchBar from '../ai/AISearchBar';

const Header: React.FC = () => {
  const { keyNote, mode, bpm, setBpm, isPlaying, togglePlay } = useMusic();
  const [theme, setTheme] = useState('nebula-graphite');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)', height: '64px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--accent)', letterSpacing: '1px' }}>♯ FRETLAB</div>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700 }}
        >
          <option value="nebula-graphite">Nebula Graphite</option>
          <option value="titanium-citrine">Titanium Citrine</option>
          <option value="crimson-onyx">Crimson Onyx</option>
        </select>
      </div>
      
      <AISearchBar />

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', background: 'var(--bg-primary)', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <span><span style={{ color: 'var(--text-muted)' }}>KEY</span> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{keyNote}</span></span>
          <span><span style={{ color: 'var(--text-muted)' }}>MODE</span> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{mode}</span></span>
        </div>

        {/* ТРАНСПОРТНАЯ ПАНЕЛЬ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>BPM</span>
              <input type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} 
                  style={{ width: '45px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 800, fontSize: '16px', outline: 'none' }} />
          </div>

          <button 
              onClick={togglePlay}
              style={{ 
                  width: '44px', height: '44px', borderRadius: '50%', 
                  background: isPlaying ? 'var(--accent-blue)' : 'var(--accent)', 
                  border: 'none', color: '#000', cursor: 'pointer', fontSize: '18px',
                  boxShadow: `0 0 15px ${isPlaying ? 'var(--accent-blue)' : 'var(--accent)'}`,
                  transition: 'all 0.2s'
              }}>
            {isPlaying ? '⏹' : '▶'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
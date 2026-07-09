import React, { useEffect, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import AISearchBar from '../ai/AISearchBar';
import { useMetronome } from '../../hooks/useMetronome';

const Header: React.FC = () => {
  // Убираем keyNote и mode, так как они не используются
  const { bpm, setBpm } = useMusic();
  const [theme, setTheme] = useState('nebula-graphite');
  const { isPlaying, setIsPlaying } = useMetronome(bpm);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <header style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 20px', 
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)', 
        height: '64px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
        zIndex: 100,
        position: 'relative'
    }}>
      {/* Левая часть: Логотип и выбор темы */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ 
          fontWeight: 800, 
          fontSize: '18px', 
          color: 'var(--accent)', 
          letterSpacing: '1px' 
        }}>
          ♯ FRETLAB
        </div>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)} 
          style={{ 
            background: 'var(--bg-hover)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--text-secondary)', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '10px', 
            cursor: 'pointer', 
            textTransform: 'uppercase', 
            fontWeight: 700,
            outline: 'none'
          }}
        >
          <option value="nebula-graphite">Nebula</option>
          <option value="titanium-citrine">Citrine</option>
          <option value="crimson-onyx">Onyx</option>
        </select>
      </div>
      
      {/* Центральная часть: AI Search Bar */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <AISearchBar />
      </div>

      {/* Правая часть: BPM контроль и метроном */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Контроллер BPM */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'var(--bg-primary)', 
          padding: '4px 12px 4px 16px', 
          borderRadius: '20px', 
          border: '1px solid var(--border-color)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
            BPM
          </span>
          <input 
            type="number" 
            value={bpm} 
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 20 && value <= 300) {
                setBpm(value);
              }
            }}
            min="20"
            max="300"
            style={{ 
              width: '44px', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--accent)', 
              fontWeight: 800, 
              fontSize: '15px', 
              outline: 'none',
              padding: '2px 0',
              textAlign: 'center'
            }} 
          />
        </div>

        {/* Кнопка Play/Stop метронома */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: isPlaying ? 'var(--accent-blue, #3498db)' : 'var(--accent)', 
            border: 'none', 
            color: '#000', 
            cursor: 'pointer',
            fontSize: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: isPlaying 
              ? '0 0 20px rgba(52, 152, 219, 0.5)' 
              : '0 0 10px var(--accent)',
            transition: 'all 0.2s ease',
            transform: isPlaying ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {isPlaying ? '⏹' : '▶'}
        </button>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';

const ToolBox: React.FC = () => {
  const { bpm, setBpm, isPlaying, togglePlay } = useMusic();
  useMetronome(bpm);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Заголовок */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
        Control Center
      </div>

      {/* BPM Метроном */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-root)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800 }}>BPM</span>
        <input 
          type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} 
          style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 900, fontSize: '18px', outline: 'none', textAlign: 'center' }} 
        />
        <button onClick={togglePlay} style={{ marginLeft: 'auto', width: '40px', height: '40px', borderRadius: '50%', background: isPlaying ? 'var(--accent)' : 'var(--bg-secondary)', color: isPlaying ? '#000' : 'var(--accent)', border: `2px solid var(--accent)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPlaying ? '■' : '▶'}
        </button>
      </div>

      {/* Тюнер (Placeholder) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
        <span style={{ fontSize: '14px', fontWeight: 800 }}>🪕 Digital Tuner</span>
      </div>

    </div>
  );
};

export default ToolBox;
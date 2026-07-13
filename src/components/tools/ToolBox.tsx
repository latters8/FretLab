import React from 'react';
import { useMusic } from '../../context/MusicContext';

const ToolBox: React.FC = () => {
  const { bpm, setBpm, isPlaying, togglePlay } = useMusic();

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      borderRadius: 'var(--radius)', 
      border: '1px solid var(--border-color)', 
      padding: '24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px',
      flexShrink: 0 // Защита от сжатия flex-боксом
    }}>
      
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
        🎛️ Control Center
      </div>

      {/* Блок Метронома */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-root)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>TEMPO</span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 900 }}>BPM</span>
        </div>
        
        <input 
          type="number" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))} 
          style={{ 
            width: '70px', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '6px',
            color: 'var(--text-primary)', 
            fontWeight: 900, 
            fontSize: '18px', 
            outline: 'none', 
            textAlign: 'center',
            padding: '4px 0'
          }} 
        />
        
        <button 
          onClick={togglePlay} 
          style={{ 
            marginLeft: 'auto', 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            background: isPlaying ? 'var(--accent)' : 'var(--bg-secondary)', 
            color: isPlaying ? '#000' : 'var(--accent)', 
            border: `2px solid var(--accent)`, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '16px',
            transition: '0.2s',
            boxShadow: isPlaying ? '0 0 12px var(--accent)' : 'none'
          }}
        >
          {isPlaying ? '■' : '▶'}
        </button>
      </div>

      {/* Будущий Тюнер */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '16px', 
          borderRadius: '12px', 
          border: '1px dashed var(--border-color)', 
          color: 'var(--text-muted)', 
          cursor: 'pointer', 
          transition: '0.2s',
          fontSize: '13px',
          fontWeight: 800
        }} 
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }} 
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        🪕 Digital Tuner (Coming Soon)
      </div>

    </div>
  );
};

export default ToolBox;
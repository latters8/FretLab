import React from 'react';
import { useMusic } from '../../context/MusicContext';

const KEYS_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const KEYS_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

const CircleOfFifths: React.FC = () => {
  const { keyNote, setKeyNote } = useMusic();

  const activeIndex = Math.max(0, KEYS_MAJOR.indexOf(keyNote));
  const rotation = -activeIndex * 30;

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      <div style={{ position: 'relative', width: '280px', height: '280px', transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)', transform: `rotate(${rotation}deg)` }}>
        
        {/* Внутреннее декоративное кольцо */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', borderRadius: '50%', border: '1px dashed var(--border-color)', opacity: 0.5, pointerEvents: 'none' }} />

        {/* Мажорное внешнее кольцо */}
        {KEYS_MAJOR.map((key, i) => {
          const angle = i * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 140 + 120 * Math.cos(rad); 
          const y = 140 + 120 * Math.sin(rad);
          const isActive = key === keyNote;
          
          return (
            <div 
              key={key}
              onClick={() => setKeyNote(key)}
              style={{
                position: 'absolute', left: `${x}px`, top: `${y}px`, transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                width: '38px', height: '38px', borderRadius: '50%',
                background: isActive ? 'var(--accent)' : 'var(--bg-primary)',
                color: isActive ? '#000' : 'var(--text-primary)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 20px var(--accent)' : 'none', zIndex: isActive ? 10 : 1
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {key}
            </div>
          );
        })}
        
        {/* Минорное внутреннее кольцо */}
        {KEYS_MINOR.map((key, i) => {
          const angle = i * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 140 + 75 * Math.cos(rad); 
          const y = 140 + 75 * Math.sin(rad);
          const isRelative = i === activeIndex;
          
          return (
            <div 
              key={key}
              style={{
                position: 'absolute', left: `${x}px`, top: `${y}px`, transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                color: isRelative ? 'var(--accent)' : 'var(--text-muted)', 
                fontSize: '11px', fontWeight: isRelative ? 900 : 600, pointerEvents: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {key}
            </div>
          );
        })}

        {/* Центр: Индикатор тональности */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${-rotation}deg)`, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 900, textShadow: '0 0 12px rgba(255,255,255,0.2)' }}>{keyNote}</div>
            <div style={{ color: 'var(--accent)', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', marginTop: '4px' }}>KEY</div>
        </div>

      </div>
    </div>
  );
};

export default CircleOfFifths;
import React from 'react';
import { useMusic } from '../../context/MusicContext';

const KEYS_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const KEYS_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

const CircleOfFifths: React.FC = () => {
  const { keyNote, mode, setKeyNote, setMode } = useMusic();

  const isMinorMode = mode === 'minor';
  
  // Вычисляем индекс вращения на основе текущей активной ноты
  let activeIndex = KEYS_MAJOR.indexOf(keyNote);
  if (activeIndex === -1) {
    activeIndex = KEYS_MINOR.indexOf(keyNote + 'm');
  }
  if (activeIndex === -1) activeIndex = 0;

  const rotation = -activeIndex * 30;

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* 🔥 ИСПРАВЛЕНО: Компактный размер 230px гарантирует 100% вход в границы сайдбара */}
      <div style={{ position: 'relative', width: '230px', height: '230px', transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)', transform: `rotate(${rotation}deg)` }}>
        
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', borderRadius: '50%', border: '1px dashed var(--border-color)', opacity: 0.3, pointerEvents: 'none' }} />

        {/* 1. ВНЕШНЕЕ КОЛЬЦО (МАЖОР) */}
        {KEYS_MAJOR.map((key, i) => {
          const angle = i * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 115 + 98 * Math.cos(rad); 
          const y = 115 + 98 * Math.sin(rad);
          const isActive = key === keyNote && !isMinorMode;
          
          return (
            <div 
              key={key}
              onClick={() => {
                setKeyNote(key);
                setMode('major'); // 🔥 Автоматический мажор при клике на внешний круг
              }}
              style={{
                position: 'absolute', left: `${x}px`, top: `${y}px`, transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                width: '32px', height: '32px', borderRadius: '50%',
                background: isActive ? 'var(--accent)' : 'var(--bg-primary)',
                color: isActive ? '#000' : 'var(--text-primary)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 15px var(--accent)' : 'none', zIndex: isActive ? 10 : 1
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {key}
            </div>
          );
        })}
        
        {/* 2. ВНУТРЕННЕЕ КОЛЬЦО (МИНОР) */}
        {KEYS_MINOR.map((key, i) => {
          const angle = i * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 115 + 60 * Math.cos(rad); 
          const y = 115 + 60 * Math.sin(rad);
          
          const cleanKey = key.replace('m', '');
          const isActive = cleanKey === keyNote && isMinorMode;
          
          return (
            <div 
              key={key}
              onClick={() => {
                setKeyNote(cleanKey);
                setMode('minor'); // 🔥 Автоматический минор при клике на внутренний круг
              }}
              style={{
                position: 'absolute', left: `${x}px`, top: `${y}px`, transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                width: '28px', height: '28px', borderRadius: '50%',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#000' : 'var(--text-muted)',
                border: isActive ? 'none' : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 12px var(--accent)' : 'none', zIndex: isActive ? 9 : 1
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              {key}
            </div>
          );
        })}

        {/* 3. ЦЕНТРАЛЬНЫЙ ДИСПЛЕЙ */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${-rotation}deg)`, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 900, lineHeight: 1 }}>{keyNote}{isMinorMode ? 'm' : ''}</div>
            <div style={{ color: 'var(--accent)', fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', marginTop: '4px' }}>TONIC</div>
        </div>

      </div>
    </div>
  );
};

export default CircleOfFifths;
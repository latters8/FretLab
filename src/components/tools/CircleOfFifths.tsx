import React from 'react';
import { useMusic } from '../../context/MusicContext';

const KEYS_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const KEYS_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

// 🔥 ИСПРАВЛЕНО: Маппинг бемолей в диезы для корректной работы ядра
const ENHARMONIC_MAP: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
const normalize = (note: string) => ENHARMONIC_MAP[note] || note;
const isEnharmonic = (n1: string, n2: string) => normalize(n1) === normalize(n2);

const CircleOfFifths: React.FC = () => {
  const { keyNote, mode, setKeyNote, setMode } = useMusic();

  const isMinorMode = mode === 'minor';
  
  // 🔥 Вычисляем индекс с учетом энгармонизмов (Bb === A#)
  let activeIndex = KEYS_MAJOR.findIndex(k => isEnharmonic(k, keyNote));
  if (activeIndex === -1) {
    activeIndex = KEYS_MINOR.findIndex(k => isEnharmonic(k.replace('m', ''), keyNote));
  }
  if (activeIndex === -1) activeIndex = 0;

  const rotation = -activeIndex * 30;

  return (
    // 🔥 ИСПРАВЛЕНО: Жесткая высота и запрет на сжатие (flexShrink: 0)
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', height: '280px', flexShrink: 0 }}>
      
      <div style={{ position: 'relative', width: '230px', height: '230px', transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)', transform: `rotate(${rotation}deg)` }}>
        
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', borderRadius: '50%', border: '1px dashed var(--border-color)', opacity: 0.3, pointerEvents: 'none' }} />

        {/* ВНЕШНЕЕ КОЛЬЦО (МАЖОР) */}
        {KEYS_MAJOR.map((key, i) => {
          const angle = i * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 115 + 98 * Math.cos(rad); 
          const y = 115 + 98 * Math.sin(rad);
          const isActive = isEnharmonic(key, keyNote) && !isMinorMode;
          
          return (
            <div 
              key={key}
              onClick={() => {
                setKeyNote(normalize(key)); // 🔥 Нормализуем перед отправкой в State
                setMode('major'); 
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
        
        {/* ВНУТРЕННЕЕ КОЛЬЦО (МИНОР) */}
        {KEYS_MINOR.map((key, i) => {
          const angle = i * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 115 + 60 * Math.cos(rad); 
          const y = 115 + 60 * Math.sin(rad);
          
          const cleanKey = key.replace('m', '');
          const isActive = isEnharmonic(cleanKey, keyNote) && isMinorMode;
          
          return (
            <div 
              key={key}
              onClick={() => {
                setKeyNote(normalize(cleanKey)); // 🔥 Нормализуем перед отправкой в State
                setMode('minor'); 
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

        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${-rotation}deg)`, textAlign: 'center', pointerEvents: 'none' }}>
            {/* Отрисовываем исходную ноту, даже если внутри это диез */}
            <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 900, lineHeight: 1 }}>{keyNote}{isMinorMode ? 'm' : ''}</div>
            <div style={{ color: 'var(--accent)', fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', marginTop: '4px' }}>TONIC</div>
        </div>

      </div>
    </div>
  );
};

export default CircleOfFifths;
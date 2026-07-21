// src/components/harmony/CircleOfFifths.tsx

import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';

const KEYS_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const KEYS_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

const ENHARMONIC_MAP: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
const normalize = (note: string) => ENHARMONIC_MAP[note] || note;
const isEnharmonic = (n1: string, n2: string) => normalize(n1) === normalize(n2);

const CircleOfFifths: React.FC = () => {
  const { keyNote, mode, setKeyNote, setMode } = useMusic();
  const [size, setSize] = useState(300);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w <= 400) setSize(170);
      else if (w <= 480) setSize(220);
      else if (w <= 768) setSize(250);
      else setSize(300);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMinorMode = mode === 'minor';
  
  let activeIndex = KEYS_MAJOR.findIndex(k => isEnharmonic(k, keyNote));
  if (activeIndex === -1) {
    activeIndex = KEYS_MINOR.findIndex(k => isEnharmonic(k.replace('m', ''), keyNote));
  }
  // 🔥 ЕСЛИ НЕ НАШЛИ — СТАВИМ Em (индекс 1 в KEYS_MINOR)
  if (activeIndex === -1) activeIndex = 1; // Em

  const rotation = -activeIndex * 30;

  const SIZE = size;
  const CENTER = SIZE / 2;
  const OUTER_RADIUS = SIZE * 0.38;
  const INNER_RADIUS = SIZE * 0.24;
  const DOT_SIZE_OUTER = Math.max(32, Math.min(44, SIZE * 0.15));
  const DOT_SIZE_INNER = Math.max(28, Math.min(38, SIZE * 0.13));
  const FONT_SIZE_OUTER = Math.max(11, Math.min(15, SIZE * 0.05));
  const FONT_SIZE_INNER = Math.max(10, Math.min(13, SIZE * 0.045));
  const FONT_SIZE_CENTER = Math.max(20, Math.min(32, SIZE * 0.11));

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      borderRadius: 'var(--radius)', 
      border: '1px solid var(--border-color)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      overflow: 'hidden', 
      height: '340px',
      flexShrink: 0,
      padding: '8px'
    }}>
      
      <div style={{ 
        position: 'relative', 
        width: `${SIZE}px`, 
        height: `${SIZE}px`, 
        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)', 
        transform: `rotate(${rotation}deg)` 
      }}>
        
        {/* Декоративное кольцо */}
        <div style={{ 
          position: 'absolute', 
          top: '16px', 
          left: '16px', 
          right: '16px', 
          bottom: '16px', 
          borderRadius: '50%', 
          border: '1px dashed var(--border-color)', 
          opacity: 0.2, 
          pointerEvents: 'none' 
        }} />

        {/* ВНЕШНЕЕ КОЛЬЦО (МАЖОР) */}
        {KEYS_MAJOR.map((key, i) => {
          const angle = i * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = CENTER + OUTER_RADIUS * Math.cos(rad);
          const y = CENTER + OUTER_RADIUS * Math.sin(rad);
          const isActive = isEnharmonic(key, keyNote) && !isMinorMode;
          
          return (
            <div 
              key={key}
              onClick={() => {
                setKeyNote(normalize(key));
                setMode('major'); 
              }}
              style={{
                position: 'absolute', 
                left: `${x}px`, 
                top: `${y}px`, 
                transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                width: `${DOT_SIZE_OUTER}px`, 
                height: `${DOT_SIZE_OUTER}px`, 
                borderRadius: '50%',
                background: isActive ? 'var(--accent)' : 'var(--bg-primary)',
                color: isActive ? '#000' : 'var(--text-primary)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: `${FONT_SIZE_OUTER}px`, 
                fontWeight: 900, 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 24px var(--accent)' : 'none', 
                zIndex: isActive ? 10 : 1,
                userSelect: 'none'
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
          const x = CENTER + INNER_RADIUS * Math.cos(rad);
          const y = CENTER + INNER_RADIUS * Math.sin(rad);
          
          const cleanKey = key.replace('m', '');
          const isActive = isEnharmonic(cleanKey, keyNote) && isMinorMode;
          
          return (
            <div 
              key={key}
              onClick={() => {
                setKeyNote(normalize(cleanKey));
                setMode('minor'); 
              }}
              style={{
                position: 'absolute', 
                left: `${x}px`, 
                top: `${y}px`, 
                transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                width: `${DOT_SIZE_INNER}px`, 
                height: `${DOT_SIZE_INNER}px`, 
                borderRadius: '50%',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#000' : '#ffffff',
                border: isActive ? 'none' : '1px solid transparent',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: `${FONT_SIZE_INNER}px`, 
                fontWeight: 900, 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 20px var(--accent)' : 'none', 
                zIndex: isActive ? 9 : 1,
                userSelect: 'none',
                textShadow: isActive ? 'none' : '0 0 8px rgba(0,0,0,0.8)'
              }}
              onMouseEnter={e => { 
                if (!isActive) { 
                  e.currentTarget.style.borderColor = 'var(--accent)'; 
                  e.currentTarget.style.color = 'var(--accent)'; 
                } 
              }}
              onMouseLeave={e => { 
                if (!isActive) { 
                  e.currentTarget.style.borderColor = 'transparent'; 
                  e.currentTarget.style.color = '#ffffff'; 
                } 
              }}
            >
              {key}
            </div>
          );
        })}

        {/* ЦЕНТР */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: `translate(-50%, -50%) rotate(${-rotation}deg)`, 
          textAlign: 'center', 
          pointerEvents: 'none' 
        }}>
          <div style={{ 
            color: 'var(--text-primary)', 
            fontSize: `${FONT_SIZE_CENTER}px`, 
            fontWeight: 900, 
            lineHeight: 1 
          }}>
            {keyNote}{isMinorMode ? 'm' : ''}
          </div>
          <div style={{ 
            color: 'var(--accent)', 
            fontSize: '11px', 
            fontWeight: 800, 
            letterSpacing: '1.5px', 
            marginTop: '4px',
            opacity: 0.8
          }}>
            TONIC
          </div>
        </div>

      </div>
    </div>
  );
};

export default CircleOfFifths;
import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';

// Типы для нашего внутреннего движка табулатур
type Technique = 'none' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'bend';

interface TabNote {
  string: number; // 0 (e) to 5 (E)
  fret: number;
  duration: 'quarter' | 'eighth' | 'sixteenth';
  technique: Technique;
  tiedToNext?: boolean; // Для дуг легато
}

interface Lick {
  name: string;
  notes: TabNote[];
}

const Tablature: React.FC = () => {
  const { mode, keyNote } = useMusic();
  const [isGenerating, setIsGenerating] = useState(false);

  // Демонстрационный лик (Фраза), который мы отрендерим
  // Позже мы будем генерировать его через AI
  const currentLick: Lick = {
    name: `${keyNote} ${mode} Signature Lick`,
    notes: [
      { string: 3, fret: 5, duration: 'eighth', technique: 'none' },
      { string: 3, fret: 7, duration: 'sixteenth', technique: 'hammer', tiedToNext: true },
      { string: 2, fret: 5, duration: 'sixteenth', technique: 'none' },
      { string: 2, fret: 7, duration: 'eighth', technique: 'slide', tiedToNext: true },
      { string: 2, fret: 9, duration: 'eighth', technique: 'none' },
      { string: 1, fret: 8, duration: 'eighth', technique: 'none' },
      { string: 1, fret: 10, duration: 'quarter', technique: 'vibrato' },
    ]
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 800);
  };

  // Константы для рендеринга SVG
  const stringSpacing = 20;
  const startY = 40;
  const noteSpacing = 70;
  const startX = 80;

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            📄 AI Phrase Generator (Pro SVG)
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>
            {currentLick.name}
          </span>
        </div>
        <button 
          onClick={handleGenerate}
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: '0.2s', display: 'flex', gap: '8px', alignItems: 'center' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          {isGenerating ? '⏳ GENERATING...' : '🎲 GENERATE LICK'}
        </button>
      </div>

      {/* SVG TABLATURE RENDERER */}
      <div style={{ padding: '24px', overflowX: 'auto', background: '#111216' }}>
        <svg viewBox="0 0 800 240" style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}>
          
          {/* 1. РИСУЕМ СТРУНЫ (Горизонтальные линии) */}
          {[0, 1, 2, 3, 4, 5].map((strIndex) => (
            <line 
              key={`str-${strIndex}`}
              x1="30" y1={startY + strIndex * stringSpacing} 
              x2="770" y2={startY + strIndex * stringSpacing} 
              stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
            />
          ))}

          {/* Названия струн слева (Tuning) */}
          {['e', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
            <text key={`tune-${i}`} x="45" y={startY + i * stringSpacing + 4} fill="var(--text-muted)" fontSize="12" fontWeight="800" fontFamily="monospace" textAnchor="middle">
              {note}
            </text>
          ))}

          {/* Тактовая черта */}
          <line x1="70" y1={startY} x2="70" y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />
          <line x1="770" y1={startY} x2="770" y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />

          {/* 2. РИСУЕМ НОТЫ, ШТИЛИ И ТЕХНИКИ */}
          {currentLick.notes.map((note, index) => {
            const x = startX + index * noteSpacing;
            const y = startY + note.string * stringSpacing;
            const nextX = startX + (index + 1) * noteSpacing;
            const nextY = startY + (currentLick.notes[index + 1]?.string || 0) * stringSpacing;
            
            // Вычисляем длину штиля (вниз)
            const stemBottomY = 190;
            
            return (
              <g key={`note-${index}`} style={{ opacity: isGenerating ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                
                {/* ДУГИ ЛЕГАТО (Hammer-on / Pull-off / Slide) */}
                {note.tiedToNext && currentLick.notes[index + 1] && (
                  <path 
                    d={`M ${x + 6} ${y - 12} Q ${(x + nextX) / 2} ${Math.min(y, nextY) - 25} ${nextX - 6} ${nextY - 12}`} 
                    fill="transparent" stroke="var(--text-muted)" strokeWidth="1.5"
                  />
                )}
                {note.technique === 'slide' && (
                  <line x1={x + 12} y1={y - 8} x2={nextX - 12} y2={nextY + 8} stroke="var(--accent)" strokeWidth="2" opacity="0.7" />
                )}
                {note.technique === 'vibrato' && (
                  <path d={`M ${x-10} ${y-20} Q ${x-5} ${y-25} ${x} ${y-20} T ${x+10} ${y-20} T ${x+20} ${y-20}`} fill="transparent" stroke="var(--accent)" strokeWidth="2" />
                )}

                {/* ШТИЛЬ (Stem) для отображения ритма */}
                <line x1={x} y1={y + 10} x2={x} y2={stemBottomY} stroke="var(--text-muted)" strokeWidth="1.5" />
                
                {/* Хвостики для 8-х и 16-х нот */}
                {(note.duration === 'eighth' || note.duration === 'sixteenth') && (
                  <line x1={x} y1={stemBottomY} x2={x + 15} y2={stemBottomY - 5} stroke="var(--text-muted)" strokeWidth="2" />
                )}
                {note.duration === 'sixteenth' && (
                  <line x1={x} y1={stemBottomY - 6} x2={x + 15} y2={stemBottomY - 11} stroke="var(--text-muted)" strokeWidth="2" />
                )}

                {/* ФОН НОТЫ (чтобы перекрыть линию струны) */}
                <rect x={x - 10} y={y - 10} width="20" height="20" fill="#111216" />

                {/* САМА НОТА (Лады) */}
                <text 
                  x={x} y={y + 4} 
                  fill={note.technique !== 'none' ? 'var(--accent)' : 'var(--text-primary)'} 
                  fontSize="14" fontWeight="800" fontFamily="monospace" textAnchor="middle"
                >
                  {note.fret}
                </text>

                {/* Подпись техники (H, P, S) над дугой */}
                {note.tiedToNext && (
                  <text x={(x + nextX) / 2} y={Math.min(y, nextY) - 20} fill="var(--accent)" fontSize="10" fontWeight="800" textAnchor="middle">
                    {note.technique === 'hammer' ? 'H' : note.technique === 'pull' ? 'P' : note.technique === 'slide' ? 'sl' : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default Tablature;
import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSmartLick, type Lick } from '../../services/AIEngine';

const Tablature: React.FC<{ activeStep?: number }> = ({ activeStep = -1 }) => {
  const { mode, keyNote, getScaleNotes } = useMusic();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLick, setCurrentLick] = useState<Lick | null>(null);

  // Генерируем фразу при первой загрузке или при смене тональности
  useEffect(() => {
    const scale = getScaleNotes();
    if (scale.length > 0) {
      setCurrentLick(generateSmartLick(scale, keyNote, mode));
    }
  }, [keyNote, mode]);

  const handleGenerate = () => {
    setIsGenerating(true);
    const scale = getScaleNotes();
    setTimeout(() => {
      setCurrentLick(generateSmartLick(scale, keyNote, mode));
      setIsGenerating(false);
    }, 400);
  };

  const stringSpacing = 20;
  const startY = 40;
  const noteSpacing = 70;
  const startX = 80;

  if (!currentLick) return null;

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
          disabled={isGenerating}
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: '0.2s', display: 'flex', gap: '8px', alignItems: 'center' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          {isGenerating ? '⏳ GENERATING...' : '🎲 GENERATE LICK'}
        </button>
      </div>

      {/* SVG TABLATURE RENDERER */}
      <div style={{ padding: '24px', overflowX: 'auto', background: '#111216' }}>
        <svg viewBox={`0 0 ${Math.max(800, currentLick.notes.length * noteSpacing + 150)} 240`} style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}>
          
          {/* РИСУЕМ СТРУНЫ */}
          {[0, 1, 2, 3, 4, 5].map((strIndex) => (
            <line 
              key={`str-${strIndex}`}
              x1="30" y1={startY + strIndex * stringSpacing} 
              x2={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y2={startY + strIndex * stringSpacing} 
              stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
            />
          ))}

          {/* Названия струн слева */}
          {['e', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
            <text key={`tune-${i}`} x="45" y={startY + i * stringSpacing + 4} fill="var(--text-muted)" fontSize="12" fontWeight="800" fontFamily="monospace" textAnchor="middle">
              {note}
            </text>
          ))}

          {/* Тактовая черта */}
          <line x1="70" y1={startY} x2="70" y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />
          <line x1={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y1={startY} x2={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />

          {/* РИСУЕМ НОТЫ, ШТИЛИ И ТЕХНИКИ */}
          {currentLick.notes.map((note, index) => {
            const x = startX + index * noteSpacing;
            const y = startY + note.string * stringSpacing;
            const nextX = startX + (index + 1) * noteSpacing;
            const nextY = startY + (currentLick.notes[index + 1]?.string || 0) * stringSpacing;
            
            const stemBottomY = 190;
            const isActive = activeStep === index;
            
            return (
              <g key={`note-${index}`} style={{ opacity: isGenerating ? 0.3 : 1, transition: 'all 0.2s' }}>
                
                {/* ДУГИ ЛЕГАТО */}
                {note.tiedToNext && currentLick.notes[index + 1] && (
                  <path 
                    d={`M ${x + 6} ${y - 12} Q ${(x + nextX) / 2} ${Math.min(y, nextY) - 25} ${nextX - 6} ${nextY - 12}`} 
                    fill="transparent" stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5"
                  />
                )}
                {note.technique === 'slide' && (
                  <line x1={x + 12} y1={y - 8} x2={nextX - 12} y2={nextY + 8} stroke="var(--accent)" strokeWidth="2" opacity="0.7" />
                )}
                {note.technique === 'vibrato' && (
                  <path d={`M ${x-10} ${y-20} Q ${x-5} ${y-25} ${x} ${y-20} T ${x+10} ${y-20} T ${x+20} ${y-20}`} fill="transparent" stroke="var(--accent)" strokeWidth="2" />
                )}

                {/* ШТИЛЬ (Stem) */}
                <line x1={x} y1={y + 10} x2={x} y2={stemBottomY} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5" />
                
                {/* Хвостики длительностей */}
                {(note.duration === 'eighth' || note.duration === 'sixteenth') && (
                  <line x1={x} y1={stemBottomY} x2={x + 15} y2={stemBottomY - 5} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                )}
                {note.duration === 'sixteenth' && (
                  <line x1={x} y1={stemBottomY - 6} x2={x + 15} y2={stemBottomY - 11} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                )}

                {/* ФОН НОТЫ */}
                <rect x={x - 12} y={y - 12} width="24" height="24" fill="#111216" rx="4" />

                {/* САМА НОТА */}
                <text 
                  x={x} y={y + 4} 
                  fill={isActive ? '#000' : (note.technique !== 'none' ? 'var(--accent)' : 'var(--text-primary)')} 
                  fontSize={isActive ? "16" : "14"} 
                  fontWeight="900" fontFamily="monospace" textAnchor="middle"
                >
                  {note.fret}
                </text>
                
                {isActive && (
                  <circle cx={x} cy={y} r="14" fill="var(--accent)" opacity="0.8" style={{ zIndex: -1 }} />
                )}

                {/* Подпись техники над дугой */}
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
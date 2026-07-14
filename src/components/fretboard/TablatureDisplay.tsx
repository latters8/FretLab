// src/components/fretboard/TablatureDisplay.tsx

import React from 'react';
import { type LickNote } from '../../services/AIEngine';

interface TablatureDisplayProps {
  notes: LickNote[];
  activeStep?: number;
  isGenerating?: boolean;
  height?: number;
  noteSpacing?: number;
  showStrings?: boolean;
  showFretNumbers?: boolean;
  compact?: boolean;
}

const TablatureDisplay: React.FC<TablatureDisplayProps> = ({
  notes,
  activeStep = -1,
  isGenerating = false,
  height = 200, // 🔥 Увеличили общую высоту
  noteSpacing = 85, // 🔥 Увеличили шаг между нотами (было 70)
  showStrings = true,
  showFretNumbers = true,
  compact = false
}) => {
  // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ РАЗМЕРОВ (УВЕЛИЧЕНО НА ~30%)
  const stringSpacing = compact ? 20 : 26; 
  const startY = compact ? 30 : 45;
  const startX = compact ? 60 : 80;
  const noteSize = compact ? 24 : 32; 

  if (!notes || notes.length === 0) {
    return (
      <div style={{ 
        color: 'var(--text-muted)', fontWeight: 800, fontSize: '14px', 
        textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-color)', 
        borderRadius: '8px', background: 'var(--bg-secondary)' 
      }}>
        {isGenerating ? 'GENERATING...' : 'NO DATA AVAILABLE'}
      </div>
    );
  }

  const totalWidth = startX + notes.length * noteSpacing + 100;

  return (
    <div style={{ 
      width: '100%', overflowX: 'auto', background: 'var(--bg-panel)', 
      borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' 
    }}>
      {isGenerating && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,16,20,0.8)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 900, letterSpacing: '2px' }}>
          ANALYZING FRETBOARD...
        </div>
      )}

      <svg width={totalWidth} height={height} style={{ minWidth: '100%', display: 'block' }}>
        {showStrings && [0, 1, 2, 3, 4, 5].map((i) => (
          <g key={`string-${i}`}>
            <line 
              x1={startX - 30} y1={startY + i * stringSpacing} 
              x2={totalWidth - 30} y2={startY + i * stringSpacing} 
              stroke="var(--border-color)" strokeWidth="1.5" 
            />
            {['e', 'B', 'G', 'D', 'A', 'E'].map((note, idx) => (
              i === idx && (
                <text 
                  key={`name-${idx}`} 
                  x={startX - 45} y={startY + idx * stringSpacing + 4} 
                  fill="var(--text-muted)" fontSize="14" fontWeight="800" fontFamily="monospace"
                >
                  {note}
                </text>
              )
            ))}
          </g>
        ))}

        {notes.map((note, index) => {
          const x = startX + index * noteSpacing;
          const y = startY + note.string * stringSpacing;
          const isActive = index === activeStep;
          const isAccent = note.accent;
          const isMuted = note.technique === 'mute' || note.technique === 'ghost';
          const isLegato = note.technique === 'hammer' || note.technique === 'pull';
          
          if (note.isRest) {
            return (
              <g key={index} style={{ transition: 'all 0.2s', opacity: isActive ? 1 : 0.6 }}>
                <rect x={x - 8} y={startY + 2.5 * stringSpacing - 10} width="16" height="20" fill="var(--text-muted)" rx="2" opacity="0.3" />
                {isActive && <circle cx={x} cy={startY + 2.5 * stringSpacing} r="18" fill="var(--accent)" opacity="0.2" />}
              </g>
            );
          }

          const stemBottomY = startY + 6 * stringSpacing + (compact ? 10 : 15);

          return (
            <g key={index} style={{ transition: 'all 0.1s', opacity: isMuted ? 0.6 : 1 }}>
              <line 
                x1={x} y1={y + 12} 
                x2={x} y2={stemBottomY} 
                stroke={isActive ? "var(--accent)" : "var(--text-muted)"} 
                strokeWidth="2" 
              />

              {note.duration === 'eighth' || note.duration === 'sixteenth' ? (
                <line x1={x} y1={stemBottomY} x2={x + 15} y2={stemBottomY - 5} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2.5" />
              ) : null}
              {note.duration === 'sixteenth' ? (
                <line x1={x} y1={stemBottomY - 6} x2={x + 15} y2={stemBottomY - 11} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2.5" />
              ) : null}

              {/* Фон цифры, чтобы перекрыть линию струны */}
              <rect x={x - noteSize/2} y={y - noteSize/2} width={noteSize} height={noteSize} fill="#111216" rx="4" />

              {isActive && (
                <circle cx={x} cy={y} r={noteSize/2 + 6} fill="var(--accent)" opacity="0.8" style={{ filter: 'drop-shadow(0 0 16px var(--accent))' }} />
              )}

              {showFretNumbers ? (
                <text 
                  x={x} y={y + (compact ? 5 : 6)} 
                  fill={isActive ? '#000' : (isLegato ? 'var(--accent)' : (note.technique !== 'none' && note.technique !== 'mute' ? 'var(--accent)' : 'var(--text-primary)'))} 
                  fontSize={isActive ? "20" : "18"} 
                  fontWeight={900} 
                  fontFamily="monospace" 
                  textAnchor="middle"
                >
                  {isMuted ? '×' : note.fret}
                </text>
              ) : (
                <circle cx={x} cy={y} r={isAccent ? 6 : 4} fill={isActive ? "var(--accent)" : "var(--text-primary)"} />
              )}

              {/* Отрисовка техник (вибрато, слайды и т.д.) */}
              {note.technique === 'vibrato' && (
                <path d={`M ${x-8} ${y-18} Q ${x-4} ${y-22} ${x} ${y-18} T ${x+8} ${y-18}`} fill="transparent" stroke="var(--accent)" strokeWidth="2"/>
              )}
              {note.technique === 'slide' && (
                <line x1={x-15} y1={y-8} x2={x-5} y2={y-15} stroke="var(--text-primary)" strokeWidth="2"/>
              )}
              {note.technique === 'bend' && (
                <path d={`M ${x} ${y-15} Q ${x+5} ${y-25} ${x+12} ${y-25}`} fill="transparent" stroke="var(--text-primary)" strokeWidth="2" markerEnd="url(#arrow)"/>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TablatureDisplay;
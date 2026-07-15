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
  height = 200,
  noteSpacing = 85,
  showStrings = true,
  showFretNumbers = true,
  compact = false
}) => {
  const stringSpacing = compact ? 20 : 26; 
  const startY = compact ? 30 : 45;
  const startX = compact ? 60 : 80;
  const noteSize = compact ? 24 : 32; 

  // Функция для определения длительности и флажков
  const getDurationInfo = (duration: string) => {
    const durationMap: Record<string, { value: number; flagCount: number; label: string }> = {
      'whole': { value: 4, flagCount: 0, label: 'whole' },
      'half': { value: 2, flagCount: 0, label: 'half' },
      'quarter': { value: 1, flagCount: 0, label: 'quarter' },
      'eighth': { value: 0.5, flagCount: 1, label: 'eighth' },
      'sixteenth': { value: 0.25, flagCount: 2, label: 'sixteenth' },
      'thirtysecond': { value: 0.125, flagCount: 3, label: 'thirtysecond' },
    };
    return durationMap[duration] || { value: 1, flagCount: 0, label: 'quarter' };
  };

  // Цвет в зависимости от длительности
  const getDurationColor = (duration: string, isActive: boolean) => {
    if (isActive) return 'var(--accent)';
    const colors: Record<string, string> = {
      'whole': '#9b59b6',
      'half': '#4d96ff',
      'quarter': '#6bcb77',
      'eighth': '#ffd93d',
      'sixteenth': '#ff6b6b',
      'thirtysecond': '#ff4757',
    };
    return colors[duration] || '#6bcb77';
  };

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
          
          // Получаем информацию о длительности
          const durationInfo = getDurationInfo(note.duration || 'quarter');
          const durationColor = getDurationColor(note.duration || 'quarter', isActive);
          const flagCount = durationInfo.flagCount;
          const isFilled = durationInfo.value <= 1;
          const isWhole = durationInfo.value >= 4;
          
          if (note.isRest) {
            return (
              <g key={index} style={{ transition: 'all 0.2s', opacity: isActive ? 1 : 0.6 }}>
                <rect x={x - 8} y={startY + 2.5 * stringSpacing - 10} width="16" height="20" fill="var(--text-muted)" rx="2" opacity="0.3" />
                {isActive && <circle cx={x} cy={startY + 2.5 * stringSpacing} r="18" fill="var(--accent)" opacity="0.2" />}
              </g>
            );
          }

          const stemBottomY = startY + 6 * stringSpacing + (compact ? 10 : 15);
          const stemDirection = note.string <= 2 ? 'up' : 'down';
          const stemX = x + (stemDirection === 'up' ? 6 : -6);
          const stemStartY = y + 12;
          const stemEndY = stemBottomY;

          return (
            <g key={index} style={{ transition: 'all 0.1s', opacity: isMuted ? 0.6 : 1 }}>
              
              {/* ===== ШТИЛЬ ===== */}
              {!isWhole && (
                <line 
                  x1={stemX} y1={stemStartY} 
                  x2={stemX} y2={stemEndY} 
                  stroke={isActive ? "var(--accent)" : durationColor} 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
              )}

              {/* ===== ФЛАЖКИ ===== */}
              {flagCount === 1 && (
                <path
                  d={`M ${stemX + 2} ${stemEndY} Q ${stemX + 14} ${stemEndY - 6} ${stemX + 12} ${stemEndY + 8}`}
                  fill="none"
                  stroke={isActive ? "var(--accent)" : durationColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
              {flagCount === 2 && (
                <>
                  <path
                    d={`M ${stemX + 2} ${stemEndY} Q ${stemX + 14} ${stemEndY - 6} ${stemX + 12} ${stemEndY + 8}`}
                    fill="none"
                    stroke={isActive ? "var(--accent)" : durationColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${stemX + 3} ${stemEndY + 12} Q ${stemX + 15} ${stemEndY + 6} ${stemX + 13} ${stemEndY + 20}`}
                    fill="none"
                    stroke={isActive ? "var(--accent)" : durationColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}
              {flagCount === 3 && (
                <>
                  <path
                    d={`M ${stemX + 2} ${stemEndY} Q ${stemX + 14} ${stemEndY - 6} ${stemX + 12} ${stemEndY + 8}`}
                    fill="none"
                    stroke={isActive ? "var(--accent)" : durationColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${stemX + 3} ${stemEndY + 12} Q ${stemX + 15} ${stemEndY + 6} ${stemX + 13} ${stemEndY + 20}`}
                    fill="none"
                    stroke={isActive ? "var(--accent)" : durationColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${stemX + 4} ${stemEndY + 24} Q ${stemX + 16} ${stemEndY + 18} ${stemX + 14} ${stemEndY + 32}`}
                    fill="none"
                    stroke={isActive ? "var(--accent)" : durationColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Фон цифры */}
              <rect x={x - noteSize/2} y={y - noteSize/2} width={noteSize} height={noteSize} fill="#111216" rx="4" />

              {/* Подсветка активной ноты */}
              {isActive && (
                <circle cx={x} cy={y} r={noteSize/2 + 6} fill="var(--accent)" opacity="0.8" style={{ filter: 'drop-shadow(0 0 16px var(--accent))' }} />
              )}

              {/* Цифра лада */}
              {showFretNumbers ? (
                <text 
                  x={x} y={y + (compact ? 5 : 6)} 
                  fill={isActive ? '#000' : (isLegato ? 'var(--accent)' : (note.technique !== 'none' && note.technique !== 'mute' ? durationColor : 'var(--text-primary)'))} 
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

              {/* Головка ноты (маленький кружок под цифрой) */}
              {!isWhole && (
                <circle
                  cx={x}
                  cy={y + 8}
                  r={isFilled ? 4 : 5}
                  fill={isFilled ? (isActive ? 'var(--accent)' : durationColor) : 'transparent'}
                  stroke={isActive ? 'var(--accent)' : durationColor}
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              )}

              {/* Точка (увеличение длительности) */}
              {note.duration === 'dotted-half' || note.duration === 'dotted-quarter' && (
                <circle
                  cx={x + noteSize/2 + 4}
                  cy={y + 8}
                  r={2.5}
                  fill={isActive ? 'var(--accent)' : durationColor}
                  opacity={0.6}
                />
              )}

              {/* Техники */}
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
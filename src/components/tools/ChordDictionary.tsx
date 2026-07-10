import React, { useState } from 'react';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';
import { useMusic } from '../../context/MusicContext';

const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const QUALITIES = [
  { name: 'Major', suffix: '' },
  { name: 'Minor', suffix: 'm' },
  { name: 'Dominant 7', suffix: '7' },
  { name: 'Minor 7', suffix: 'm7' },
  { name: 'Major 7', suffix: 'maj7' },
  { name: 'Diminished', suffix: 'dim' }
];

const ChordDictionary: React.FC = () => {
  const { keyNote } = useMusic();
  // По умолчанию открываем тонику из текущего контекста приложения
  const [selectedRoot, setSelectedRoot] = useState<string>(keyNote);

  // 🎵 ЗВУКОВОЙ ДВИЖОК
  const playChord = (voicing: Voicing) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const baseMidiNotes = [40, 45, 50, 55, 59, 64]; 
    
    voicing.frets.forEach((fret, stringIdx) => {
      if (fret === 'x') return;
      const midiNote = baseMidiNotes[stringIdx] + (fret as number);
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = stringIdx < 3 ? 'triangle' : 'sine'; 
      osc.frequency.value = frequency;
      
      const startTime = audioCtx.currentTime + (stringIdx * 0.04); 
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05); 
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0); 
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 2.0);
    });
  };

  // 🎨 Рендер SVG-сетки
  const renderChordSVG = (voicing: Voicing) => {
    const width = 100;
    const height = 120;
    const stringSpacing = 16;
    const fretSpacing = 22;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {voicing.baseFret > 1 && (
          <text x="-18" y="25" fill="var(--text-muted)" fontSize="11" fontWeight="bold">{voicing.baseFret}fr</text>
        )}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`str-${i}`} x1={10 + i * stringSpacing} y1="15" x2={10 + i * stringSpacing} y2="105" stroke="var(--border-color)" strokeWidth={1 + (5 - i) * 0.3} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`fret-${i}`} x1="10" y1={15 + i * fretSpacing} x2="90" y2={15 + i * fretSpacing} stroke="var(--border-color)" strokeWidth={i === 0 && voicing.baseFret === 1 ? 4 : 1} />
        ))}
        {voicing.frets.map((fret, stringIdx) => {
          const x = 10 + stringIdx * stringSpacing;
          if (fret === 'x') return <text key={`mute-${stringIdx}`} x={x - 4} y="8" fill="var(--text-muted)" fontSize="11" fontWeight="bold">x</text>;
          if (fret === 0) return <circle key={`open-${stringIdx}`} cx={x} cy="6" r="3" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />;
          
          const relativeFret = (fret as number) - voicing.baseFret + 1;
          const y = 15 + (relativeFret - 0.5) * fretSpacing;
          return <circle key={`dot-${stringIdx}`} cx={x} cy={y} r="5" fill="var(--accent)" stroke="#000" strokeWidth="1.5" />;
        })}
      </svg>
    );
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Шапка справочника с фильтрами */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
        <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          // Master Chord Library
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
          Explore Voicings & Inversions
        </div>

        {/* Выбор корневой ноты */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ROOTS.map(root => (
            <button
              key={root}
              onClick={() => setSelectedRoot(root)}
              style={{
                background: selectedRoot === root ? 'var(--accent)' : 'var(--bg-hover)',
                color: selectedRoot === root ? '#000' : 'var(--text-primary)',
                border: `1px solid ${selectedRoot === root ? 'var(--accent)' : 'var(--border-color)'}`,
                padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
                fontWeight: 800, fontSize: '14px', transition: 'all 0.2s'
              }}
            >
              {root}
            </button>
          ))}
        </div>
      </div>

      {/* Матрица аккордов (скроллируемая область) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {QUALITIES.map(q => {
          const chordName = `${selectedRoot}${q.suffix}`;
          const voicings = CHORD_DB[chordName] || generateFallbackVoicing(chordName);

          if (voicings.length === 0) return null;

          return (
            <div key={q.name} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{chordName}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{q.name}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {voicings.map((v, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>{v.name}</span>
                    <div 
                      onClick={() => playChord(v)}
                      title={`Play ${chordName} (${v.name})`}
                      style={{ 
                        background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', 
                        border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {renderChordSVG(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChordDictionary;
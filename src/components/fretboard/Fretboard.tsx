import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FRET_COUNT = 24;
const MARKERS = [3, 5, 7, 9, 15, 17, 19, 21]; 
const DOUBLE_MARKERS = [12, 24]; 

const MODES = [
  { value: 'major', label: 'Major (Ionian)' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'aeolian', label: 'Minor (Aeolian)' },
  { value: 'locrian', label: 'Locrian' },
  { value: 'harmonic_minor', label: 'Harmonic Minor' },
  { value: 'melodic_minor', label: 'Melodic Minor' },
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'blues', label: 'Blues' }
];

const TUNINGS: Record<string, string[]> = {
  'Standard E': ['E', 'B', 'G', 'D', 'A', 'E'],
  'Drop D': ['E', 'B', 'G', 'D', 'A', 'D'],
  'Drop C': ['D', 'A', 'F', 'C', 'G', 'C'],
  'D Standard': ['D', 'A', 'F', 'C', 'G', 'D'],
  'Drop A (Baritone)': ['E', 'B', 'G', 'D', 'A', 'A']
};

const MATERIALS: Record<string, { bg: string, fret: string, dot: string }> = {
  glass: { bg: 'linear-gradient(to right, #0d131a, #070a0f)', fret: '#172430', dot: '#30b0f0' },
  ebony: { bg: 'linear-gradient(to right, #1a1a1a, #111)', fret: '#333', dot: '#e0e0e0' }, // Светлые точки
  rosewood: { bg: 'linear-gradient(to right, #362217, #24140c)', fret: '#4a3022', dot: '#b5a592' },
  maple: { bg: 'linear-gradient(to right, #dfc08b, #c4a162)', fret: '#b39050', dot: '#2a2015' } 
};

const Fretboard: React.FC = () => {
  const { keyNote, mode, setKeyNote, setMode, getScaleNotes } = useMusic();
  const scaleNotes = getScaleNotes();

  const [tuningName, setTuningName] = useState('Standard E');
  const [material, setMaterial] = useState('glass');

  const currentTuning = TUNINGS[tuningName];
  const currentMat = MATERIALS[material];

  const getNote = (openNote: string, fret: number) => {
    const startIndex = ALL_NOTES.indexOf(openNote.toUpperCase());
    return ALL_NOTES[(startIndex + fret) % 12];
  };

  return (
    <div style={{ 
        background: 'var(--bg-panel)', borderRadius: 'var(--radius)', 
        padding: '20px', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', gap: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        width: '100%' // Растягиваем на всю ширину блока
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>KEY</div>
            <select value={keyNote} onChange={(e) => setKeyNote(e.target.value)} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none', minWidth: '60px' }}>
              {ALL_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>SCALE / MODE</div>
            <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none' }}>
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>TUNING</div>
            <select value={tuningName} onChange={(e) => setTuningName(e.target.value)} style={{ background: '#000', border: '1px solid var(--border-color)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none' }}>
              {Object.keys(TUNINGS).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>FRETBOARD WOOD</div>
            <select value={material} onChange={(e) => setMaterial(e.target.value)} style={{ background: '#000', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none' }}>
              <option value="glass">Glass (Default)</option>
              <option value="ebony">Ebony</option>
              <option value="rosewood">Rosewood</option>
              <option value="maple">Maple</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 0', width: '100%' }}>
        <div style={{ width: '100%', position: 'relative', display: 'flex', background: currentMat.bg, borderRadius: '4px', border: '2px solid #111', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)' }}>
          
          {/* Слой с ладами и точками */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '36px', right: 0, display: 'flex' }}>
            {Array.from({ length: FRET_COUNT }).map((_, fretIdx) => {
              const fretNum = fretIdx + 1;
              const hasSingle = MARKERS.includes(fretNum);
              const hasDouble = DOUBLE_MARKERS.includes(fretNum);

              return (
                <div key={`bg-${fretNum}`} style={{ flex: 1, borderRight: `2px solid ${currentMat.fret}`, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  
                  {/* Номера сверху */}
                  <div style={{ position: 'absolute', top: '-24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{fretNum}</div>
                  
                  {hasSingle && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: currentMat.dot, opacity: material === 'ebony' ? 0.9 : 0.6 }} />}
                  {hasDouble && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: currentMat.dot, opacity: material === 'ebony' ? 0.9 : 0.6 }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: currentMat.dot, opacity: material === 'ebony' ? 0.9 : 0.6 }} />
                    </div>
                  )}
                  
                  {/* Номера снизу */}
                  <div style={{ position: 'absolute', bottom: '-24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{fretNum}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', zIndex: 10, padding: '10px 0' }}>
            {currentTuning.map((openNote, stringIdx) => (
              <div key={`str-${stringIdx}`} style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                <div style={{ width: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ 
                    width: '20px', height: '20px', borderRadius: '4px', background: '#000', 
                    color: scaleNotes.includes(openNote) ? (openNote === keyNote ? 'var(--accent)' : 'var(--text-primary)') : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold'
                  }}>
                    {openNote}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flex: 1, borderLeft: '4px solid #aaa' }}>
                  {Array.from({ length: FRET_COUNT }).map((_, fretIdx) => {
                    const fretNum = fretIdx + 1;
                    const note = getNote(openNote, fretNum);
                    const isInScale = scaleNotes.includes(note);
                    const isRoot = note === keyNote;
                    const stringThickness = 1 + (stringIdx * 0.4);

                    return (
                      <div key={fretNum} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: `${stringThickness}px`, background: '#888', transform: 'translateY(-50%)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 1 }} />
                        
                        {isInScale && (
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: isRoot ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                            color: isRoot ? '#000' : 'var(--text-primary)',
                            border: 'none', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: isRoot ? '800' : '600', zIndex: 2,
                            boxShadow: isRoot ? '0 2px 8px rgba(0,0,0,0.6)' : '0 1px 3px rgba(0,0,0,0.3)',
                            textShadow: isRoot ? 'none' : '0 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fretboard;
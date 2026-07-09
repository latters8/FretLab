import React from 'react';
import { useMusic } from '../../context/MusicContext';

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TUNING = ['E', 'B', 'G', 'D', 'A', 'E']; 
const FRET_COUNT = 24;
const MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

const MODES = [
  { value: 'major', label: 'Major (Ionian)' },
  { value: 'aeolian', label: 'Minor (Aeolian)' },
  { value: 'harmonic_minor', label: 'Harmonic Minor' },
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'blues', label: 'Blues' }
];

const Fretboard: React.FC = () => {
  const { keyNote, mode, setKeyNote, setMode, getScaleNotes } = useMusic();
  const scaleNotes = getScaleNotes();

  const getNote = (openNote: string, fret: number) => {
    const startIndex = ALL_NOTES.indexOf(openNote);
    return ALL_NOTES[(startIndex + fret) % 12];
  };

  return (
    <div style={{ 
        background: 'var(--bg-panel)', borderRadius: 'var(--radius)', 
        padding: '16px', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', gap: '16px'
    }}>
      {/* Тулбар с выпадающими списками (как было в HTML) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={keyNote} 
            onChange={(e) => setKeyNote(e.target.value)}
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none' }}
          >
            {ALL_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
          </select>

          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as any)}
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none' }}
          >
            {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Standard Tuning • 24 Frets
        </div>
      </div>

      <div style={{ background: '#000', padding: '20px 10px 5px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #333' }}>
        <div style={{ minWidth: '800px', position: 'relative' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {TUNING.map((openNote, stringIdx) => (
              <div key={stringIdx} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>{openNote}</div>
                <div style={{ display: 'flex', flex: 1, borderLeft: '4px solid #ccc' }}>
                  {Array.from({ length: FRET_COUNT }).map((_, fretIdx) => {
                    const fretNumber = fretIdx + 1;
                    const note = getNote(openNote, fretNumber);
                    const isInScale = scaleNotes.includes(note);
                    const isRoot = note === keyNote;

                    return (
                      <div key={fretNumber} style={{ flex: 1, position: 'relative', height: '20px', borderRight: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: `${1 + (stringIdx * 0.3)}px`, background: '#777', transform: 'translateY(-50%)', zIndex: 1 }} />
                        {isInScale && (
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: isRoot ? 'var(--accent)' : 'var(--bg-hover)',
                            border: `2px solid ${isRoot ? 'var(--accent)' : 'var(--accent-blue)'}`,
                            color: isRoot ? '#000' : 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 'bold', zIndex: 2
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

          {/* Маркеры И НОМЕРА ЛАДОВ */}
          <div style={{ display: 'flex', paddingLeft: '34px', marginTop: '8px' }}>
            {Array.from({ length: FRET_COUNT }).map((_, fretIdx) => {
              const fretNumber = fretIdx + 1;
              const isMarker = MARKERS.includes(fretNumber);
              const isDouble = fretNumber === 12 || fretNumber === 24;
              
              return (
                <div key={fretNumber} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', letterSpacing: isDouble ? '2px' : '0', height: '14px' }}>
                    {isMarker ? (isDouble ? '••' : '•') : ''}
                  </div>
                  {/* Номера ладов */}
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>
                    {fretNumber}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Fretboard;
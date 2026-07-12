import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';

const TUNINGS = {
  'Standard E': ['E', 'A', 'D', 'G', 'B', 'E'],
  'Drop D': ['D', 'A', 'D', 'G', 'B', 'E'],
  'Drop C': ['C', 'G', 'C', 'F', 'A', 'D'],
  'D Standard': ['D', 'G', 'C', 'F', 'A', 'D'],
};

const MATERIALS = {
  ebony: { bg: '#1a1a1a', dot: '#e0e0e0' },
  rosewood: { bg: '#3e2723', dot: '#d7ccc8' },
  maple: { bg: '#f1ba54', dot: '#3e2723' },
  glass: { bg: 'rgba(255,255,255,0.05)', dot: '#d7ccc8' }
};

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const Fretboard: React.FC = () => {
  const { keyNote, mode, getScaleNotes, setKeyNote, setMode } = useMusic();
  const scaleNotes = getScaleNotes();
  
  const [tuningName, setTuningName] = useState<keyof typeof TUNINGS>('Standard E');
  const [material, setMaterial] = useState<keyof typeof MATERIALS>('glass');

  const strings = TUNINGS[tuningName].slice().reverse(); 
  const frets = Array.from({ length: 25 }, (_, i) => i);
  const dots = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleDots = [12, 24];

  const getNoteAtFret = (openNote: string, fret: number) => {
    const startIndex = ALL_NOTES.indexOf(openNote);
    return ALL_NOTES[(startIndex + fret) % 12];
  };

  const currentMat = MATERIALS[material];

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', minWidth: '800px' }}>
      
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Fretboard Engine
          </div>
          <select value={keyNote} onChange={(e) => setKeyNote(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
            {ALL_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
            {['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'harmonic_minor', 'melodic_minor', 'pentatonic', 'blues'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <select value={tuningName} onChange={(e) => setTuningName(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {Object.keys(TUNINGS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={material} onChange={(e) => setMaterial(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', textTransform: 'capitalize', outline: 'none', cursor: 'pointer' }}>
            {Object.keys(MATERIALS).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Fret Numbers Top */}
      <div style={{ display: 'flex', paddingLeft: '40px', marginBottom: '8px' }}>
        {frets.map(f => (
          <div key={`top-${f}`} style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 800 }}>
            {f}
          </div>
        ))}
      </div>

      {/* The Fretboard */}
      <div style={{ position: 'relative', background: currentMat.bg, border: '2px solid #000', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Dots Layer */}
        <div style={{ position: 'absolute', top: 0, left: '40px', right: 0, bottom: 0, display: 'flex', pointerEvents: 'none', height: '100%' }}>
          {frets.map(f => (
            <div key={`dotcol-${f}`} style={{ flex: 1, position: 'relative', borderRight: f === 0 ? '4px solid #bba182' : '1px solid rgba(0,0,0,0.5)' }}>
              
              {/* Одинарные маркеры (строго по центру грифа) */}
              {dots.includes(f) && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot }} />
              )}
              
              {/* 🔥 АНАТОМИЧЕСКИ ТОЧНЫЕ ДВОЙНЫЕ ТОЧКИ НА 12 И 24 ЛАДАХ */}
              {doubleDots.includes(f) && (
                <>
                  {/* Верхняя точка: Между 2-й (B) и 3-й (G) струнами. Высота двух струн = 72px */}
                  <div style={{ position: 'absolute', top: '72px', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot }} />
                  {/* Нижная точка: Между 4-й (D) и 5-й (A) струнами. Высота четырех струн = 144px */}
                  <div style={{ position: 'absolute', top: '144px', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot }} />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Strings Layer (Каждая струна занимает ровно 36px) */}
        {strings.map((openNote, stringIdx) => (
          <div key={stringIdx} style={{ display: 'flex', alignItems: 'center', position: 'relative', height: '36px' }}>
            {/* String Line */}
            <div style={{ position: 'absolute', left: 0, right: 0, height: `${2 + (strings.length - stringIdx) * 0.5}px`, background: 'linear-gradient(to bottom, #777, #999, #555)', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
            
            {/* Open Note Label */}
            <div style={{ width: '40px', textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)', zIndex: 2, background: 'var(--bg-panel)' }}>
              {openNote}
            </div>

            {/* Frets for this string */}
            {frets.map(fret => {
              const note = getNoteAtFret(openNote, fret);
              const isInScale = scaleNotes.includes(note);
              const isRoot = note === keyNote;

              return (
                <div key={`${stringIdx}-${fret}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
                  {isInScale && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: isRoot ? '800' : '600',
                      background: isRoot ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                      color: isRoot ? '#000' : '#fff',
                      textShadow: isRoot ? 'none' : '0 1px 2px rgba(0,0,0,0.8)',
                      boxShadow: isRoot ? '0 0 12px var(--accent)' : 'none',
                      zIndex: 3
                    }}>
                      {note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Fret Numbers Bottom */}
      <div style={{ display: 'flex', paddingLeft: '40px', marginTop: '8px' }}>
        {frets.map(f => (
          <div key={`bottom-${f}`} style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 800 }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fretboard;
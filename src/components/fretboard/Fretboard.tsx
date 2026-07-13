import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';

const TUNINGS = {
  'Standard E': ['E', 'A', 'D', 'G', 'B', 'E'],
  'Drop D': ['D', 'A', 'D', 'G', 'B', 'E'],
  'Drop C': ['C', 'G', 'C', 'F', 'A', 'D'],
  'D Standard': ['D', 'G', 'C', 'F', 'A', 'D'],
};

const MATERIALS = {
  ebony: { bg: '#1a1a1a', dot: '#e0e0e0', fretDark: '#111215', fretLight: '#c0c0c0', fretWidth: '1px' },
  rosewood: { bg: '#3e2723', dot: '#d7ccc8', fretDark: '#211512', fretLight: '#d7ccc8', fretWidth: '1px' },
  maple: { bg: '#f1ba54', dot: '#3e2723', fretDark: '#5c4314', fretLight: '#fafafa', fretWidth: '1px' },
  glass: { bg: 'rgba(255,255,255,0.04)', dot: 'var(--accent)', fretDark: 'rgba(255,255,255,0.15)', fretLight: 'var(--accent)', fretWidth: '1px' }
};

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const STRING_GAUGES = [1.2, 1.8, 2.4, 3.2, 4.2, 5.4];

const INTERVAL_MAP = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

type DisplayMode = 'notes' | 'intervals' | 'caged' | 'clean';

const Fretboard: React.FC = () => {
  const { keyNote, mode, getScaleNotes, setKeyNote, setMode } = useMusic();
  const scaleNotes = getScaleNotes();
  const [tuningName, setTuningName] = useState<keyof typeof TUNINGS>('Standard E');
  const [material, setMaterial] = useState<keyof typeof MATERIALS>('glass');
  const [fretColor, setFretColor] = useState<'dark' | 'light'>('dark');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('notes');

  const strings = TUNINGS[tuningName].slice().reverse(); 
  const frets = Array.from({ length: 25 }, (_, i) => i);
  const dots = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleDots = [12, 24];

  const getNoteAtFret = (openNote: string, fret: number) => ALL_NOTES[(ALL_NOTES.indexOf(openNote) + fret) % 12];
  const currentMat = MATERIALS[material];
  const currentFretColor = fretColor === 'dark' ? currentMat.fretDark : currentMat.fretLight;
  
  const isCyberpunk = material === 'glass' && fretColor === 'light';

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', minWidth: '800px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        
        {/* ЛЕВАЯ ПАНЕЛЬ СЕЛЕКТОРОВ */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginRight: '8px' }}>Fretboard Engine</div>
           
           <select value={keyNote} onChange={(e) => setKeyNote(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
            {ALL_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          
          <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
            <optgroup label="Standard Scales">
              {['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'harmonic_minor', 'melodic_minor', 'pentatonic', 'blues'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </optgroup>
            <optgroup label="Arpeggios (Play Over)">
              <option value="maj7_arp">Maj7 Arpeggio</option>
              <option value="min7_arp">Min7 Arpeggio</option>
              <option value="dom7_arp">Dom7 Arpeggio</option>
              <option value="dom9_arp">Dom9 Arpeggio</option>
              <option value="altered">Altered Scale (alt)</option>
            </optgroup>
          </select>

          <select 
            value={displayMode} 
            onChange={(e) => setDisplayMode(e.target.value as DisplayMode)} 
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="notes">🎵 Notes</option>
            <option value="intervals">🔢 Intervals</option>
            <option value="caged">🦴 CAGED Skeleton</option>
            <option value="clean">⏺ Clean Dots</option>
          </select>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ СЕЛЕКТОРОВ */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={tuningName} onChange={(e) => setTuningName(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {Object.keys(TUNINGS).map(t => <option key={t} value={t}>{t} Tuning</option>)}
          </select>
          <select value={material} onChange={(e) => setMaterial(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', textTransform: 'capitalize', outline: 'none', cursor: 'pointer' }}>
            {Object.keys(MATERIALS).map(m => <option key={m} value={m}>{m} Neck</option>)}
          </select>
          <select value={fretColor} onChange={(e) => setFretColor(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            <option value="dark">Dark Frets</option>
            <option value="light">Light Frets</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', paddingLeft: '40px', marginBottom: '8px' }}>
        {frets.map(f => <div key={`top-${f}`} style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 800 }}>{f}</div>)}
      </div>

      <div style={{ position: 'relative', background: '#000', border: '2px solid #000', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ position: 'absolute', top: '18px', left: '40px', right: 0, bottom: '18px', background: currentMat.bg, zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', top: '18px', left: '40px', right: 0, bottom: '18px', display: 'flex', pointerEvents: 'none', zIndex: 1 }}>
          {frets.map(f => (
            <div key={`dotcol-${f}`} style={{ flex: 1, position: 'relative', borderRight: f === 0 ? '4px solid #bba182' : `${isCyberpunk ? 'transparent' : currentMat.fretWidth} solid ${isCyberpunk ? 'transparent' : currentFretColor}` }}>
              {isCyberpunk && f !== 0 && (
                <div style={{ position: 'absolute', right: '-1px', top: 0, bottom: 0, width: currentMat.fretWidth, background: 'var(--accent)', boxShadow: '0 0 2px var(--accent), 0 0 4px var(--accent)', opacity: 0.25, zIndex: 2 }} />
              )}
              {dots.includes(f) && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot, boxShadow: isCyberpunk ? '0 0 4px var(--accent)' : 'none', zIndex: 2 }} />}
              {doubleDots.includes(f) && (
                <>
                  <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot, boxShadow: isCyberpunk ? '0 0 4px var(--accent)' : 'none', zIndex: 2 }} />
                  <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot, boxShadow: isCyberpunk ? '0 0 4px var(--accent)' : 'none', zIndex: 2 }} />
                </>
              )}
            </div>
          ))}
        </div>

        {strings.map((openNote, stringIdx) => {
          const thickness = STRING_GAUGES[stringIdx];
          
          return (
            <div key={stringIdx} style={{ display: 'flex', alignItems: 'center', position: 'relative', height: '36px' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: `${thickness}px`, background: 'linear-gradient(to bottom, #777, #999, #555)', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
              <div style={{ width: '40px', textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)', zIndex: 3, background: 'var(--bg-panel)' }}>{openNote}</div>
              
              {frets.map(fret => {
                const note = getNoteAtFret(openNote, fret);
                const isInScale = scaleNotes.includes(note);
                const isRoot = note === keyNote;
                const noteAlpha = material === 'maple' ? '1' : '0.75';

                let labelText = '';
                let displayStyle: React.CSSProperties = {};

                if (isInScale) {
                  if (displayMode === 'notes') {
                    labelText = note;
                    displayStyle = {
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: isRoot ? 'var(--accent)' : `rgba(255,255,255, ${noteAlpha})`,
                      color: isRoot ? '#000' : '#111216', fontWeight: '900'
                    };
                  } 
                  else if (displayMode === 'intervals') {
                    const diff = (ALL_NOTES.indexOf(note) - ALL_NOTES.indexOf(keyNote) + 12) % 12;
                    labelText = INTERVAL_MAP[diff];
                    displayStyle = {
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: isRoot ? 'var(--accent)' : `rgba(255,255,255, ${noteAlpha})`,
                      color: isRoot ? '#000' : '#111216', fontWeight: '900'
                    };
                  } 
                  else if (displayMode === 'caged') {
                    labelText = note;
                    if (isRoot) {
                      displayStyle = {
                        width: '24px', height: '24px', borderRadius: '4px',
                        background: 'var(--accent)', color: '#000', fontWeight: '900'
                      };
                    } else {
                      const isMaple = material === 'maple';
                      // 🔥 ИСПРАВЛЕНО: Для не-тоники добавлена мягкая полупрозрачная серая заливка (rgba)
                      displayStyle = {
                        width: '24px', height: '24px', borderRadius: '4px',
                        background: isMaple ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)',
                        border: `1px solid ${isMaple ? '#5c4314' : 'rgba(255,255,255,0.4)'}`,
                        color: isMaple ? '#5c4314' : 'var(--text-primary)',
                        fontWeight: '800'
                      };
                    }
                  } 
                  else if (displayMode === 'clean') {
                    labelText = '';
                    displayStyle = {
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: isRoot ? 'var(--accent)' : `rgba(255,255,255, ${noteAlpha})`
                    };
                  }
                }

                return (
                  <div key={`${stringIdx}-${fret}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3 }}>
                    {isInScale && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', border: 'none', zIndex: 4,
                        boxShadow: (isRoot && displayMode !== 'caged') ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                        transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        ...displayStyle
                      }}>
                        {labelText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', paddingLeft: '40px', marginTop: '8px' }}>
        {frets.map(f => <div key={`bottom-${f}`} style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 800 }}>{f}</div>)}
      </div>
    </div>
  );
};

export default Fretboard;
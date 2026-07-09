import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FRET_COUNT = 24;
const MARKERS = [3, 5, 7, 9, 15, 17, 19, 21]; // Одинарные точки
const DOUBLE_MARKERS = [12, 24]; // Двойные точки

const MODES = [
  { value: 'major', label: 'Major (Ionian)' },
  { value: 'aeolian', label: 'Minor (Aeolian)' },
  { value: 'harmonic_minor', label: 'Harmonic Minor' },
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'blues', label: 'Blues' }
];

// Пресеты строя (от 1-й струны к 6-й)
const TUNINGS: Record<string, string[]> = {
  'Standard E': ['E', 'B', 'G', 'D', 'A', 'E'],
  'Drop D': ['E', 'B', 'G', 'D', 'A', 'D'],
  'Drop C': ['D', 'A', 'F', 'C', 'G', 'C'],
  'D Standard': ['D', 'A', 'F', 'C', 'G', 'D'],
  'Drop A (Baritone)': ['E', 'B', 'G', 'D', 'A', 'A']
};

// Материалы грифа
const MATERIALS: Record<string, { bg: string, fret: string, dot: string }> = {
  ebony: { bg: 'linear-gradient(to right, #1a1a1a, #111)', fret: '#333', dot: '#4a4a4a' },
  rosewood: { bg: 'linear-gradient(to right, #362217, #24140c)', fret: '#4a3022', dot: '#b5a592' },
  maple: { bg: 'linear-gradient(to right, #dfc08b, #c4a162)', fret: '#b39050', dot: '#2a2015' },
  glass: { bg: 'linear-gradient(to right, #0d131a, #070a0f)', fret: '#172430', dot: '#30b0f0' } // Стиль Neural DSP
};

const Fretboard: React.FC = () => {
  const { keyNote, mode, setKeyNote, setMode, getScaleNotes } = useMusic();
  const scaleNotes = getScaleNotes();

  const [tuningName, setTuningName] = useState('Standard E');
  const [material, setMaterial] = useState('ebony');

  const currentTuning = TUNINGS[tuningName];
  const currentMat = MATERIALS[material];

  const getNote = (openNote: string, fret: number) => {
    const startIndex = ALL_NOTES.indexOf(openNote);
    return ALL_NOTES[(startIndex + fret) % 12];
  };

  return (
    <div style={{ 
        background: 'var(--bg-panel)', borderRadius: 'var(--radius)', 
        padding: '20px', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', gap: '20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    }}>
      {/* 🎛 ПАНЕЛЬ УПРАВЛЕНИЯ ГРИФОМ (Интерфейс процессора) */}
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
              <option value="ebony">Ebony (Default)</option>
              <option value="rosewood">Rosewood</option>
              <option value="maple">Maple</option>
              <option value="glass">Glass (Digital)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🎸 САМ ГРИФ */}
      <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{ minWidth: '960px', position: 'relative', display: 'flex', background: currentMat.bg, borderRadius: '4px', border: '2px solid #111', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)' }}>
          
          {/* Слой 1: Порожки и точки (внутри грифа) */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '36px', right: 0, display: 'flex' }}>
            {Array.from({ length: FRET_COUNT }).map((_, fretIdx) => {
              const fretNum = fretIdx + 1;
              const hasSingle = MARKERS.includes(fretNum);
              const hasDouble = DOUBLE_MARKERS.includes(fretNum);

              return (
                <div key={`bg-${fretNum}`} style={{ flex: 1, borderRight: `2px solid ${currentMat.fret}`, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  {/* Отрисовка точек */}
                  {hasSingle && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot, opacity: 0.8 }} />}
                  {hasDouble && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot, opacity: 0.8 }} />
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot, opacity: 0.8 }} />
                    </div>
                  )}
                  {/* Номера ладов (внизу под грифом) */}
                  <div style={{ position: 'absolute', bottom: '-22px', fontSize: '11px', color: 'var(--text-muted)' }}>{fretNum}</div>
                </div>
              );
            })}
          </div>

          {/* Слой 2: Струны и Ноты */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', zIndex: 10, padding: '10px 0' }}>
            {currentTuning.map((openNote, stringIdx) => (
              <div key={`str-${stringIdx}`} style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                
                {/* Нулевой лад (Открытая струна) */}
                <div style={{ width: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ 
                    width: '20px', height: '20px', borderRadius: '4px', background: '#000', 
                    color: scaleNotes.includes(openNote) ? (openNote === keyNote ? 'var(--accent)' : 'var(--text-primary)') : 'var(--text-muted)',
                    border: `1px solid ${openNote === keyNote ? 'var(--accent)' : '#333'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold'
                  }}>
                    {openNote}
                  </div>
                </div>
                
                {/* Игровые лады */}
                <div style={{ display: 'flex', flex: 1, borderLeft: '4px solid #aaa' /* Нулевой порожек */ }}>
                  {Array.from({ length: FRET_COUNT }).map((_, fretIdx) => {
                    const fretNum = fretIdx + 1;
                    const note = getNote(openNote, fretNum);
                    const isInScale = scaleNotes.includes(note);
                    const isRoot = note === keyNote;
                    // Имитация толщины струны
                    const stringThickness = 1 + (stringIdx * 0.4);

                    return (
                      <div key={fretNum} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Визуальная струна */}
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: `${stringThickness}px`, background: '#888', transform: 'translateY(-50%)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 1 }} />
                        
                        {/* Нота */}
                        {isInScale && (
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: isRoot ? 'var(--accent)' : (material === 'maple' ? '#222' : 'var(--bg-panel)'),
                            border: `2px solid ${isRoot ? 'var(--accent)' : 'var(--accent-blue)'}`,
                            color: isRoot ? '#000' : (material === 'maple' ? '#fff' : 'var(--text-primary)'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 'bold', zIndex: 2,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.8)'
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
// src/components/tools/SoloGenerator.tsx

import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSynchronizedSolo, type SyncSoloData } from '../../services/AIEngine';
import TablatureDisplay from '../fretboard/TablatureDisplay';

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getDiatonicChords = (keyNote: string, mode: string) => {
  const isMinor = mode.includes('minor') || mode === 'aeolian' || mode === 'pentatonic';
  if (isMinor) {
    return [
      { name: `${keyNote}m`, notes: [keyNote, 'Eb', 'G'] }, 
      { name: `${ALL_NOTES[(ALL_NOTES.indexOf(keyNote) + 5) % 12]}m`, notes: [] }, 
      { name: `${ALL_NOTES[(ALL_NOTES.indexOf(keyNote) + 7) % 12]}7`, notes: [] }, 
      { name: `${ALL_NOTES[(ALL_NOTES.indexOf(keyNote) + 3) % 12]}`, notes: [] }   
    ];
  } else {
    return [
      { name: `${keyNote}`, notes: [keyNote, 'E', 'G'] }, 
      { name: `${ALL_NOTES[(ALL_NOTES.indexOf(keyNote) + 5) % 12]}`, notes: [] }, 
      { name: `${ALL_NOTES[(ALL_NOTES.indexOf(keyNote) + 7) % 12]}7`, notes: [] }, 
      { name: `${ALL_NOTES[(ALL_NOTES.indexOf(keyNote) + 9) % 12]}m`, notes: [] } 
    ];
  }
};

const SoloGenerator: React.FC = () => {
  const { keyNote, mode, bpm, getScaleNotes, timeSignature } = useMusic();
  const [soloData, setSoloData] = useState<SyncSoloData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Убраны сеттеры, чтобы не ругался линтер (до реализации аудио-плеера)
  const [activeBeat] = useState(-1);
  const [isPlaying] = useState(false);
  
  const [progression, setProgression] = useState<{name: string, notes: string[]}[]>([]);
  const [editingChordIndex, setEditingChordIndex] = useState<number | null>(null);

  useEffect(() => {
    const diatonicChords = getDiatonicChords(keyNote, mode);
    setProgression([
      diatonicChords[0], 
      diatonicChords[1], 
      diatonicChords[2], 
      diatonicChords[0]  
    ]);
  }, [keyNote, mode]);

  const handleGenerate = () => {
    if (!progression.length) return;
    setIsGenerating(true);
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'G', 'A'];

    const generated = generateSynchronizedSolo(
      safeScale, keyNote, mode, timeSignature, progression, false
    );
    
    setTimeout(() => {
      setSoloData(generated);
      setIsGenerating(false);
    }, 500);
  };

  const handleChordChange = (index: number, newChord: {name: string, notes: string[]}) => {
    const newProgression = [...progression];
    newProgression[index] = newChord;
    setProgression(newProgression);
    setEditingChordIndex(null);
  };

  const diatonicOptions = getDiatonicChords(keyNote, mode);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '20px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-primary)' }}>AI Studio Generator</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--accent)' }}>{keyNote} {mode.replace(/_/g, ' ')}</strong> | {bpm} BPM | {timeSignature.beats}/{timeSignature.noteValue}
          </div>
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={isGenerating || isPlaying}
          style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(0,255,157,0.2)' }}
        >
          {isGenerating ? 'RENDERING...' : 'GENERATE SOLO'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {progression.map((chord, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <div 
                onClick={() => setEditingChordIndex(editingChordIndex === idx ? null : idx)}
                style={{ 
                  background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', 
                  padding: '12px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 900, color: 'var(--text-primary)', fontSize: '16px', transition: '0.2s',
                  boxShadow: editingChordIndex === idx ? '0 0 0 2px var(--accent)' : 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {chord.name}
              </div>
              
              {editingChordIndex === idx && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {diatonicOptions.map((opt) => (
                    <div 
                      key={opt.name}
                      onClick={() => handleChordChange(idx, opt)}
                      style={{ padding: '10px', textAlign: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', transition: '0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#000'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    >
                      {opt.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {soloData ? (
          <div style={{ background: '#0a0a0c', padding: '24px', borderRadius: '12px', border: '1px solid #1a1a20' }}>
            <TablatureDisplay 
              notes={soloData.notes} 
              activeStep={activeBeat}
              height={260}
              noteSpacing={90}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 800, border: '2px dashed var(--border-color)', borderRadius: '12px', minHeight: '300px' }}>
            CLICK "GENERATE SOLO" TO CREATE A 4-BAR PHRASE
          </div>
        )}
      </div>
    </div>
  );
};

export default SoloGenerator;
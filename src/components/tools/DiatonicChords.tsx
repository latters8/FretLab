// src/components/harmony/DiatonicChords.tsx

import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import ChordDictionaryModal from './ChordDictionaryModal';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';

type FilterType = 'DIA' | '7TH' | '9TH' | 'ALT';

const DiatonicChords: React.FC = () => {
  // 🔥 Забираем setKeyNote и setMode для управления грифом
  const { getDiatonicChords, mode, keyNote, setKeyNote, setMode } = useMusic();
  const [activeFilter, setActiveFilter] = useState<FilterType>('DIA');
  const [modalConfig, setModalConfig] = useState<{chord: string, voicing?: string} | null>(null);

  const baseChords = getDiatonicChords();

  // 🔥 ЗАЩИТА: Отключаем диатонику для изолированных арпеджио и пентатоник
  const isArpeggioOrAltered = mode.includes('_arp') || mode === 'altered' || mode === 'pentatonic' || mode === 'blues';

  const getDisplayedChords = () => {
    return baseChords.map(c => {
      if (activeFilter === 'DIA') return { roman: c.baseRoman, chord: c.triad };
      if (activeFilter === '7TH') return { roman: c.seventhRoman, chord: c.seventhChord };
      if (activeFilter === '9TH') return { roman: c.ninthRoman, chord: c.ninthChord };
      if (activeFilter === 'ALT') return { roman: c.eleventhRoman, chord: c.eleventhChord };
      return { roman: c.baseRoman, chord: c.triad };
    });
  };

  // 🔥 ИНТЕЛЛЕКТУАЛЬНАЯ ФУНКЦИЯ ОБЫГРЫВАНИЯ АККОРДА
  const handlePlayOverChord = (chordStr: string) => {
    const match = chordStr.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return;
    
    const root = match[1];
    const quality = match[2].toLowerCase();

    setKeyNote(root); // Ставим тонику грифа

    // Включаем нужный режим (Арпеджио или Гамму)
    if (quality.includes('alt')) setMode('altered');
    else if (quality.includes('maj7') || quality.includes('maj9')) setMode('maj7_arp');
    else if (quality.includes('m7') || quality.includes('m9') || quality.includes('m11')) setMode('min7_arp');
    else if (quality.includes('9')) setMode('dom9_arp');
    else if (quality.includes('7')) setMode('dom7_arp');
    else if (quality.includes('m') && !quality.includes('dim')) setMode('minor');
    else if (quality.includes('dim')) setMode('locrian');
    else setMode('major');
  };

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

  // 🔥 Заглушка, если выбрано Арпеджио (чтобы не ломать верстку)
  if (isArpeggioOrAltered) {
    return (
      <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
          🎹 Suggested Chords
        </div>
        <div style={{ background: 'var(--bg-root)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px', opacity: 0.5 }}>🛑</span>
          <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
            Non-Diatonic Mode Active
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.5' }}>
            Chord suggestions are not applicable for isolated arpeggios, pentatonics, or altered scales. Please select a standard 7-note scale.
          </div>
        </div>
      </div>
    );
  }

  const chords = getDisplayedChords();

  return (
    <>
      <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>
            🎹 Suggested Chords <span style={{ color: 'var(--accent)' }}>({keyNote} {mode.replace('_', ' ')})</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {(['DIA', '7TH', '9TH', 'ALT'] as FilterType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveFilter(type)}
                        style={{
                            flex: 1,
                            background: activeFilter === type ? 'var(--accent)' : 'transparent',
                            color: activeFilter === type ? '#000' : 'var(--text-muted)',
                            border: 'none', borderRadius: '4px', padding: '6px 0',
                            fontSize: '10px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
        
        {chords.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {chords.map((c, i) => {
              const isTonic = i === 0 && activeFilter === 'DIA';
              
              // 🔥 ПРАВИЛЬНАЯ ТИПИЗАЦИЯ:
              // Безопасно извлекаем массив Voicing[], обрабатывая оба варианта структуры данных
              const dbResult = CHORD_DB[c.chord];
              const voicings: Voicing[] = Array.isArray(dbResult) 
                ? dbResult 
                : (dbResult && typeof dbResult === 'object' && 'voicings' in dbResult 
                    ? (dbResult as any).voicings 
                    : [generateFallbackVoicing(c.chord)]);
              
              return (
                <div key={i} style={{ 
                    display: 'flex', alignItems: 'center', background: isTonic ? 'var(--bg-hover)' : 'var(--bg-primary)', 
                    padding: '8px 12px', borderRadius: '6px', border: `1px solid ${isTonic ? 'var(--accent)' : 'var(--border-color)'}`,
                    boxShadow: isTonic ? 'inset 3px 0 0 var(--accent)' : 'none'
                  }}>
                  
                  <div 
                    onClick={() => handlePlayOverChord(c.chord)}
                    style={{ display: 'flex', alignItems: 'center', width: '80px', cursor: 'pointer', transition: '0.2s' }}
                    title={`Click to map ${c.chord} arpeggio on Fretboard`}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, width: '35px' }}>{c.roman}</span>
                    <span style={{ color: isTonic ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>{c.chord}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    {/* 🔥 Явное указание типов v: Voicing и idx: number */}
                    {voicings.slice(0, 2).map((v: Voicing, idx: number) => (
                      <div 
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation(); 
                          playChord(v);
                          setModalConfig({ chord: c.chord, voicing: v.name }); 
                        }}
                        style={{
                          background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                          fontSize: '10px', padding: '4px 8px', borderRadius: '12px',
                          border: '1px solid var(--border-color)', cursor: 'pointer',
                          fontWeight: 600, transition: '0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--accent)';
                          e.currentTarget.style.borderColor = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        {v.name}
                      </div>
                    ))}
                    
                    {voicings.length > 2 && (
                      <div 
                        onClick={() => setModalConfig({ chord: c.chord })}
                        style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        +{voicings.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-primary)', padding: '24px 16px', borderRadius: '4px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6' }}>
              No chords defined for <span style={{ color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>{mode}</span>.
            </span>
          </div>
        )}
      </div>

      {modalConfig && (
        <ChordDictionaryModal 
          chord={modalConfig.chord} 
          highlightVoicing={modalConfig.voicing} 
          onClose={() => setModalConfig(null)} 
        />
      )}
    </>
  );
};

export default DiatonicChords;
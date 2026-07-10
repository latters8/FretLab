import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import ChordDictionaryModal from './ChordDictionaryModal';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';

const DiatonicChords: React.FC = () => {
  const { getDiatonicChords, mode } = useMusic();
  const chords = getDiatonicChords();
  
  // Состояние теперь хранит и аккорд, и конкретное обращение (чип)
  const [modalConfig, setModalConfig] = useState<{chord: string, voicing?: string} | null>(null);

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

  return (
    <>
      <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px', marginBottom: '20px', textAlign: 'center' }}>
          🎹 Diatonic Chords & Voicings
        </div>
        
        {chords.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {chords.map((c, i) => {
              const isTonic = i === 0;
              const voicings = CHORD_DB[c.chord] || generateFallbackVoicing(c.chord);
              
              return (
                <div key={c.roman} style={{ 
                    display: 'flex', alignItems: 'center', background: isTonic ? 'var(--bg-hover)' : 'var(--bg-primary)', 
                    padding: '8px 12px', borderRadius: '6px', border: `1px solid ${isTonic ? 'var(--accent)' : 'var(--border-color)'}`,
                    boxShadow: isTonic ? 'inset 3px 0 0 var(--accent)' : 'none'
                  }}>
                  
                  {/* Клик по названию аккорда открывает модалку без акцента на конкретной форме */}
                  <div 
                    onClick={() => setModalConfig({ chord: c.chord })}
                    style={{ display: 'flex', alignItems: 'center', width: '80px', cursor: 'pointer' }}
                    title={`View ${c.chord} variations`}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, width: '30px' }}>{c.roman}</span>
                    <span style={{ color: isTonic ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>{c.chord}</span>
                  </div>

                  {/* Чипы с формами аккордов */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    {voicings.slice(0, 3).map((v, idx) => (
                      <div 
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation(); 
                          playChord(v); // 🔊 Звук!
                          setModalConfig({ chord: c.chord, voicing: v.name }); // 👁 Открываем схему!
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
                        title={`Play and view ${c.chord} (${v.name})`}
                      >
                        {v.name}
                      </div>
                    ))}
                    
                    {/* Кнопка "еще N", открывает общую модалку */}
                    {voicings.length > 3 && (
                      <div 
                        onClick={() => setModalConfig({ chord: c.chord })}
                        style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer' }}
                        title={`See all ${voicings.length} voicings`}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        +{voicings.length - 3}
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
              No strict diatonic mapping defined for <br/>
              <span style={{ color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>{mode}</span> mode yet.
            </span>
          </div>
        )}
      </div>

      {modalConfig && (
        <ChordDictionaryModal 
          chord={modalConfig.chord} 
          highlightVoicing={modalConfig.voicing} // Передаем целевой чип
          onClose={() => setModalConfig(null)} 
        />
      )}
    </>
  );
};

export default DiatonicChords;
import React, { useEffect } from 'react';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';

interface ModalProps {
  chord: string;
  highlightVoicing?: string; // Новый проп для фокусировки
  onClose: () => void;
}

const ChordDictionaryModal: React.FC<ModalProps> = ({ chord, highlightVoicing, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const rawVoicings = CHORD_DB[chord] || generateFallbackVoicing(chord);

  // Сортируем: если есть highlightVoicing, он всегда будет первым в списке!
  const voicings = [...rawVoicings].sort((a, b) => {
    if (a.name === highlightVoicing) return -1;
    if (b.name === highlightVoicing) return 1;
    return 0;
  });

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

  const renderChordSVG = (voicing: Voicing, isHighlighted: boolean) => {
    const width = 120;
    const height = 140;
    const stringSpacing = 20;
    const fretSpacing = 25;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {voicing.baseFret > 1 && (
          <text x="-20" y="30" fill={isHighlighted ? "var(--text-primary)" : "var(--text-muted)"} fontSize="12" fontWeight="bold">
            {voicing.baseFret}fr
          </text>
        )}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`str-${i}`} x1={10 + i * stringSpacing} y1="20" x2={10 + i * stringSpacing} y2="120" stroke="var(--border-color)" strokeWidth={1 + (5 - i) * 0.3} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`fret-${i}`} x1="10" y1={20 + i * fretSpacing} x2="110" y2={20 + i * fretSpacing} stroke="var(--border-color)" strokeWidth={i === 0 && voicing.baseFret === 1 ? 4 : 1} />
        ))}
        {voicing.frets.map((fret, stringIdx) => {
          const x = 10 + stringIdx * stringSpacing;
          if (fret === 'x') return <text key={`mute-${stringIdx}`} x={x - 4} y="10" fill="var(--text-muted)" fontSize="12" fontWeight="bold">x</text>;
          if (fret === 0) return <circle key={`open-${stringIdx}`} cx={x} cy="8" r="4" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />;
          
          const relativeFret = (fret as number) - voicing.baseFret + 1;
          const y = 20 + (relativeFret - 0.5) * fretSpacing;
          return <circle key={`dot-${stringIdx}`} cx={x} cy={y} r="6" fill="var(--accent)" stroke="#000" strokeWidth="2" />;
        })}
      </svg>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-panel)', width: '700px', maxWidth: '90%', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>// Chord Dictionary Engine</div>
            <div style={{ fontSize: '32px', color: 'var(--text-primary)', fontWeight: 800 }}>{chord} <span style={{ color: 'var(--accent)' }}>Chord</span></div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
        </div>
        
        {voicings.length > 0 ? (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{highlightVoicing ? 'Focusing on selected voicing:' : 'Available voicings & positions:'}</span>
              <span style={{ color: 'var(--accent)' }}>👉 Click any chord to hear it!</span>
            </div>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {voicings.map((v, i) => {
                const isHighlighted = v.name === highlightVoicing;

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        fontSize: '12px', color: isHighlighted ? '#000' : 'var(--accent)', fontWeight: 800, 
                        textTransform: 'uppercase', letterSpacing: '1px', 
                        background: isHighlighted ? 'var(--accent)' : 'transparent',
                        padding: isHighlighted ? '2px 8px' : '0', borderRadius: '4px'
                      }}>
                      {v.name}
                    </div>
                    <div 
                      onClick={() => playChord(v)}
                      style={{ 
                        background: isHighlighted ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-primary)', 
                        padding: '24px', borderRadius: '8px', 
                        border: `2px solid ${isHighlighted ? 'var(--accent)' : 'var(--border-color)'}`, 
                        cursor: 'pointer', transition: 'all 0.2s', 
                        boxShadow: isHighlighted ? '0 0 20px rgba(163, 116, 255, 0.3)' : '0 4px 12px rgba(0,0,0,0.3)' 
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isHighlighted ? 'var(--accent)' : 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {renderChordSVG(v, isHighlighted)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Algorithm error for {chord}.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChordDictionaryModal;
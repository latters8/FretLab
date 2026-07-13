import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSmartLick, type Lick } from '../../services/AIEngine';

const Tablature: React.FC = () => {
  const { mode, keyNote, getScaleNotes, bpm } = useMusic();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentLick, setCurrentLick] = useState<Lick | null>(null);
  
  const [localActiveStep, setLocalActiveStep] = useState<number>(-1);

  useEffect(() => {
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const safeKey = keyNote || 'C';
    const safeMode = mode || 'major';
    
    setCurrentLick(generateSmartLick(safeScale, safeKey, safeMode));
  }, [keyNote, mode]);

  const handleGenerate = () => {
    if (isPlayingAudio) return;
    setIsGenerating(true);
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    
    setTimeout(() => {
      setCurrentLick(generateSmartLick(safeScale, keyNote || 'C', mode || 'major'));
      setIsGenerating(false);
      setLocalActiveStep(-1);
    }, 400);
  };

  const playLickAudio = () => {
    if (!currentLick || isPlayingAudio) return;
    setIsPlayingAudio(true);
    setLocalActiveStep(-1);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]; 
      
      let startTime = ctx.currentTime + 0.1;
      const currentBpm = bpm || 120;
      const quarterDuration = 60 / currentBpm; 

      currentLick.notes.forEach((note, index) => {
        // Если fret === null, используем 0 (открытая струна)
      const fretValue = note.fret ?? 0;
      const freq = OPEN_FREQS[note.string] * Math.pow(2, fretValue / 12);
        
        let noteDuration = quarterDuration;
        if (note.duration === 'eighth') noteDuration = quarterDuration / 2;
        if (note.duration === 'sixteenth') noteDuration = quarterDuration / 4;

        setTimeout(() => {
          setLocalActiveStep(index);
        }, (startTime - ctx.currentTime) * 1000);

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Делаем звук мягче, ближе к чистому гитарному тону
        osc.type = 'triangle'; 
        
        if (note.technique === 'vibrato') {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.value = 6; 
          lfoGain.gain.value = freq * 0.02; 
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(startTime);
          lfo.stop(startTime + 3.0);
        }

        osc.frequency.setValueAtTime(freq, startTime);
        
        // 🔥 ИСПРАВЛЕННАЯ ОГИБАЮЩАЯ ЗВУКА (Настоящий гитарный сустейн)
        // Нота не обрывается сразу, а медленно затухает до 2.5 секунд
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.015); // Быстрая атака (щипок)
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 2.5); // Доооооолгое затухание (сустейн)
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        // Не выключаем осциллятор по длительности ноты, даем ему "отзвенеть"
        osc.stop(startTime + 2.5);

        startTime += noteDuration;
      });

      setTimeout(() => {
        setLocalActiveStep(-1);
        setIsPlayingAudio(false);
      }, (startTime - ctx.currentTime) * 1000 + 500);

    } catch (e) {
      console.error("Audio Synthesis Failed:", e);
      setIsPlayingAudio(false);
    }
  };

  const stringSpacing = 20;
  const startY = 40;
  const noteSpacing = 70;
  const startX = 80;

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, minHeight: '310px', marginTop: '8px' }}>
      
      <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            🎸 Lick & Short Phrase Generator
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>
            {currentLick ? currentLick.name : 'Initializing Tab Engine...'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={playLickAudio}
            disabled={isGenerating || isPlayingAudio || !currentLick}
            style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 900, fontSize: '12px', cursor: isPlayingAudio ? 'default' : 'pointer', transition: '0.2s', display: 'flex', gap: '8px', alignItems: 'center', opacity: (isGenerating || !currentLick) ? 0.5 : 1 }}
          >
            {isPlayingAudio ? '🎶 PLAYING...' : '🔊 PLAY LICK'}
          </button>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isPlayingAudio || !currentLick}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: '0.2s', display: 'flex', gap: '8px', alignItems: 'center', opacity: isPlayingAudio ? 0.5 : 1 }}
            onMouseEnter={e => { if(!isPlayingAudio) e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            {isGenerating ? '⏳ GENERATING...' : '🎲 GENERATE NEW'}
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', overflowX: 'auto', background: '#111216', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        
        {!currentLick ? (
          <div style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '12px', letterSpacing: '1px', width: '100%', textAlign: 'center' }}>
            ⏳ LOADING VECTOR TABLATURE ENGINE...
          </div>
        ) : (
          <svg viewBox={`0 0 ${Math.max(800, currentLick.notes.length * noteSpacing + 150)} 240`} style={{ width: '100%', minWidth: '600px', height: '180px', display: 'block' }}>
            
            {[0, 1, 2, 3, 4, 5].map((strIndex) => (
              <line 
                key={`str-${strIndex}`}
                x1="30" y1={startY + strIndex * stringSpacing} 
                x2={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y2={startY + strIndex * stringSpacing} 
                stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
              />
            ))}

            {['e', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
              <text key={`tune-${i}`} x="45" y={startY + i * stringSpacing + 4} fill="var(--text-muted)" fontSize="12" fontWeight="800" fontFamily="monospace" textAnchor="middle">
                {note}
              </text>
            ))}

            <line x1="70" y1={startY} x2="70" y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />
            <line x1={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y1={startY} x2={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />

            {currentLick.notes.map((note, index) => {
              const x = startX + index * noteSpacing;
              const y = startY + note.string * stringSpacing;
              const nextX = startX + (index + 1) * noteSpacing;
              const nextY = startY + (currentLick.notes[index + 1]?.string || 0) * stringSpacing;
              
              const stemBottomY = 190;
              const isActive = localActiveStep === index;
              
              return (
                <g key={`note-${index}`} style={{ opacity: isGenerating ? 0.3 : 1, transition: 'all 0.1s' }}>
                  
                  {note.tiedToNext && currentLick.notes[index + 1] && (
                    <path 
                      d={`M ${x + 6} ${y - 12} Q ${(x + nextX) / 2} ${Math.min(y, nextY) - 25} ${nextX - 6} ${nextY - 12}`} 
                      fill="transparent" stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5"
                    />
                  )}
                  {note.technique === 'slide' && (
                    <line x1={x + 12} y1={y - 8} x2={nextX - 12} y2={nextY + 8} stroke="var(--accent)" strokeWidth="2" opacity="0.7" />
                  )}
                  {note.technique === 'vibrato' && (
                    <path d={`M ${x-10} ${y-20} Q ${x-5} ${y-25} ${x} ${y-20} T ${x+10} ${y-20} T ${x+20} ${y-20}`} fill="transparent" stroke="var(--accent)" strokeWidth="2" />
                  )}

                  <line x1={x} y1={y + 10} x2={x} y2={stemBottomY} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5" />
                  
                  {(note.duration === 'eighth' || note.duration === 'sixteenth') && (
                    <line x1={x} y1={stemBottomY} x2={x + 15} y2={stemBottomY - 5} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                  )}
                  {note.duration === 'sixteenth' && (
                    <line x1={x} y1={stemBottomY - 6} x2={x + 15} y2={stemBottomY - 11} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                  )}

                  <rect x={x - 12} y={y - 12} width="24" height="24" fill="#111216" rx="4" />

                  {isActive && (
                    <circle cx={x} cy={y} r="16" fill="var(--accent)" opacity="0.8" style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }} />
                  )}

                  <text 
                    x={x} y={y + 4} 
                    fill={isActive ? '#000' : (note.technique !== 'none' ? 'var(--accent)' : 'var(--text-primary)')} 
                    fontSize={isActive ? "18" : "14"} 
                    fontWeight="900" fontFamily="monospace" textAnchor="middle"
                  >
                    {note.fret}
                  </text>

                  {note.tiedToNext && (
                    <text x={(x + nextX) / 2} y={Math.min(y, nextY) - 20} fill="var(--accent)" fontSize="10" fontWeight="800" textAnchor="middle">
                      {note.technique === 'hammer' ? 'H' : note.technique === 'pull' ? 'P' : note.technique === 'slide' ? 'sl' : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export default Tablature;
// src/components/fretboard/Tablature.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSmartLick, type Lick } from '../../services/AIEngine';
import * as Tone from 'tone';

const Tablature: React.FC = () => {
  const { mode, keyNote, getScaleNotes, bpm, timeSignature } = useMusic();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentLick, setCurrentLick] = useState<Lick | null>(null);
  const [localActiveStep, setLocalActiveStep] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Ссылки на инструменты Tone.js
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const fallbackSynthRef = useRef<Tone.PolySynth | null>(null);

  // ===== ИНИЦИАЛИЗАЦИЯ ЗВУКА И MIDI =====
  useEffect(() => {
    // 1. Создаем сэмплер реальной гитары (ищет .mp3 файлы в public/samples/guitar/)
    const guitarSampler = new Tone.Sampler({
      urls: {
        "E2": "E2.mp3",
        "A2": "A2.mp3",
        "D3": "D3.mp3",
        "G3": "G3.mp3",
        "B3": "B3.mp3",
        "E4": "E4.mp3",
      },
      baseUrl: "/samples/guitar/",
      onload: () => console.log("Сэмплы гитары успешно загружены!"),
    }).toDestination();

    // 2. Фолбэк-синтезатор (обычный синт с параметрами щипка, чтобы не было ошибок TS)
    const pluckSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    // Делаем звук похожим на гитарный щипок
    pluckSynth.set({
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    });

    samplerRef.current = guitarSampler;
    fallbackSynthRef.current = pluckSynth;

    // 3. Подключение Web MIDI API (переделано на forEach, чтобы TS не ругался на Iterator)
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midiAccess) => {
        console.log("MIDI API подключено!");
        
        midiAccess.inputs.forEach((input) => {
          input.onmidimessage = (message: any) => {
            const [command, note, velocity] = message.data;
            const freq = Tone.Frequency(note, "midi").toFrequency();
            const activeSynth = guitarSampler.loaded ? guitarSampler : pluckSynth;

            if (command === 144 && velocity > 0) {
               // Нота нажата (Note On)
               activeSynth.triggerAttack(freq, Tone.now(), velocity / 127);
            } else if (command === 128 || (command === 144 && velocity === 0)) {
               // Нота отпущена (Note Off)
               activeSynth.triggerRelease(freq, Tone.now());
            }
          };
        });
      }).catch(err => console.log("Нет доступа к MIDI-устройствам", err));
    }

    return () => {
      guitarSampler.dispose();
      pluckSynth.dispose();
    };
  }, []);

  useEffect(() => {
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const safeKey = keyNote || 'C';
    const safeMode = mode || 'major';
    setCurrentLick(generateSmartLick(safeScale, safeKey, safeMode, bpm, timeSignature));
  }, [keyNote, mode, bpm, timeSignature]);

  const handleGenerate = () => {
    if (isPlayingAudio) return;
    setIsGenerating(true);
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    setTimeout(() => {
      setCurrentLick(generateSmartLick(safeScale, keyNote || 'C', mode || 'major', bpm, timeSignature));
      setIsGenerating(false);
      setLocalActiveStep(-1);
    }, 400);
  };

  const playLickAudio = async () => {
    if (!currentLick || isPlayingAudio) return;
    
    // Обязательно стартуем контекст Tone.js по клику пользователя
    await Tone.start();
    setIsPlayingAudio(true);
    setLocalActiveStep(-1);

    const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]; // 1-6 струны
    
    let startTime = Tone.now() + 0.1;
    const currentBpm = (bpm || 120) * playbackSpeed;
    const quarterDuration = 60 / currentBpm;

    // Выбираем инструмент: если сэмплы скачаны — играем ими, если нет — используем синтезатор
    const activeInst = samplerRef.current?.loaded ? samplerRef.current : fallbackSynthRef.current;

    currentLick.notes.forEach((note, index) => {
      const durationMap: Record<string, number> = {
        'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25, 'dotted_eighth': 0.75
      };
      
      const noteDuration = quarterDuration * (durationMap[note.duration || '8n'] || 1);
      const actualDuration = noteDuration * (note.durationFactor || 0.9);

      // Синхронизируем UI шаг с аудио
      setTimeout(() => {
        setLocalActiveStep(index);
      }, (startTime - Tone.now()) * 1000);

      if (!note.isRest && activeInst) {
        const fretValue = note.fret ?? 0;
        let freq = OPEN_FREQS[note.string] * Math.pow(2, fretValue / 12);
        
        // Обработка бендов
        if (note.technique === 'bend' || note.technique === 'prebend') {
           const bendAmount = note.bendAmount || 1;
           freq = freq * Math.pow(2, bendAmount / 12); 
        }

        const velocity = note.accent ? 1 : (note.velocity || 0.7);
        activeInst.triggerAttackRelease(freq, actualDuration, startTime, velocity);
      }

      startTime += actualDuration;
    });

    setTimeout(() => {
      setLocalActiveStep(-1);
      setIsPlayingAudio(false);
    }, (startTime - Tone.now()) * 1000 + 500);
  };

  // ===== РЕНДЕР (UI) =====
  const stringSpacing = 20;
  const startY = 40;
  const noteSpacing = 70;
  const startX = 80;

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, minHeight: '310px', marginTop: '8px' }}>
      
      <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            🎸 Lick Generator
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>
            {currentLick ? currentLick.name : 'Initializing...'}
          </span>
          {currentLick && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-secondary)', padding: '2px 10px', borderRadius: '12px' }}>
              {timeSignature.beats}/{timeSignature.noteValue}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>SPEED</span>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1" 
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              style={{ width: '60px', height: '4px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, minWidth: '30px' }}>
              {playbackSpeed.toFixed(1)}x
            </span>
          </div>

          <button 
            onClick={playLickAudio}
            disabled={isGenerating || isPlayingAudio || !currentLick}
            style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 900, fontSize: '12px', cursor: isPlayingAudio ? 'default' : 'pointer', transition: '0.2s', display: 'flex', gap: '8px', alignItems: 'center', opacity: (isGenerating || !currentLick) ? 0.5 : 1 }}
          >
            {isPlayingAudio ? '🎶 PLAYING...' : '🔊 PLAY LICK'}
          </button>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isPlayingAudio}
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
            ⏳ LOADING...
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
              if (note.isRest) {
                const x = startX + index * noteSpacing;
                return (
                  <g key={`rest-${index}`}>
                    <text x={x} y={startY + 5 * stringSpacing + 20} fill="var(--text-muted)" fontSize="12" fontFamily="monospace" textAnchor="middle">𝄐</text>
                  </g>
                );
              }

              const x = startX + index * noteSpacing;
              const y = startY + note.string * stringSpacing;
              const nextX = startX + (index + 1) * noteSpacing;
              const nextY = startY + (currentLick.notes[index + 1]?.string || 0) * stringSpacing;
              
              const stemBottomY = 190;
              const isActive = localActiveStep === index;
              const isAccent = note.accent;
              const isLegato = note.technique === 'hammer' || note.technique === 'pull';
              
              return (
                <g key={`note-${index}`} style={{ opacity: isGenerating ? 0.3 : 1, transition: 'all 0.1s' }}>
                  
                  {note.tiedToNext && currentLick.notes[index + 1] && (
                    <path 
                      d={`M ${x + 6} ${y - 12} Q ${(x + nextX) / 2} ${Math.min(y, nextY) - 25} ${nextX - 6} ${nextY - 12}`} 
                      fill="transparent" stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5"
                    />
                  )}

                  {isLegato && (
                    <text x={x} y={y - 22} fill="var(--accent)" fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle">
                      {note.technique === 'hammer' ? 'H' : 'P'}
                    </text>
                  )}

                  {note.technique === 'slide' && (
                    <line x1={x + 12} y1={y - 8} x2={nextX - 12} y2={nextY + 8} stroke="var(--accent)" strokeWidth="2" opacity="0.7" />
                  )}
                  {note.technique === 'vibrato' && (
                    <path d={`M ${x-10} ${y-20} Q ${x-5} ${y-25} ${x} ${y-20} T ${x+10} ${y-20} T ${x+20} ${y-20}`} fill="transparent" stroke="var(--accent)" strokeWidth="2" />
                  )}
                  {note.technique === 'bend' && (
                    <path d={`M ${x} ${y-20} Q ${x+5} ${y-30} ${x+15} ${y-20}`} fill="transparent" stroke="var(--accent)" strokeWidth="2" />
                  )}
                  {note.technique === 'ghost' && (
                    <text x={x} y={y - 20} fill="var(--text-muted)" fontSize="10" fontFamily="monospace" textAnchor="middle">( )</text>
                  )}

                  {isAccent && (
                    <text x={x} y={y - 28} fill="var(--accent)" fontSize="14" fontWeight="900" textAnchor="middle">›</text>
                  )}

                  <line x1={x} y1={y + 10} x2={x} y2={stemBottomY} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5" />
                  
                  {(note.duration === 'eighth' || note.duration === 'sixteenth' || note.duration === 'dotted_eighth') && (
                    <line x1={x} y1={stemBottomY} x2={x + 15} y2={stemBottomY - 5} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                  )}
                  {note.duration === 'sixteenth' && (
                    <line x1={x} y1={stemBottomY - 6} x2={x + 15} y2={stemBottomY - 11} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                  )}
                  {note.duration === 'whole' && (
                    <circle cx={x} cy={y + 8} r="6" fill="none" stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5" />
                  )}

                  <rect x={x - 14} y={y - 14} width="28" height="28" fill="#111216" rx="4" />

                  {isActive && (
                    <circle cx={x} cy={y} r="18" fill="var(--accent)" opacity="0.8" style={{ filter: 'drop-shadow(0 0 12px var(--accent))' }} />
                  )}

                  <text 
                    x={x} y={y + 5} 
                    fill={isActive ? '#000' : (isLegato ? 'var(--accent)' : (note.technique !== 'none' ? 'var(--accent)' : 'var(--text-primary)'))} 
                    fontSize={isActive ? "18" : (isAccent ? "16" : "14")} 
                    fontWeight={isAccent ? 900 : 800} 
                    fontFamily="monospace" 
                    textAnchor="middle"
                  >
                    {note.fret}
                  </text>
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
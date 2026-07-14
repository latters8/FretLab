// src/components/tools/SoloGenerator.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSynchronizedSolo, type SyncSoloData } from '../../services/AIEngine';
import * as Tone from 'tone';

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Вспомогательная функция для генерации частот аккорда
const getChordFrequencies = (chordName: string, octave = 3): number[] => {
  const match = chordName.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return [];
  const root = match[1];
  const quality = match[2].toLowerCase();
  const rootIdx = ALL_NOTES.indexOf(root);
  if (rootIdx === -1) return [];

  let intervals = [0, 4, 7]; // Мажор по умолчанию
  if (quality.includes('m') && !quality.includes('maj')) intervals = [0, 3, 7]; // Минор
  if (quality.includes('dim')) intervals = [0, 3, 6];
  if (quality.includes('7')) intervals.push(quality.includes('maj') ? 11 : 10);

  return intervals.map(interval => {
    const noteIdx = (rootIdx + interval) % 12;
    const noteOctave = octave + Math.floor((rootIdx + interval) / 12);
    return Tone.Frequency(`${ALL_NOTES[noteIdx]}${noteOctave}`).toFrequency();
  });
};

const SoloGenerator: React.FC = () => {
  const { keyNote, mode, bpm, timeSignature, getScaleNotes, setKeyNote, setMode } = useMusic();
  
  const [soloData, setSoloData] = useState<SyncSoloData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // от 0 до 1
  const [showUpload, setShowUpload] = useState(false);

  // Синтезаторы Tone.js
  const chordSynthRef = useRef<Tone.PolySynth | null>(null);
  const soloSynthRef = useRef<Tone.PolySynth | null>(null);
  const playheadAnimRef = useRef<number>(0);

  useEffect(() => {
    // Инициализируем аудио движок
    chordSynthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 2 }
    }).toDestination();
    chordSynthRef.current.volume.value = -12; // Аккорды потише

    soloSynthRef.current = new Tone.PolySynth(Tone.Synth, {
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();

    return () => {
      chordSynthRef.current?.dispose();
      soloSynthRef.current?.dispose();
      cancelAnimationFrame(playheadAnimRef.current);
    };
  }, []);

  const handleGenerate = () => {
    if (isPlaying) return;
    setIsGenerating(true);
    setSoloData(null);
    setPlaybackProgress(0);

    setTimeout(() => {
      const scale = getScaleNotes();
      const safeScale = scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const newSolo = generateSynchronizedSolo(safeScale, keyNote || 'C', mode || 'major', timeSignature);
      setSoloData(newSolo);
      setIsGenerating(false);
    }, 600);
  };

  // Остановка при смене тональности
  useEffect(() => {
    if (soloData && !isPlaying) handleGenerate();
  }, [keyNote, mode, timeSignature.beats]);

  const togglePlay = async () => {
    if (!soloData) return;
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
      setPlaybackProgress(0);
      cancelAnimationFrame(playheadAnimRef.current);
      return;
    }

    await Tone.start();
    setIsPlaying(true);
    
    const currentBpm = bpm || 120;
    const quarterDuration = 60 / currentBpm;
    const totalDurationSec = soloData.totalBeats * quarterDuration;
    const startTime = Tone.now() + 0.1;

    // Планируем аккорды
    soloData.chords.forEach(chord => {
      const time = startTime + chord.beatStart * quarterDuration;
      const duration = chord.durationBeats * quarterDuration;
      const freqs = getChordFrequencies(chord.name);
      chordSynthRef.current?.triggerAttackRelease(freqs, duration * 0.9, time);
    });

    // Планируем соло (6 струн = E2, A2, D3, G3, B3, E4)
    const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]; 
    
    soloData.notes.forEach(note => {
      if (!note.isRest && note.fret !== null) {
        const time = startTime + note.beatStart * quarterDuration;
        const duration = note.beatDuration * quarterDuration * note.durationFactor;
        const freq = OPEN_FREQS[note.string] * Math.pow(2, note.fret / 12);
        const velocity = note.accent ? 1 : 0.7;
        soloSynthRef.current?.triggerAttackRelease(freq, duration, time, velocity);
      }
    });

    // Анимация плейхеда (полосы воспроизведения)
    const drawPlayhead = () => {
      const now = Tone.now();
      const progress = (now - startTime) / totalDurationSec;
      
      if (progress >= 1) {
        setPlaybackProgress(1);
        setIsPlaying(false);
        setTimeout(() => setPlaybackProgress(0), 500); // Сбрасываем в начало
      } else if (progress > 0) {
        setPlaybackProgress(progress);
        playheadAnimRef.current = requestAnimationFrame(drawPlayhead);
      } else {
        playheadAnimRef.current = requestAnimationFrame(drawPlayhead); // Ждем старта
      }
    };
    
    playheadAnimRef.current = requestAnimationFrame(drawPlayhead);
  };

  // ===== ГЕНЕРАЦИЯ UI СЕТКИ =====
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 220;
  const TRACK_MARGIN_X = 20;
  const BAR_WIDTH = (SVG_WIDTH - TRACK_MARGIN_X * 2) / (soloData?.bars || 4);
  const BEAT_WIDTH = BAR_WIDTH / timeSignature.beats;
  const CHORD_Y = 20;
  const TAB_Y = 80;
  const STRING_SPACING = 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            🎸 AI Composer: 4-Bar Solo
            {soloData && <span style={{ fontSize: '12px', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '12px', color: 'var(--accent)' }}>SYNCED</span>}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Генератор гармонии и мелодии в реальном времени. Привязан к метрике метронома ({timeSignature.beats}/{timeSignature.noteValue}).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={keyNote} onChange={e => setKeyNote(e.target.value)}
            style={{ background: '#111216', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700 }}
          >
            {ALL_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select 
            value={mode} onChange={e => setMode(e.target.value as any)}
            style={{ background: '#111216', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, textTransform: 'capitalize' }}
          >
            <option value="major">Major (Ionian)</option>
            <option value="minor">Minor (Aeolian)</option>
            <option value="dorian">Dorian</option>
            <option value="phrygian">Phrygian</option>
            <option value="pentatonic">Pentatonic</option>
            <option value="blues">Blues</option>
          </select>

          <button 
            onClick={togglePlay}
            disabled={!soloData || isGenerating}
            style={{ background: isPlaying ? 'transparent' : 'var(--accent)', color: isPlaying ? 'var(--accent)' : '#000', border: `2px solid var(--accent)`, padding: '8px 24px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}
          >
            {isPlaying ? '⏹ STOP' : '▶ PLAY'}
          </button>
          
          <button 
            onClick={handleGenerate}
            disabled={isPlaying || isGenerating}
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            {isGenerating ? '⏳...' : '🎲 GENERATE'}
          </button>
        </div>
      </div>

      {/* SEQUENCER VISUALIZER */}
      <div style={{ width: '100%', background: '#0a0a0d', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--border-color)', position: 'relative', minHeight: `${SVG_HEIGHT}px` }}>
        
        {!soloData && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>
            Нажмите GENERATE, чтобы создать соло
          </div>
        )}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 900 }}>
            СИНТЕЗ AI МЕЛОДИИ...
          </div>
        )}

        {soloData && !isGenerating && (
          <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ display: 'block' }}>
            
            {/* Сетка тактов и долей */}
            {Array.from({ length: soloData.bars }).map((_, barIdx) => {
               const barX = TRACK_MARGIN_X + barIdx * BAR_WIDTH;
               return (
                 <g key={`grid-bar-${barIdx}`}>
                   <line x1={barX} y1={0} x2={barX} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                   <text x={barX + 6} y={14} fill="var(--text-muted)" fontSize="10" fontWeight="bold">Bar {barIdx + 1}</text>
                   
                   {/* Внутренние доли */}
                   {Array.from({ length: timeSignature.beats }).map((_, beatIdx) => {
                     if (beatIdx === 0) return null;
                     const beatX = barX + beatIdx * BEAT_WIDTH;
                     return <line key={`grid-beat-${barIdx}-${beatIdx}`} x1={beatX} y1={CHORD_Y} x2={beatX} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />;
                   })}
                 </g>
               );
            })}
            <line x1={SVG_WIDTH - TRACK_MARGIN_X} y1={0} x2={SVG_WIDTH - TRACK_MARGIN_X} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

            {/* ДОРОЖКА АККОРДОВ */}
            {soloData.chords.map((chord, i) => {
               const x = TRACK_MARGIN_X + chord.beatStart * BEAT_WIDTH;
               const width = chord.durationBeats * BEAT_WIDTH;
               return (
                 <g key={`chord-${i}`}>
                   <rect x={x + 2} y={CHORD_Y} width={width - 4} height="30" fill="rgba(255, 255, 255, 0.05)" rx="4" stroke="rgba(255, 255, 255, 0.1)" />
                   <text x={x + width / 2} y={CHORD_Y + 20} fill="var(--text-primary)" fontSize="14" fontWeight="900" textAnchor="middle">{chord.name}</text>
                 </g>
               );
            })}

            {/* ДОРОЖКА ТАБУЛАТУРЫ (СОЛО) */}
            {[0, 1, 2, 3, 4, 5].map((strIndex) => (
              <line 
                key={`tab-str-${strIndex}`}
                x1={TRACK_MARGIN_X} y1={TAB_Y + strIndex * STRING_SPACING} 
                x2={SVG_WIDTH - TRACK_MARGIN_X} y2={TAB_Y + strIndex * STRING_SPACING} 
                stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" 
              />
            ))}
            {['e', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
              <text key={`tab-tune-${i}`} x={TRACK_MARGIN_X - 10} y={TAB_Y + i * STRING_SPACING + 4} fill="var(--text-muted)" fontSize="10" fontWeight="800" textAnchor="middle">{note}</text>
            ))}

            {/* НОТЫ СОЛО */}
            {soloData.notes.map((note, i) => {
              if (note.isRest || note.fret === null) return null;
              
              const x = TRACK_MARGIN_X + note.beatStart * BEAT_WIDTH;
              const y = TAB_Y + note.string * STRING_SPACING;
              const noteWidth = note.beatDuration * BEAT_WIDTH;

              // Если нота звучит прямо сейчас (внутри playhead)
              const noteStartProgress = note.beatStart / soloData.totalBeats;
              const noteEndProgress = (note.beatStart + note.beatDuration) / soloData.totalBeats;
              const isActive = isPlaying && playbackProgress >= noteStartProgress && playbackProgress < noteEndProgress;

              return (
                <g key={`note-${i}`}>
                  {/* Линия длительности */}
                  <line x1={x + 10} y1={y} x2={x + noteWidth - 10} y2={y} stroke={isActive ? "var(--accent)" : "rgba(255,255,255,0.2)"} strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Блок ноты */}
                  <rect x={x - 12} y={y - 12} width="24" height="24" fill={isActive ? "var(--accent)" : "#1a1b20"} rx="4" stroke={isActive ? "#fff" : "var(--border-color)"} />
                  <text x={x} y={y + 4} fill={isActive ? "#000" : "var(--accent)"} fontSize="14" fontWeight="900" fontFamily="monospace" textAnchor="middle">
                    {note.fret}
                  </text>
                  
                  {/* Техника */}
                  {note.technique !== 'none' && (
                    <text x={x} y={y - 18} fill="var(--text-muted)" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {note.technique === 'vibrato' ? 'vib' : 'sl'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* PLAYHEAD (Бегунок) */}
            {isPlaying && (
              <line 
                x1={TRACK_MARGIN_X + playbackProgress * (SVG_WIDTH - TRACK_MARGIN_X * 2)} 
                y1={0} 
                x2={TRACK_MARGIN_X + playbackProgress * (SVG_WIDTH - TRACK_MARGIN_X * 2)} 
                y2={SVG_HEIGHT} 
                stroke="var(--accent)" 
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }}
              />
            )}
          </svg>
        )}
      </div>

      {/* СОВЕТЫ И АНАЛИЗ AI */}
      {soloData && (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>🤖 AI Analysis & Tips</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.6' }}>
            {soloData.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ЗАГРУЗКА ФАЙЛА (ТРАНСКРИПЦИЯ) - Спрятана вниз */}
      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showUpload ? '▼ Скрыть транскрипцию аудио' : '▶ Распознать соло из аудио файла (Beta)'}
        </button>
        
        {showUpload && (
          <div style={{ marginTop: '16px', padding: '24px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Перетащите аудио файл сюда</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>AI проанализирует MP3/WAV и переведет его в табулатуру</div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SoloGenerator;
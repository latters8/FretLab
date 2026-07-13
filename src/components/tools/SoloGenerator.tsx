// src/components/tools/SoloGenerator.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSmartLick, type Lick } from '../../services/AIEngine';
import { playChordByName } from '../../utils/audioEngine';

interface SoloGeneratorProps {
  onClose?: () => void;
}

const SoloGenerator: React.FC<SoloGeneratorProps> = ({ onClose }) => {
  const { 
    keyNote, 
    mode, 
    bpm, 
    timeSignature, 
    getScaleNotes,
    setKeyNote,
    setMode 
  } = useMusic();

  const [lick, setLick] = useState<Lick | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  //const [selectedChord, setSelectedChord] = useState<string>(keyNote + (mode === 'minor' ? 'm' : ''));
  const [chordProgression, setChordProgression] = useState<string[]>([]);
  const [selectedBar, setSelectedBar] = useState<number>(0);
  const [playMode, setPlayMode] = useState<'chords' | 'solo' | 'both'>('both');

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  // Доступные тональности и лады
  const availableKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  const availableModes = [
    'major', 'minor', 'dorian', 'phrygian', 'lydian', 
    'mixolydian', 'aeolian', 'locrian', 'blues', 'pentatonic'
  ];

  // Генерация прогрессии аккордов на 4 такта
  const generateChordProgression = (root: string, modeType: string) => {
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = allNotes.indexOf(root);
    
    // Интервалы для разных ладов
    const modeIntervals: Record<string, number[]> = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      aeolian: [0, 2, 3, 5, 7, 8, 10],
      locrian: [0, 1, 3, 5, 6, 8, 10],
      blues: [0, 3, 5, 6, 7, 10],
      pentatonic: [0, 2, 4, 7, 9]
    };

    const intervals = modeIntervals[modeType] || modeIntervals.major;
    const scaleNotes = intervals.map(i => allNotes[(rootIndex + i) % 12]);

    // Строим 4-тактовую прогрессию (I - IV - V - I)
    //const progression: string[] = [];
    const chordQualities: Record<string, string> = {
      'major': '',
      'minor': 'm',
      'dorian': 'm',
      'phrygian': 'm',
      'lydian': 'maj7',
      'mixolydian': '7',
      'aeolian': 'm',
      'locrian': 'm7b5',
      'blues': '7',
      'pentatonic': ''
    };

    const quality = chordQualities[modeType] || '';
    
    // Базовые ступени
    const degrees = [0, 3, 4, 0]; // I - IV - V - I
    const chordNames = degrees.map(d => {
      const note = scaleNotes[d % scaleNotes.length];
      return note + quality;
    });

    return chordNames;
  };

  // Генерация соло
  const generateSolo = () => {
    setIsGenerating(true);
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    
    // Генерируем 4 такта соло
    const barCount = 4;
    const allNotes: any[] = [];
    
    // Создаем фразу для каждого такта
    const chords = generateChordProgression(keyNote, mode);
    setChordProgression(chords);
    
    for (let bar = 0; bar < barCount; bar++) {
      // Для каждого такта генерируем отдельную фразу
      const barLick = generateSmartLick(
        safeScale, 
        keyNote, 
        mode, 
        bpm, 
        timeSignature,
        bar // номер такта для вариативности
      );
      // Добавляем номер такта к каждой ноте
      barLick.notes.forEach(note => {
        allNotes.push({
          ...note,
          bar: bar,
          chord: chords[bar % chords.length]
        });
      });
    }
    
    setLick({
      ...(lick || {}),
      notes: allNotes,
      name: `${keyNote} ${mode} Solo (4 bars)`
    } as Lick);
    
    setIsGenerating(false);
  };

  // Воспроизведение соло
  const playSolo = () => {
    if (!lick || isPlaying) return;
    setIsPlaying(true);
    setCurrentStep(0);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
      
      let startTime = ctx.currentTime + 0.1;
      const quarterDuration = 60 / (bpm || 120);
      const notes = lick.notes;
      
      // Сначала играем аккорды
      if (playMode === 'chords' || playMode === 'both') {
        chordProgression.forEach((chord, bar) => {
          setTimeout(() => {
            playChordByName(chord);
          }, bar * 2000);
        });
      }
      
      // Затем играем соло
      if (playMode === 'solo' || playMode === 'both') {
        notes.forEach((note, index) => {
          if (note.isRest) {
            const restDuration = quarterDuration * 0.5;
            startTime += restDuration;
            return;
          }

          const fretValue = note.fret ?? 0;
          const freq = OPEN_FREQS[note.string] * Math.pow(2, fretValue / 12);
          
          const durationMap: Record<string, number> = {
            'whole': 4,
            'half': 2,
            'quarter': 1,
            'eighth': 0.5,
            'sixteenth': 0.25,
            'dotted_eighth': 0.75
          };
          const noteDuration = quarterDuration * (durationMap[note.duration] || 0.5);
          const actualDuration = noteDuration * (note.durationFactor || 0.9);

          setTimeout(() => {
            setCurrentStep(index);
          }, (startTime - ctx.currentTime) * 1000);

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = note.technique === 'bend' ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + actualDuration);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + actualDuration + 0.1);
          
          startTime += actualDuration;
        });
      }
      
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentStep(-1);
      }, (startTime - ctx.currentTime) * 1000 + 500);
      
    } catch (e) {
      console.error("Audio Synthesis Failed:", e);
      setIsPlaying(false);
    }
  };

  // Остановка воспроизведения
  const stopPlay = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    setIsPlaying(false);
    setCurrentStep(-1);
  };

  // Рендер тактов и нот
  const renderBars = () => {
    if (!lick) return null;
    
    const notes = lick.notes;
    const barCount = 4;
    const stringSpacing = 20;
    const startY = 60;
    const barWidth = 180;
    const noteSpacing = 25;
    const startX = 40;
    
    return (
      <div style={{ 
        background: 'var(--bg-primary)', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflowX: 'auto',
        marginBottom: '16px'
      }}>
        {/* Заголовок с аккордами */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '12px',
          paddingLeft: '40px',
          gap: '8px'
        }}>
          {chordProgression.map((chord, idx) => (
            <div key={idx} style={{ 
              width: barWidth,
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 800,
              color: idx === selectedBar ? 'var(--accent)' : 'var(--text-secondary)',
              padding: '4px 0',
              borderBottom: idx === selectedBar ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedBar(idx)}
            >
              {chord}
            </div>
          ))}
        </div>
        
        {/* SVG с нотами */}
        <svg viewBox={`0 0 ${barCount * barWidth + 80} 200`} style={{ width: '100%', minWidth: '500px', height: '180px', display: 'block' }}>
          {/* Струны */}
          {[0, 1, 2, 3, 4, 5].map((strIndex) => (
            <line 
              key={`str-${strIndex}`}
              x1="30" y1={startY + strIndex * stringSpacing} 
              x2={barCount * barWidth + 50} y2={startY + strIndex * stringSpacing} 
              stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
            />
          ))}
          
          {/* Названия струн */}
          {['e', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
            <text key={`tune-${i}`} x="15" y={startY + i * stringSpacing + 4} fill="var(--text-muted)" fontSize="10" fontWeight="800" fontFamily="monospace" textAnchor="middle">
              {note}
            </text>
          ))}
          
          {/* Вертикальные линии тактов */}
          {[0, 1, 2, 3, 4].map((bar) => (
            <line 
              key={`barline-${bar}`}
              x1={startX + bar * barWidth} 
              y1={startY - 10} 
              x2={startX + bar * barWidth} 
              y2={startY + 5 * stringSpacing + 10}
              stroke={bar === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}
              strokeWidth={bar === 0 ? '2' : '1'}
              strokeDasharray={bar === 0 ? 'none' : '4,4'}
            />
          ))}
          
          {/* Ноты */}
          {notes.map((note, index) => {
            const bar = note.bar || 0;
            const barOffset = bar * barWidth;
            const noteIndex = notes.filter(n => n.bar === bar).indexOf(note);
            const x = startX + barOffset + 30 + noteIndex * noteSpacing;
            const y = startY + note.string * stringSpacing;
            const isActive = currentStep === index;
            
            return (
              <g key={`note-${index}`} opacity={isActive ? 1 : 0.7}>
                {/* Активная подсветка */}
                {isActive && (
                  <circle cx={x} cy={y} r="14" fill="var(--accent)" opacity="0.3" />
                )}
                
                {/* Фон для ноты */}
                <rect x={x - 8} y={y - 8} width="16" height="16" fill="#111216" rx="2" />
                
                {/* Цифра лада */}
                <text 
                  x={x} y={y + 4} 
                  fill={isActive ? 'var(--accent)' : 'var(--text-primary)'} 
                  fontSize={isActive ? "14" : "11"} 
                  fontWeight={isActive ? 900 : 700} 
                  fontFamily="monospace" 
                  textAnchor="middle"
                >
                  {note.fret}
                </text>
                
                {/* Индикатор техники */}
                {note.technique && note.technique !== 'none' && (
                  <text x={x} y={y - 14} fill="var(--accent)" fontSize="8" fontWeight="800" textAnchor="middle">
                    {note.technique === 'hammer' ? 'H' : 
                     note.technique === 'pull' ? 'P' : 
                     note.technique === 'slide' ? 'sl' : 
                     note.technique === 'bend' ? 'b' : 
                     note.technique === 'vibrato' ? '~' : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Эффект при изменении тональности/лада
  useEffect(() => {
    generateSolo();
  }, [keyNote, mode, bpm]);

  // Первичная генерация
  useEffect(() => {
    generateSolo();
  }, []);

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      borderRadius: 'var(--radius)', 
      border: '1px solid var(--border-color)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    }}>
      
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        background: 'var(--bg-primary)', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🎸</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
              AI Solo Generator & Transcription
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              {keyNote} {mode} · {bpm} BPM · {timeSignature.beats}/{timeSignature.noteValue}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Выбор тональности */}
          <select 
            value={keyNote}
            onChange={(e) => setKeyNote(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {availableKeys.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          
          {/* Выбор лада */}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {availableModes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          
          {/* Кнопка Regenerate */}
          <button
            onClick={generateSolo}
            disabled={isGenerating}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: isGenerating ? 'default' : 'pointer',
              transition: '0.2s',
              opacity: isGenerating ? 0.5 : 1
            }}
          >
            {isGenerating ? '⏳ Generating...' : '🎲 Generate'}
          </button>
        </div>
      </div>
      
      {/* Основное содержимое */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px',
        background: 'var(--bg-root)'
      }}>
        {/* Такты и аккорды */}
        {renderBars()}
        
        {/* Советы */}
        <div style={{
          background: 'rgba(255,184,0,0.05)',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid rgba(255,184,0,0.15)',
          marginTop: '8px'
        }}>
          <div style={{ fontSize: '12px', color: '#ffb800', marginBottom: '4px' }}>
            💡 Советы по импровизации
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            • Играй по аккордам — каждая нота должна попадать в гармонию
            • Используй хаммеры и слайды для связности
            • Завершай фразы на тонике или терции
            • Экспериментируй с ритмическими акцентами
          </div>
        </div>
      </div>
      
      {/* Нижняя панель управления */}
      <div style={{
        padding: '12px 24px',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Кнопки Play/Stop */}
          <button
            onClick={isPlaying ? stopPlay : playSolo}
            disabled={!lick || isGenerating}
            style={{
              background: isPlaying ? 'var(--accent-danger, #ff4444)' : 'var(--accent)',
              color: '#000',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: (!lick || isGenerating) ? 'default' : 'pointer',
              transition: '0.2s',
              opacity: (!lick || isGenerating) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isPlaying ? '⏹ Stop' : '▶ Play Solo'}
          </button>
          
          {/* Режим воспроизведения */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '6px' }}>
            {['both', 'chords', 'solo'].map((mode) => (
              <button
                key={mode}
                onClick={() => setPlayMode(mode as any)}
                style={{
                  background: playMode === mode ? 'var(--accent)' : 'transparent',
                  color: playMode === mode ? '#000' : 'var(--text-muted)',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {mode === 'both' ? '🎵 Все' : mode === 'chords' ? '🎸 Аккорды' : '🎶 Соло'}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {lick ? `${lick.notes.length} нот · 4 такта` : 'Сгенерируйте соло'}
        </div>
      </div>
      
      {/* Кнопка закрытия (опционально) */}
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SoloGenerator;
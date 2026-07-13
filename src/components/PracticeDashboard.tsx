// src/components/PracticeDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { playChordByName, playScale } from '../utils/audioEngine';
import {
  PRACTICE_PLANS,
  getNextExercise,
  getUserProgress,
  updateProgress,
  type Exercise,
  type UserProgress,
  type PracticePlan
} from '../data/practice_module';
import ChordDictionaryModal from './tools/ChordDictionaryModal';

const PracticeDashboard: React.FC = () => {
  const { getScaleNotes, bpm } = useMusic(); // 🔥 Убраны keyNote, mode, timeSignature
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('fretlab_practice_progress');
    return saved ? JSON.parse(saved) : getUserProgress();
  });
  const [currentPlan, setCurrentPlan] = useState<PracticePlan>(PRACTICE_PLANS[0]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [showChordModal, setShowChordModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('fretlab_practice_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsPracticing(true);
  };

  const handleCompleteExercise = () => {
    if (!selectedExercise) return;
    
    const updated = updateProgress(userProgress, selectedExercise.id);
    setUserProgress(updated);
    setSelectedExercise(null);
    setIsPracticing(false);
  };

  const playChordAudio = (chordName: string) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    playChordByName(chordName);
    setTimeout(() => setIsPlayingAudio(false), 2500);
  };

  // 🔥 ВОСПРОИЗВЕДЕНИЕ ТАБА
  const playTabAudio = (tabData: any) => {
    if (isPlayingAudio || !tabData) return;
    setIsPlayingAudio(true);
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
      
      let startTime = ctx.currentTime + 0.1;
      const quarterDuration = 60 / (bpm || 120);
      
      tabData.notes.forEach((note: any) => {
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
        const actualDuration = noteDuration * 0.9;
        
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
      
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, (startTime - ctx.currentTime) * 1000 + 500);
    } catch (e) {
      console.error("Audio Synthesis Failed:", e);
      setIsPlayingAudio(false);
    }
  };

  // 🔥 ВОСПРОИЗВЕДЕНИЕ ПРИМЕРА ИЗ УРОКА
  const playExerciseAudio = (exercise: Exercise) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    
    // Если есть табы — играем их
    if (exercise.tabData) {
      playTabAudio(exercise.tabData);
      return;
    }
    
    // Если есть аккорды — играем их по очереди
    if (exercise.chords && exercise.chords.length > 0) {
      exercise.chords.forEach((chord, index) => {
        setTimeout(() => {
          playChordByName(chord);
        }, index * 2000);
      });
      setTimeout(() => setIsPlayingAudio(false), exercise.chords.length * 2000 + 500);
      return;
    }
    
    // Если это гамма — играем гамму
    if (exercise.category === 'scales') {
      const scale = getScaleNotes();
      if (scale.length > 0) {
        const notes = scale.map(n => n + '4');
        playScale(notes, 150);
      }
      setTimeout(() => setIsPlayingAudio(false), 3000);
      return;
    }
    
    // Если ничего не подошло — играем аккорд тоники
    const scale = getScaleNotes();
    if (scale.length > 0) {
      playChordByName(scale[0] + 'maj');
    }
    setTimeout(() => setIsPlayingAudio(false), 2500);
  };

  const getSkillLevel = (skill: keyof UserProgress['skillLevels']) => {
    return userProgress.skillLevels[skill] || 0;
  };

  const getSkillColor = (value: number) => {
    if (value >= 80) return 'var(--accent)';
    if (value >= 50) return '#ffb800';
    return '#ff6b6b';
  };

  const renderSkillBar = (skill: keyof UserProgress['skillLevels'], label: string) => {
    const value = getSkillLevel(skill);
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ color: getSkillColor(value), fontWeight: 800 }}>{value}%</span>
        </div>
        <div style={{ 
          height: '4px', 
          background: 'var(--bg-secondary)', 
          borderRadius: '2px', 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            width: `${value}%`, 
            height: '100%', 
            background: getSkillColor(value),
            borderRadius: '2px',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>
    );
  };

  const nextExercise = getNextExercise(userProgress, currentPlan);

  // ============================================================
  // 🔥 РЕНДЕР АККОРДОВ
  // ============================================================
  const renderChords = (exercise: Exercise) => {
    if (!exercise.chords || exercise.chords.length === 0) return null;
    
    return (
      <div style={{ 
        background: 'var(--bg-primary)', 
        padding: '16px 20px', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          🎸 Аккорды в уроке — нажми для просмотра аппликатуры
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {exercise.chords.map((chord, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedChord(chord);
                setShowChordModal(true);
                playChordAudio(chord);
              }}
              style={{
                background: 'var(--bg-secondary)',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--accent)',
                fontFamily: 'monospace',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: '0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🎵 {chord}
            </button>
          ))}
        </div>
        <button
          onClick={() => playExerciseAudio(exercise)}
          disabled={isPlayingAudio}
          style={{
            marginTop: '12px',
            background: isPlayingAudio ? 'var(--bg-secondary)' : 'rgba(0,184,255,0.15)',
            color: isPlayingAudio ? 'var(--text-muted)' : 'var(--accent-blue)',
            border: '1px solid rgba(0,184,255,0.2)',
            padding: '8px 20px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: isPlayingAudio ? 'default' : 'pointer',
            transition: '0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={e => {
            if (!isPlayingAudio) {
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={e => {
            if (!isPlayingAudio) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isPlayingAudio ? '🔊 PLAYING...' : '▶ Play All Chords'}
        </button>
      </div>
    );
  };

  // ============================================================
  // 🔥 РЕНДЕР ТАБОВ
  // ============================================================
  const renderTab = (exercise: Exercise) => {
    if (!exercise.tabData) return null;
    
    const tabNotes = exercise.tabData.notes || [];
    const stringSpacing = 20;
    const startY = 30;
    const noteSpacing = 60;
    const startX = 40;
    
    return (
      <div style={{ 
        background: 'var(--bg-primary)', 
        padding: '16px 20px', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '16px',
        overflowX: 'auto'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          🎼 Табулатура — нажми Play для прослушивания
        </div>
        
        <svg viewBox={`0 0 ${Math.max(400, tabNotes.length * noteSpacing + 100)} 160`} style={{ width: '100%', minWidth: '350px', height: '140px', display: 'block' }}>
          {/* Струны */}
          {[0, 1, 2, 3, 4, 5].map((strIndex) => (
            <line 
              key={`str-${strIndex}`}
              x1="30" y1={startY + strIndex * stringSpacing} 
              x2={Math.max(380, tabNotes.length * noteSpacing + 60)} y2={startY + strIndex * stringSpacing} 
              stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
            />
          ))}
          
          {/* Названия струн */}
          {['e', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
            <text key={`tune-${i}`} x="15" y={startY + i * stringSpacing + 4} fill="var(--text-muted)" fontSize="10" fontWeight="800" fontFamily="monospace" textAnchor="middle">
              {note}
            </text>
          ))}
          
          {/* Ноты */}
          {tabNotes.map((note, index) => {
            const x = startX + index * noteSpacing;
            const y = startY + note.string * stringSpacing;
            //const isActive = false; // для статического отображения
            
            return (
              <g key={`note-${index}`}>
                {/* Фон для ноты */}
                <rect x={x - 10} y={y - 10} width="20" height="20" fill="#111216" rx="3" />
                
                {/* Цифра лада */}
                <text 
                  x={x} y={y + 4} 
                  fill={note.technique === 'bend' || note.technique === 'vibrato' ? 'var(--accent)' : 'var(--text-primary)'} 
                  fontSize="13" 
                  fontWeight={note.technique === 'bend' ? 900 : 700} 
                  fontFamily="monospace" 
                  textAnchor="middle"
                >
                  {note.fret}
                </text>
                
                {/* Индикатор техники */}
                {note.technique === 'hammer' && (
                  <text x={x} y={y - 16} fill="var(--accent)" fontSize="9" fontWeight="800" textAnchor="middle">H</text>
                )}
                {note.technique === 'pull' && (
                  <text x={x} y={y - 16} fill="var(--accent)" fontSize="9" fontWeight="800" textAnchor="middle">P</text>
                )}
                {note.technique === 'slide' && (
                  <text x={x} y={y - 16} fill="var(--accent)" fontSize="9" fontWeight="800" textAnchor="middle">sl</text>
                )}
                {note.technique === 'bend' && (
                  <text x={x} y={y - 16} fill="var(--accent)" fontSize="9" fontWeight="800" textAnchor="middle">b</text>
                )}
              </g>
            );
          })}
        </svg>
        
        <button
          onClick={() => playExerciseAudio(exercise)}
          disabled={isPlayingAudio}
          style={{
            marginTop: '12px',
            background: isPlayingAudio ? 'var(--bg-secondary)' : 'rgba(0,184,255,0.15)',
            color: isPlayingAudio ? 'var(--text-muted)' : 'var(--accent-blue)',
            border: '1px solid rgba(0,184,255,0.2)',
            padding: '8px 20px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: isPlayingAudio ? 'default' : 'pointer',
            transition: '0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={e => {
            if (!isPlayingAudio) {
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={e => {
            if (!isPlayingAudio) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isPlayingAudio ? '🔊 PLAYING...' : '▶ Play Tab'}
        </button>
      </div>
    );
  };

  // ============================================================
  // 🔥 РЕНДЕР КОНТЕНТА УРОКА
  // ============================================================
  const renderExerciseContent = (exercise: Exercise) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Описание */}
        <div style={{ 
          background: 'var(--bg-primary)', 
          padding: '16px 20px', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            📝 Описание
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {exercise.description}
          </div>
        </div>

        {/* 🎯 Цель */}
        <div style={{ 
          background: 'rgba(0,255,157,0.05)', 
          padding: '12px 16px', 
          borderRadius: '8px',
          border: '1px solid rgba(0,255,157,0.15)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '4px' }}>
            🎯 Цель
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
            {exercise.goal}
          </div>
        </div>

        {/* 📖 Теория */}
        {exercise.theory && (
          <div style={{ 
            background: 'var(--bg-primary)', 
            padding: '16px 20px', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              📖 Теория
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {exercise.theory}
            </div>
          </div>
        )}

        {/* 🖐️ Постановка пальцев */}
        {exercise.fingerPosition && (
          <div style={{ 
            background: 'var(--bg-primary)', 
            padding: '16px 20px', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              🖐️ Постановка пальцев
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {exercise.fingerPosition}
            </div>
          </div>
        )}

        {/* 💡 Советы */}
        {exercise.tips && exercise.tips.length > 0 && (
          <div style={{ 
            background: 'rgba(255,184,0,0.05)', 
            padding: '16px 20px', 
            borderRadius: '8px',
            border: '1px solid rgba(255,184,0,0.15)'
          }}>
            <div style={{ fontSize: '12px', color: '#ffb800', marginBottom: '8px' }}>
              💡 Советы
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.8' }}>
              {exercise.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 📋 Практические шаги */}
        {exercise.practiceSteps && exercise.practiceSteps.length > 0 && (
          <div style={{ 
            background: 'var(--bg-primary)', 
            padding: '16px 20px', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              📋 Практические шаги
            </div>
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.8' }}>
              {exercise.practiceSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 🔥 АККОРДЫ или ТАБЫ (в зависимости от урока) */}
        {exercise.displayType === 'chords' && renderChords(exercise)}
        {exercise.displayType === 'tab' && renderTab(exercise)}
        {!exercise.displayType && exercise.chords && exercise.chords.length > 0 && renderChords(exercise)}
        {!exercise.displayType && exercise.tabData && renderTab(exercise)}

      </div>
    );
  };

  return (
    <div style={{ 
      background: 'var(--bg-root)', 
      height: '100%', 
      overflowY: 'auto', 
      padding: '32px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      
      {/* ===== ЗАГОЛОВОК ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
            🏋️ Practice Module
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Your personal guitar training system
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ 
            background: 'var(--bg-panel)', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '13px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            🔥 Streak: {userProgress.practiceStreak} days
          </span>
          <span style={{ 
            background: 'var(--bg-panel)', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '13px',
            color: 'var(--accent)',
            border: '1px solid var(--accent)'
          }}>
            Level: {userProgress.currentLevel}
          </span>
        </div>
      </div>

      {/* ===== СТАТУС БАР ===== */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '16px',
        background: 'var(--bg-panel)',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Completed Exercises
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
            {userProgress.completedExercises.length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Plan Progress
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
            {currentPlan.exercises.length > 0 ? Math.round((userProgress.completedExercises.length / currentPlan.exercises.length) * 100) : 0}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Current Focus
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
            {currentPlan.name}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Practice Time
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {userProgress.completedExercises.length * 15} min ⏱️
          </div>
        </div>
      </div>

      {/* ===== СЛЕДУЮЩЕЕ УПРАЖНЕНИЕ ===== */}
      {nextExercise && (
        <div style={{ 
          background: 'var(--bg-panel)', 
          padding: '24px', 
          borderRadius: '12px', 
          border: '2px solid var(--accent)',
          boxShadow: '0 0 30px rgba(0,255,157,0.05)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
            ⏳ Next Exercise
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {nextExercise.title}
              </h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                {nextExercise.description}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                  padding: '2px 10px',
                  borderRadius: '12px'
                }}>
                  ⏱️ {nextExercise.estimatedTime}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--accent)',
                  background: 'rgba(0,255,157,0.1)',
                  padding: '2px 10px',
                  borderRadius: '12px'
                }}>
                  {nextExercise.difficulty}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                  padding: '2px 10px',
                  borderRadius: '12px'
                }}>
                  🏷️ {nextExercise.tags.join(', ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleStartExercise(nextExercise)}
              style={{
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 0 20px rgba(0,255,157,0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(0,255,157,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,157,0.2)';
              }}
            >
              ▶ Start Practice
            </button>
          </div>
        </div>
      )}

      {/* ===== ВСЕ УПРАЖНЕНИЯ ===== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            📋 All Exercises
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['beginner', 'intermediate', 'advanced', 'pro'].map((level: string) => (
              <button
                key={level}
                onClick={() => {
                  const plan = PRACTICE_PLANS.find((p: PracticePlan) => p.level === level);
                  if (plan) setCurrentPlan(plan);
                }}
                style={{
                  background: currentPlan.level === level ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: currentPlan.level === level ? '#000' : 'var(--text-muted)',
                  border: 'none',
                  padding: '4px 14px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {currentPlan.exercises.map((exercise: Exercise) => {
            const isCompleted = userProgress.completedExercises.includes(exercise.id);
            
            return (
              <div
                key={exercise.id}
                style={{
                  background: isCompleted ? 'var(--bg-primary)' : 'var(--bg-panel)',
                  border: `1px solid ${isCompleted ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  transition: '0.2s',
                  opacity: isCompleted ? 0.7 : 1,
                  cursor: 'pointer'
                }}
                onClick={() => handleStartExercise(exercise)}
                onMouseEnter={e => {
                  if (!isCompleted) {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isCompleted) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {exercise.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {exercise.description}
                    </div>
                  </div>
                  {isCompleted && (
                    <span style={{ fontSize: '18px' }}>✅</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '2px 10px',
                    borderRadius: '10px'
                  }}>
                    ⏱️ {exercise.estimatedTime}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '2px 10px',
                    borderRadius: '10px'
                  }}>
                    {exercise.difficulty}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '2px 10px',
                    borderRadius: '10px'
                  }}>
                    {exercise.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== НАВЫКИ ===== */}
      <div style={{ 
        background: 'var(--bg-panel)', 
        padding: '24px', 
        borderRadius: '12px', 
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
          📊 Skill Levels
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {renderSkillBar('chords', 'Chords')}
          {renderSkillBar('scales', 'Scales')}
          {renderSkillBar('rhythm', 'Rhythm')}
          {renderSkillBar('technique', 'Technique')}
          {renderSkillBar('improvisation', 'Improvisation')}
          {renderSkillBar('ear_training', 'Ear Training')}
        </div>
      </div>

      {/* ===== МОДАЛКА ПРАКТИКИ ===== */}
      {isPracticing && selectedExercise && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: 'var(--bg-panel)',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  🎯 Now Practicing
                </div>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {selectedExercise.title}
                </h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    color: 'var(--accent)',
                    background: 'rgba(0,255,157,0.1)',
                    padding: '2px 10px',
                    borderRadius: '10px'
                  }}>
                    {selectedExercise.difficulty}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '2px 10px',
                    borderRadius: '10px'
                  }}>
                    ⏱️ {selectedExercise.estimatedTime}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedExercise(null);
                  setIsPracticing(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  transition: '0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ✕
              </button>
            </div>

            {/* 🔥 КОНТЕНТ УРОКА С АККОРДАМИ/ТАБАМИ */}
            {renderExerciseContent(selectedExercise)}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button
                onClick={handleCompleteExercise}
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                ✅ Mark as Complete
              </button>
              <button
                onClick={() => {
                  setSelectedExercise(null);
                  setIsPracticing(false);
                }}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== МОДАЛКА АККОРДА ===== */}
      {showChordModal && selectedChord && (
        <ChordDictionaryModal
          chord={selectedChord}
          onClose={() => {
            setShowChordModal(false);
            setSelectedChord(null);
          }}
        />
      )}

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default PracticeDashboard;
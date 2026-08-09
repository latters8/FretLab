// src/components/tools/EarTrainer.tsx
//
// Интерактивная тренировка слуха + микро-лупер (Ditto-style playback).
//
// Режимы:
//   single      — 1 случайная нота в диапазоне E2–E4
//   tone-change — 2–4 ноты со случайными интервальными скачками
//   lick        — короткая музыкальная фраза из 5–10 нот в тональности
//
// Игровой цикл: Generate & Listen -> Record Answer -> Analyze -> Evaluate.
// Feedback Engine: подсказки по строю (cents) и по теории (интервалы).

import React, { useState, useCallback } from 'react';
import * as Tone from 'tone';
import { audioManager } from '../../services/AudioManager';
import { useEarTrainingAudio } from '../../hooks/useEarTrainingAudio';
import type { DetectedNote } from '../../hooks/useEarTrainingAudio';
import { useMusicTheory } from '../../context/MusicContext';
import { useTranslation } from '../../context/LocaleContext';
import type { LocaleDict } from '../../locales/ru';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';
import ChordDictionaryModal from './ChordDictionaryModal';

// ============================================================
// ТИПЫ
// ============================================================

export type TrainingMode = 'single' | 'tone-change' | 'lick' | 'chord';

export interface TargetChord {
  name: string;          // напр. "Am7"
  voicing: Voicing;      // аппликатура
  notes: string[];       // ноты аккорда (без октав)
}

export interface TargetNote {
  note: string;   // имя, напр. "E"
  octave: number; // напр. 4
  duration: string; // Tone duration, напр. "4n"
}

export interface Feedback {
  hit: boolean;
  cents: number; // отклонение распознанной ноты
  targetLabel: string;
  playedLabel: string | null;
}

// ============================================================
// КОНСТАНТЫ
// ============================================================

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Диапазон для single / tone-change: E2 (82.4 Гц) — E4 (329.6 Гц)
const LOW_FREQ = 82.4;
const HIGH_FREQ = 329.6;

// Полный список нот с октавами в диапазоне E2..E4
const NOTE_POOL: { note: string; octave: number; freq: number }[] = [];
{
  const octaves = [2, 3, 4];
  for (const oct of octaves) {
    for (const n of ALL_NOTES) {
      const idx = ALL_NOTES.indexOf(n) + 12 * (oct + 1);
      const freq = 440 * Math.pow(2, (idx - 69) / 12);
      if (freq >= LOW_FREQ && freq <= HIGH_FREQ) {
        NOTE_POOL.push({ note: n, octave: oct, freq });
      }
    }
  }
}

const randBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ============================================================
// ГЕНЕРАЦИЯ ЦЕЛЕВЫХ НОТ
// ============================================================

function noteLabel(n: string, o: number): string {
  return `${n}${o}`;
}

function generateSingle(): TargetNote[] {
  const picked = pickRandom(NOTE_POOL);
  return [{ note: picked.note, octave: picked.octave, duration: '4n' }];
}

function generateToneChange(): TargetNote[] {
  const count = randBetween(2, 4);
  const notes: TargetNote[] = [];
  let current = pickRandom(NOTE_POOL);
  notes.push({ note: current.note, octave: current.octave, duration: '4n' });

  for (let i = 1; i < count; i++) {
    // Интервальный скачок: полутоны от 2 до 12 в любую сторону
    const semitones = Math.random() > 0.5 ? randBetween(2, 12) : -randBetween(2, 12);
    const currentIdx = ALL_NOTES.indexOf(current.note) + 12 * (current.octave + 1);
    const nextIdx = currentIdx + semitones;
    const nextFreq = 440 * Math.pow(2, (nextIdx - 69) / 12);

    // Ограничиваем в диапазоне
    const clampedFreq = Math.max(LOW_FREQ, Math.min(HIGH_FREQ, nextFreq));
    const clampedIdx = Math.round(69 + 12 * Math.log2(clampedFreq / 440));
    const noteName = ALL_NOTES[((clampedIdx % 12) + 12) % 12];
    const octave = Math.floor(clampedIdx / 12) - 1;

notes.push({ note: noteName, octave, duration: '4n' });
    current = { note: noteName, octave, freq: clampedFreq };
  }

  return notes;
}

function generateLick(scaleNotes: string[]): TargetNote[] {
  const safeScale = scaleNotes.length > 0 ? scaleNotes : ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'];
  const count = randBetween(5, 10);
  const notes: TargetNote[] = [];
  // Стартуем в зоне 3-й октавы (близко к E3)
  let activeOctave = 3;
  let lastIdxInScale = Math.floor(safeScale.length / 2);

  for (let i = 0; i < count; i++) {
    // Мелодический шаг: -3..+3 (в пределах гаммы), иногда крупный скачок
    const step = Math.random() > 0.75 ? randBetween(-4, 4) : randBetween(-2, 2);
    lastIdxInScale = (lastIdxInScale + step + safeScale.length) % safeScale.length;
    const noteName = safeScale[lastIdxInScale];

    // Октава: держимся в 2..4, иногда перескакиваем
    if (Math.random() > 0.85) {
      activeOctave = Math.max(2, Math.min(4, activeOctave + (Math.random() > 0.5 ? 1 : -1)));
    }

    notes.push({
      note: noteName,
      octave: activeOctave,
      duration: i === count - 1 ? '2n' : pickRandom(['8n', '8n.', '4n']),
    });
  }

  return notes;
}

// ============================================================
// АККОРДОВАЯ ВИКТОРИНА (Quiz)
// ============================================================

// OPEN_FREQS для струн стандартного строя (E2, A2, D3, G3, B3, E4)
const OPEN_STANDARD_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

// Извлекает имена нот (без октав) из аппликатуры аккорда
function voicingNotes(_chordName: string, voicing: Voicing): string[] {
  const unique = new Set<string>();
  voicing.frets.forEach((fret, i) => {
    if (fret === 'x') return;
    const openFreq = OPEN_STANDARD_FREQS[i];
    const freq = openFreq * Math.pow(2, Number(fret) / 12);
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const noteName = ALL_NOTES[((midi % 12) + 12) % 12];
    unique.add(noteName);
  });
  return Array.from(unique);
}

// Ленивый пул аккордов: строится только при первом запуске викторины и
// обёрнут в try/catch, чтобы модуль не падал при загрузке приложения.
let CHORD_POOL: TargetChord[] | null = null;
function getChordPool(): TargetChord[] {
  if (CHORD_POOL) return CHORD_POOL;
  CHORD_POOL = [];
  try {
    const names = [
      'C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'F',
      'Bm', 'C7', 'G7', 'D7', 'A7', 'E7', 'Cmaj7', 'Am7', 'Dm7', 'Em7', 'G7',
    ];
    for (const name of names) {
      const voicings = CHORD_DB[name] ? CHORD_DB[name] : generateFallbackVoicing(name);
      if (!voicings || voicings.length === 0) continue;
      const v = voicings[0];
      CHORD_POOL.push({ name, voicing: v, notes: voicingNotes(name, v) });
    }
  } catch (err) {
    console.warn('⚠️ Chord quiz pool build failed:', err);
    CHORD_POOL = [
      { name: 'C', voicing: CHORD_DB['C'][0], notes: ['C', 'E', 'G'] },
      { name: 'Am', voicing: CHORD_DB['Am'][0], notes: ['A', 'C', 'E'] },
      { name: 'E', voicing: CHORD_DB['E'][0], notes: ['E', 'G#', 'B'] },
      { name: 'G', voicing: CHORD_DB['G'][0], notes: ['G', 'B', 'D'] },
    ];
  }
  return CHORD_POOL;
}

// Выбирает случайный аккорд
function generateRandomChord(): TargetChord {
  return pickRandom(getChordPool());
}

// Перемешивает массив (Fisher–Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Строит 3 отвлекающих варианта (не совпадающих с правильным)
// и перемешивает их, чтобы правильный аккорд стоял в случайном месте.
function generateChordOptions(correct: TargetChord): string[] {
  const pool = getChordPool();
  const options = new Set<string>([correct.name]);
  let guard = 0;
  while (options.size < 4 && guard < 100) {
    guard++;
    const candidate = pickRandom(pool).name;
    if (candidate !== correct.name) options.add(candidate);
  }
  return shuffle(Array.from(options));
}

// Играет аккорд (все струны с небольшой задержкой, как в ChordDictionary)
function playChordThroughAudioManager(chord: TargetChord, start: number) {
  let delay = 0;
  chord.voicing.frets.forEach((fret, i) => {
    if (fret === 'x') return;
    const openFreq = OPEN_STANDARD_FREQS[i];
    const freq = openFreq * Math.pow(2, Number(fret) / 12);
    audioManager.playGuitarNote(freq, 1.2, start + delay, 0.8);
    delay += 0.05;
  });
}

// Главная функция генерации
export function generateTargetNotes(mode: TrainingMode, keyNote: string, scale: string[]): TargetNote[] {
  switch (mode) {
    case 'single':
      return generateSingle();
    case 'tone-change':
      return generateToneChange();
    case 'lick':
      return generateLick(scale);
    default:
      return generateSingle();
  }
}

// ============================================================
// ОЦЕНКА И ФИДБЕК
// ============================================================

// Вспомогательный replace для плейсхолдеров вида {name}
function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

// Сравнение массива сыгранных нот с целевым
export function evaluatePerformance(
  targetNotes: TargetNote[],
  playedNotes: DetectedNote[],
  t?: LocaleDict
): { result: Feedback[]; score: number; tuningTips: string[]; theoryTips: string[] } {
  // Локаль по умолчанию — русский (fallback), если t не передан
  const et = t?.earTrainer ?? {
    tuningSharp: 'Кажется, гитара немного расстроена. Проверьте строй (завышает на {cents} центов).',
    tuningFlat: 'Кажется, гитара немного расстроена. Проверьте строй (низит на {cents} центов).',
    tuningFloat: 'Интонация плавает в среднем на {cents} центов — подтяни строй, особенно на высоких ладах.',
    tuningOk: 'Строй в порядке — попадаешь в ноты точно (в пределах ±10 центов).',
    theoryMinorThirdToFourth: 'Вместо терции ({third}) сыграна кварта ({fourth}). Кварта звучит напряжённее — попробуй услышать малую терцию чуть ниже.',
    theoryThirdToFourth: 'Вместо большой терции ({third}) сыграна кварта ({fourth}). Опусти ноту на полтона.',
    theoryFourthToThird: 'Вместо кварты ({fourth}) сыграна терция ({third}). Кварта — выше на полтона.',
    intMinorSecond: 'малая секунда', intMajorSecond: 'большая секунда', intMinorThird: 'малая терция',
    intMajorThird: 'большая терция', intFourth: 'кварта', intTritone: 'увеличенная кварта', intFifth: 'квинта',
    intMinorSixth: 'малая секста', intMajorSixth: 'большая секста', intMinorSeventh: 'малая септима',
    intMajorSeventh: 'большая септима', intOctave: 'октава', semitones: '{count} полутонов',
  };
  const result: Feedback[] = [];
  const tuningTips: string[] = [];
  const theoryTips: string[] = [];

  const targetPool: string[] = targetNotes.map((t) => noteLabel(t.note, t.octave));
  const playedPool: { label: string; cents: number }[] = playedNotes.map((p) => ({
    label: noteLabel(p.note, p.octave),
    cents: p.cents,
  }));

  let hits = 0;

  // Для каждой целевой ноты ищем лучшее совпадение среди сыгранных
  const used = new Array(playedPool.length).fill(false);
  for (const target of targetPool) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < playedPool.length; i++) {
      if (used[i]) continue;
      const dist = noteDistance(target, playedPool[i].label);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1 && bestDist <= 1) {
      used[bestIdx] = true;
      hits++;
      const cents = playedPool[bestIdx].cents;
      result.push({ hit: true, cents, targetLabel: target, playedLabel: playedPool[bestIdx].label });
    } else {
      result.push({ hit: false, cents: 0, targetLabel: target, playedLabel: bestIdx !== -1 ? playedPool[bestIdx].label : null });
    }
  }

  const score = targetPool.length ? Math.round((hits / targetPool.length) * 100) : 0;

  // --- Подсказки по строю (cents) ---
  const absCents = playedNotes.map((p) => Math.abs(p.cents));
  const avgAbsCents = absCents.length ? absCents.reduce((a, b) => a + b, 0) / absCents.length : 0;
  const stableSharp = playedNotes.length > 0 && playedNotes.every((p) => p.cents > 10);
  const stableFlat = playedNotes.length > 0 && playedNotes.every((p) => p.cents < -10);

const et0 = et;
  if (stableSharp && avgAbsCents > 10) {
    tuningTips.push(fmt(et0.tuningSharp, { cents: avgAbsCents.toFixed(0) }));
  } else if (stableFlat && avgAbsCents > 10) {
    tuningTips.push(fmt(et0.tuningFlat, { cents: avgAbsCents.toFixed(0) }));
  } else if (avgAbsCents > 10) {
    tuningTips.push(fmt(et0.tuningFloat, { cents: avgAbsCents.toFixed(0) }));
  } else if (playedNotes.length > 0) {
    tuningTips.push(et0.tuningOk);
  }

  // --- Подсказки по теории (интервалы) ---
  if (targetNotes.length >= 2) {
    // Если в целевом есть терция (3 полутона м/у двумя нотами), а сыграна кварта (5 п/т)
    for (let i = 0; i < targetNotes.length - 1; i++) {
      const a = targetNotes[i];
      const b = targetNotes[i + 1];
      const targetInt = noteDistance(noteLabel(b.note, b.octave), noteLabel(a.note, a.octave));
      const absTarget = Math.abs(targetInt);

      // ищем соответствующую пару сыгранных
      if (i < playedNotes.length - 1) {
        const pa = playedNotes[i];
        const pb = playedNotes[i + 1];
        const playedInt = noteDistance(noteLabel(pb.note, pb.octave), noteLabel(pa.note, pa.octave));
        const absPlayed = Math.abs(playedInt);

        const third = labelForInterval(3, et0);
        const fourth = labelForInterval(5, et0);
        const thirdBig = labelForInterval(4, et0);

        if (absTarget === 3 && absPlayed === 5) {
          theoryTips.push(fmt(et0.theoryMinorThirdToFourth, { third, fourth }));
        } else if (absTarget === 4 && absPlayed === 5) {
          theoryTips.push(fmt(et0.theoryThirdToFourth, { third: thirdBig, fourth }));
        } else if (absTarget === 5 && absPlayed === 4) {
          theoryTips.push(fmt(et0.theoryFourthToThird, { fourth, third: thirdBig }));
        }
      }
    }
  }

  return { result, score, tuningTips, theoryTips };
}

// Расстояние между нотами в полутонах (без учёта октавы, по модулю)
function noteDistance(a: string, b: string): number {
  const parse = (label: string) => {
    const m = label.match(/^([A-G][#]?)(\d)$/);
    if (!m) return 0;
    return ALL_NOTES.indexOf(m[1]) + 12 * parseInt(m[2], 10);
  };
  return Math.abs(parse(a) - parse(b));
}

// Название интервала из локали (fallback — русский)
function labelForInterval(s: number, et: Record<string, string>): string {
  const keyMap: Record<number, string> = {
    1: 'intMinorSecond',
    2: 'intMajorSecond',
    3: 'intMinorThird',
    4: 'intMajorThird',
    5: 'intFourth',
    6: 'intTritone',
    7: 'intFifth',
    8: 'intMinorSixth',
    9: 'intMajorSixth',
    10: 'intMinorSeventh',
    11: 'intMajorSeventh',
    12: 'intOctave',
  };
  const key = keyMap[s];
  if (key && et[key]) return et[key];
  return fmt(et.semitones, { count: s });
}

// ============================================================
// КОМПОНЕНТ
// ============================================================

const MODE_LABELS: Record<TrainingMode, string> = {
  single: '♩ Single Note',
  'tone-change': '🎶 Tone Change',
  lick: '🎸 Lick',
  chord: '🎹 Chord Quiz',
};

// Цветовые акценты для каждой кнопки режима
const MODE_COLORS: Record<TrainingMode, string> = {
  single: '#ffd700',      // жёлтый
  'tone-change': '#4da3ff', // синий
  lick: '#ff9f43',        // оранжевый
  chord: '#c084fc',       // фиолетовый
};

const EarTrainer: React.FC = () => {
  const { t, locale } = useTranslation();
  const { keyNote, getScaleNotes } = useMusicTheory();
  const {
    isRecording,
    detectedNotes,
    recordedUrl,
    isPlayingBack,
    startRecording,
    stopRecording,
    playTake,
    stopTake,
  } = useEarTrainingAudio();

  const [mode, setMode] = useState<TrainingMode>('single');
  const [targetNotes, setTargetNotes] = useState<TargetNote[]>([]);
  const [targetChord, setTargetChord] = useState<TargetChord | null>(null);
  const [chordOptions, setChordOptions] = useState<string[]>([]);
const [chordAnswer, setChordAnswer] = useState<string | null>(null);
  const [chordCorrect, setChordCorrect] = useState<boolean | null>(null);
  const [quizModalChord, setQuizModalChord] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'recording' | 'done'>('idle');
  const [feedback, setFeedback] = useState<{ result: Feedback[]; score: number; tuningTips: string[]; theoryTips: string[] } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const modeLabel = (m: TrainingMode): string => {
    switch (m) {
      case 'single': return t.earTrainer.single;
      case 'tone-change': return t.earTrainer.toneChange;
      case 'lick': return t.earTrainer.lick;
      case 'chord': return t.earTrainer.chordQuiz;
    }
  };

  // --- Генерация и воспроизведение ---
  const handleGenerate = useCallback(async () => {
    await audioManager.init();
    setFeedback(null);
    setChordAnswer(null);
    setChordCorrect(null);
    const start = Tone.now();

    if (mode === 'chord') {
      const chord = generateRandomChord();
      setTargetChord(chord);
      setChordOptions(generateChordOptions(chord));
      setTargetNotes([]);
      setPhase('listening');
      setIsPlaying(true);
      playChordThroughAudioManager(chord, start);
      setTimeout(() => setIsPlaying(false), 2000);
      return;
    }

    const scale = getScaleNotes();
    const notes = generateTargetNotes(mode, keyNote, scale);
    setTargetNotes(notes);
    setTargetChord(null);
    setPhase('listening');
    setIsPlaying(true);

// Последовательное воспроизведение (тайминг от Tone.now(), чтобы ноты не звучали одновременно)
    let t = 0;
    for (const n of notes) {
      const durSec = n.duration === '2n' ? 1.6 : n.duration === '8n' ? 0.4 : n.duration === '8n.' ? 0.6 : 0.8;
      audioManager.playGuitarNote(noteLabel(n.note, n.octave), durSec, start + t, 0.85);
      t += durSec + 0.15;
    }
    setTimeout(() => setIsPlaying(false), t * 1000 + 100);
  }, [mode, keyNote, getScaleNotes]);

  const handleRecord = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setPhase('done');
    } else {
      setFeedback(null);
      setPhase('recording');
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Выбор варианта в аккордовой викторине
  const handleChordPick = useCallback(
    (name: string) => {
      setChordAnswer(name);
      setChordCorrect(name === targetChord?.name);
    },
    [targetChord]
  );

// Оценка при завершении записи (phase -> done)
  const handleEvaluate = useCallback(() => {
    if (targetNotes.length === 0) return;
    const evalResult = evaluatePerformance(targetNotes, detectedNotes, t);
    setFeedback(evalResult);
  }, [targetNotes, detectedNotes, t]);

  const handlePlayTake = useCallback(() => {
    if (isPlayingBack) stopTake();
    else playTake();
  }, [isPlayingBack, playTake, stopTake]);

  const resetAll = useCallback(() => {
    setTargetNotes([]);
    setTargetChord(null);
    setChordOptions([]);
    setChordAnswer(null);
    setChordCorrect(null);
    setFeedback(null);
    setPhase('idle');
    stopTake();
  }, [stopTake]);

  // ============================================================
  // UI
  // ============================================================
  const panelStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-panel)',
    padding: '20px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box',
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  };

  const btnBase: React.CSSProperties = {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 900,
    cursor: 'pointer',
    transition: '0.2s',
  };

return (
    <div style={panelStyle}>
      {/* ЗАГОЛОВОК */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>👂</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.5px',
            }}
          >
            {t.earTrainer.mode}
          </span>
        </div>
      </div>

{/* ВЫБОР РЕЖИМА */}
      <div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(Object.keys(MODE_LABELS) as TrainingMode[]).map((m) => {
            const color = MODE_COLORS[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  resetAll();
                }}
                style={{
                  ...btnBase,
                  background: active ? color : 'var(--bg-root)',
                  color: active ? '#000' : 'var(--text-primary)',
                  border: `1px solid ${color}`,
                  boxShadow: active ? `0 0 12px ${color}` : 'none',
                }}
              >
                {modeLabel(m)}
              </button>
            );
          })}
        </div>
      </div>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleGenerate}
          disabled={isPlaying || isRecording}
          style={{
            ...btnBase,
            background: 'var(--accent)',
            color: '#000',
            boxShadow: '0 0 12px var(--accent)',
            opacity: isPlaying || isRecording ? 0.5 : 1,
            cursor: isPlaying || isRecording ? 'not-allowed' : 'pointer',
          }}
        >
{isPlaying ? t.common.playing : t.earTrainer.generateListen}
        </button>

        <button
          onClick={handleRecord}
          disabled={targetNotes.length === 0 || isPlaying}
          style={{
            ...btnBase,
            background: isRecording ? '#ff4444' : 'var(--bg-root)',
            color: isRecording ? '#fff' : 'var(--text-primary)',
            border: `1px solid ${isRecording ? '#ff4444' : 'var(--border-color)'}`,
            opacity: targetNotes.length === 0 || isPlaying ? 0.5 : 1,
            cursor: targetNotes.length === 0 || isPlaying ? 'not-allowed' : 'pointer',
          }}
        >
          {isRecording ? t.earTrainer.stopAnalyze : t.earTrainer.recordAnswer}
        </button>

        {phase === 'done' && recordedUrl && (
          <button
            onClick={handlePlayTake}
            style={{
              ...btnBase,
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
            }}
          >
            {isPlayingBack ? t.earTrainer.stopTake : t.earTrainer.playMyTake}
          </button>
        )}
      </div>

{/* СТАТУС / ФАЗА */}
{phase === 'listening' && mode === 'chord' && targetChord && (
        <div style={{ ...styles.statusBox, borderColor: 'var(--color-accent-border)', textAlign: 'center' }}>
<div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', marginBottom: '6px' }}>
            {t.earTrainer.whatChord}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {isPlaying ? t.earTrainer.listening : t.earTrainer.listenAgain}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
            {chordOptions.map((name) => {
              const answered = chordAnswer !== null;
              const isTheAnswer = targetChord?.name === name;
              const isPicked = chordAnswer === name;
              const isWrongPick = answered && isPicked && !isTheAnswer;
              const isCorrectPick = answered && isPicked && isTheAnswer;
              return (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '4px 6px 4px 12px',
                    borderRadius: '10px',
                    background: isCorrectPick || (answered && isTheAnswer)
                      ? 'rgba(74,222,128,0.15)'
                      : isWrongPick
                      ? 'rgba(239,68,68,0.15)'
                      : 'var(--bg-primary)',
                    border: `1px solid ${
                      isCorrectPick || (answered && isTheAnswer)
                        ? 'rgba(74,222,128,0.5)'
                        : isWrongPick
                        ? 'rgba(239,68,68,0.5)'
                        : 'var(--border-color)'
                    }`,
                    boxShadow: isCorrectPick || (answered && isTheAnswer)
                      ? '0 0 12px rgba(74,222,128,0.35)'
                      : 'none',
                  }}
                >
                  <span
                    onClick={() => { if (!answered) handleChordPick(name); }}
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isCorrectPick || (answered && isTheAnswer)
                        ? '#4ade80'
                        : isWrongPick
                        ? '#ef4444'
                        : 'var(--text-primary)',
                      cursor: answered ? 'default' : 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {isCorrectPick || (answered && isTheAnswer) ? '✅ ' : isWrongPick ? '❌ ' : ''}
                    {name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuizModalChord(name);
                    }}
                    style={{
                      background: 'var(--accent)',
                      color: '#000',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(0,255,157,0.3)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    SHOW
                  </button>
                </div>
              );
            })}
          </div>
          {chordAnswer && (
            <div
              style={{
                marginTop: '12px',
                fontSize: '13px',
                fontWeight: 800,
                color: chordCorrect ? '#4ade80' : '#ef4444',
              }}
            >
{chordCorrect
                ? `${t.earTrainer.correctChord} ${targetChord.name}`
                : `${t.earTrainer.wrongChord} ${targetChord.name} (ноты: ${targetChord.notes.join(' – ')})`}
            </div>
          )}
        </div>
      )}

      {phase === 'listening' && mode !== 'chord' && targetNotes.length > 0 && (
        <div style={{ ...styles.statusBox, borderColor: 'var(--color-accent-border)' }}>
<div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {t.earTrainer.rememberSequence}
          </div>
          <RevealNoteStrip notes={targetNotes} />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {t.earTrainer.takeGuitarBefore} <strong style={{ color: 'var(--accent)' }}>Record Answer</strong>.
          </div>
        </div>
      )}

      {phase === 'recording' && (
        <div style={{ ...styles.statusBox, borderColor: 'rgba(255,68,68,0.4)' }}>
<div style={{ fontSize: '13px', fontWeight: 800, color: '#ff4444' }}>
            {t.earTrainer.recording}
          </div>
          {detectedNotes.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <NoteStrip notes={detectedNotes.map((d) => ({ note: d.note, octave: d.octave, duration: '' }))} />
            </div>
          )}
        </div>
      )}

      {phase === 'done' && recordedUrl && (
        <div style={{ ...styles.statusBox, borderColor: 'var(--color-accent-border)' }}>
<div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {t.earTrainer.savedTakeBefore} <strong style={{ color: 'var(--accent)' }}>Analyze</strong> {t.earTrainer.savedTakeAfter}
          </div>
          <button
            onClick={handleEvaluate}
            disabled={detectedNotes.length === 0}
            style={{
              ...btnBase,
              background: 'var(--accent)',
              color: '#000',
              opacity: detectedNotes.length === 0 ? 0.5 : 1,
            }}
          >
            {t.earTrainer.analyze}
          </button>
        </div>
      )}

      {/* РЕЗУЛЬТАТ ОЦЕНКИ */}
      {feedback && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Счёт */}
<div style={styles.metricRow}>
            <Metric label={t.earTrainer.hits} value={`${feedback.score}%`} />
            <Metric label={t.earTrainer.targets} value={String(targetNotes.length)} />
            <Metric label={t.earTrainer.played} value={String(detectedNotes.length)} />
          </div>

          {/* Визуальные индикаторы нот */}
          <div>
<div style={sectionLabelStyle}>{t.earTrainer.resultByNotes}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {feedback.result.map((f, i) => (
                <div
                  key={i}
title={f.playedLabel ? `${f.playedLabel} (${f.cents > 0 ? '+' : ''}${f.cents.toFixed(0)}¢)` : t.earTrainer.notPlayed}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: f.hit ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${f.hit ? 'rgba(74,222,128,0.35)' : 'rgba(239,68,68,0.35)'}`,
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 800, color: f.hit ? '#4ade80' : '#ef4444' }}>
                    {f.targetLabel}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    {f.playedLabel ? f.playedLabel : '—'}
                  </span>
                  <span style={{ fontSize: '10px', color: f.hit ? '#4ade80' : '#ef4444' }}>
                    {f.hit ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>

{/* Подсказки (спрятаны под спойлер, чтобы не раскрывать ноты заранее) */}
          {(feedback.tuningTips.length > 0 || feedback.theoryTips.length > 0) && (
            <details style={{ width: '100%' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--accent)',
                  background: 'var(--bg-root)',
                  border: '1px solid var(--color-accent-border)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  userSelect: 'none',
                }}
              >
{t.earTrainer.showHints}
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {feedback.tuningTips.map((tip, i) => (
                  <div key={`tun-${i}`} style={styles.tipBox}>
                    🎚️ {tip}
                  </div>
                ))}
                {feedback.theoryTips.map((tip, i) => (
                  <div key={`thy-${i}`} style={styles.tipBox}>
                    🎼 {tip}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Микро-лупер */}
          {recordedUrl && (
            <div style={styles.looperBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🔁</span>
<span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t.earTrainer.microLooper}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t.earTrainer.microLooperHint}
              </div>
              <button
                onClick={handlePlayTake}
                style={{
                  marginTop: '8px',
                  ...btnBase,
                  background: isPlayingBack ? '#ff4444' : 'var(--accent)',
                  color: isPlayingBack ? '#fff' : '#000',
                }}
              >
{isPlayingBack ? t.earTrainer.stopTake : t.earTrainer.playTake}
              </button>
            </div>
          )}

          <button
            onClick={resetAll}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {t.common.newTask}
          </button>
        </div>
      )}

{/* ПУСТОЕ СОСТОЯНИЕ */}
{phase === 'idle' && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '24px' }}>👂</span>
<span>
            {t.earTrainer.emptyHint1}
            <br />
            {t.earTrainer.emptyHint2}
          </span>
        </div>
      )}

      {/* Модалка аккорда (как кнопка SHOW в Diatonic Chords) */}
      {quizModalChord && (
        <ChordDictionaryModal
          chord={quizModalChord}
          onClose={() => setQuizModalChord(null)}
        />
      )}
    </div>
  );
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ UI-КОМПОНЕНТЫ
// ============================================================

const NoteStrip: React.FC<{ notes: { note: string; octave: number; duration?: string }[] }> = ({ notes }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
    {notes.map((n, i) => (
      <span
        key={i}
        style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'var(--color-accent-soft)',
          color: 'var(--accent)',
          border: '1px solid var(--color-accent-border)',
        }}
      >
        {n.note}
        {n.octave}
      </span>
    ))}
  </div>
);

// Полоска нот, скрытая до клика/тача по каждой ноте (для честного запоминания)
const RevealNoteStrip: React.FC<{ notes: { note: string; octave: number; duration?: string }[] }> = ({ notes }) => {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState<boolean[]>(() => notes.map(() => false));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {notes.map((n, i) =>
        revealed[i] ? (
          <span
            key={i}
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'var(--color-accent-soft)',
              color: 'var(--accent)',
              border: '1px solid var(--color-accent-border)',
              cursor: 'pointer',
            }}
            onClick={() => setRevealed((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
          >
            {n.note}
            {n.octave}
          </span>
        ) : (
          <span
            key={i}
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
onClick={() => setRevealed((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
            title={t.earTrainer.revealNote}
          >
            🎵
          </span>
        )
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      flex: 1,
      textAlign: 'center',
      background: 'var(--bg-root)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '10px 6px',
    }}
  >
    <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
      {value}
    </div>
    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '2px' }}>
      {label}
    </div>
  </div>
);

// Общие стили
const styles: Record<string, React.CSSProperties> = {
  statusBox: {
    textAlign: 'left',
    color: 'var(--text-primary)',
    fontSize: '12px',
    padding: '12px',
    background: 'var(--bg-root)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
  },
  metricRow: {
    display: 'flex',
    gap: '8px',
  },
  tipBox: {
    fontSize: '12px',
    lineHeight: 1.4,
    color: 'var(--text-primary)',
    background: 'var(--bg-root)',
    border: '1px solid var(--color-accent-border)',
    borderRadius: '6px',
    padding: '8px 10px',
  },
  looperBox: {
    background: 'var(--bg-root)',
    border: '1px dashed var(--color-accent-border)',
    borderRadius: '8px',
    padding: '12px',
  },
  emptyState: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '12px',
    padding: '32px 0',
    background: 'var(--bg-root)',
    borderRadius: '8px',
    border: '1px dashed var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
};

export default EarTrainer;

// src/services/PitchAnalyzer.ts
//
// Общее ядро pitch-detection, вынесенное из useTuner.ts, чтобы им пользовались
// и живой тюнер, и анализатор записи — один и тот же алгоритм, без дублирования.

const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface PitchResult {
  pitch: number;   // Гц, -1 если не распознано
  clarity: number; // 0..1, уверенность детектора
}

export interface NoteInfo {
  note: string;       // имя ноты, напр. "E"
  octave: number;      // напр. 2
  frequency: number;   // округлённая частота
  cents: number;        // отклонение от идеального тона, -50..50
}

/**
 * McLeod Pitch Method — точное определение основного тона по временному буферу.
 * Идентично реализации в useTuner.ts.
 */
export function findPitchMPM(buf: Float32Array, sampleRate: number): PitchResult {
  const size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);

  if (rms < 0.015) return { pitch: -1, clarity: 0 };

  const nsdf = new Float32Array(size);
  for (let tau = 0; tau < size / 2; tau++) {
    let acf = 0;
    let df = 0;
    for (let i = 0; i < size - tau; i++) {
      acf += buf[i] * buf[i + tau];
      df += buf[i] * buf[i] + buf[i + tau] * buf[i + tau];
    }
    nsdf[tau] = df === 0 ? 0 : (2 * acf) / df;
  }

  const maxPositions: number[] = [];
  let seekingPositives = true;
  for (let i = 1; i < size / 2 - 1; i++) {
    if (seekingPositives) {
      if (nsdf[i] > 0) seekingPositives = false;
      continue;
    }
    if (nsdf[i] > nsdf[i - 1] && nsdf[i] > nsdf[i + 1]) {
      maxPositions.push(i);
    }
  }

  let highestPeakValue = -1;
  let highestPeakPos = -1;

  for (const pos of maxPositions) {
    if (nsdf[pos] > highestPeakValue && nsdf[pos] > 0.4) {
      highestPeakValue = nsdf[pos];
      highestPeakPos = pos;
    }
  }

  let period = -1;
  let clarity = 0;

  if (highestPeakPos !== -1) {
    const alpha = nsdf[highestPeakPos - 1];
    const beta = nsdf[highestPeakPos];
    const gamma = nsdf[highestPeakPos + 1];
    const pCount = highestPeakPos + (0.5 * (alpha - gamma)) / (alpha - 2 * beta + gamma);

    period = pCount;
    clarity = highestPeakValue;
  }

  const pitch = period !== -1 ? sampleRate / period : -1;
  return { pitch, clarity };
}

/**
 * Переводит частоту в Гц в имя ноты, октаву и отклонение в центах.
 * Возвращает null, если частота вне разумного диапазона.
 */
export function frequencyToNote(frequency: number): NoteInfo | null {
  if (!frequency || frequency <= 0) return null;

  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const rounded = Math.round(noteNum);
  const noteIndex = ((rounded + 69) % 12 + 12) % 12;
  const noteName = NOTE_STRINGS[noteIndex];
  const octave = Math.floor((rounded + 69) / 12) - 1;

  const expectedFreq = 440 * Math.pow(2, rounded / 12);
  let cents = Math.floor(1200 * Math.log2(frequency / expectedFreq));
  cents = Math.max(-50, Math.min(50, cents));

  return {
    note: noteName,
    octave,
    frequency: Math.round(frequency * 10) / 10,
    cents,
  };
}

// Разумные границы для гитары (низкая E ~82 Гц .. высокие лады ~1000 Гц)
export const PITCH_MIN_HZ = 60;
export const PITCH_MAX_HZ = 1000;
export const CLARITY_THRESHOLD = 0.82;

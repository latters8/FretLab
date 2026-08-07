// src/utils/audioEngine.ts

/**
 * Простой звуковой движок для FretLab
 * Использует Web Audio API
 */

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ⚠️ FIX: раньше playNote/quickPlay создавали новый AudioContext на КАЖДЫЙ
// вызов и никогда его не закрывали. playScale дергает playNote в цикле —
// одно проигрывание гаммы из 7 нот = 7 навсегда открытых AudioContext.
// Держим один общий контекст на весь модуль (создаётся лениво при первом
// вызове), это стандартная практика для утилитарных звуковых функций.
let sharedCtx: AudioContext | null = null;

const getSharedContext = (): AudioContext | null => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContextClass();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
};

const noteToFreq = (note: string): number => {
  const match = note.match(/^([A-G][#b]?)(\d+)?$/);
  if (!match) return 440;
  
  const [, baseNote, octaveStr] = match;
  const octave = octaveStr ? parseInt(octaveStr) : 4;
  const noteIndex = ALL_NOTES.indexOf(baseNote);
  if (noteIndex === -1) return 440;
  
  const midi = noteIndex + (octave + 1) * 12 + 9;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * Воспроизведение одной ноты
 */
export const playNote = (note: string, duration: number = 1.0, volume: number = 0.3): void => {
  const freq = noteToFreq(note);
  const ctx = getSharedContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.value = freq;
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

/**
 * Воспроизведение аккорда (все ноты одновременно)
 */
export const quickPlay = (notes: string[], arpeggio: boolean = false): void => {
  if (notes.length === 0) return;
  
  if (arpeggio) {
    notes.forEach((note, index) => {
      setTimeout(() => {
        playNote(note, 0.8, 0.2);
      }, index * 150);
    });
  } else {
    const ctx = getSharedContext();
    if (!ctx) return;
    
    notes.forEach((note) => {
      const freq = noteToFreq(note);
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.0);
    });
  }
};

/**
 * Воспроизведение гаммы (последовательно)
 */
export const playScale = (notes: string[], delay: number = 150): void => {
  notes.forEach((note, index) => {
    setTimeout(() => {
      playNote(note, 0.4, 0.2);
    }, index * delay);
  });
};

/**
 * Воспроизведение аккорда по имени
 */
export const playChordByName = (chordName: string): void => {
  const match = chordName.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return;
  
  const root = match[1];
  const quality = match[2].toLowerCase();
  const rootIndex = ALL_NOTES.indexOf(root);
  if (rootIndex === -1) return;
  
  let intervals: number[] = [];
  
  if (quality === '' || quality === 'maj') {
    intervals = [0, 4, 7];
  } else if (quality === 'm' || quality === 'min') {
    intervals = [0, 3, 7];
  } else if (quality === '7') {
    intervals = [0, 4, 7, 10];
  } else if (quality === 'maj7') {
    intervals = [0, 4, 7, 11];
  } else if (quality === 'm7') {
    intervals = [0, 3, 7, 10];
  } else if (quality === 'dim') {
    intervals = [0, 3, 6];
  } else if (quality === 'aug') {
    intervals = [0, 4, 8];
  } else {
    intervals = [0, 4, 7];
  }
  
  const notes = intervals.map(i => {
    const idx = (rootIndex + i) % 12;
    return ALL_NOTES[idx] + '4';
  });
  
  quickPlay(notes, false);
};
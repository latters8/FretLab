/**
 * 🎛️ Effects Module — экспорт всех эффектов
 * 
 * FretLab Guitar Processor — цифровая обработка сигнала
 * ======================================================
 * Цепочка: Input → NoiseGate → Compressor → Distortion → EQ → Chorus → Delay → Reverb → Limiter → Output
 */

export { DistortionEffect, createDistortionCurve } from './Distortion';
export type { DistortionParams, DistortionType } from './Distortion';

export { DelayEffect } from './Delay';
export type { DelayParams, DelayType } from './Delay';

export { ReverbEffect } from './Reverb';
export type { ReverbParams, ReverbType } from './Reverb';

export { ChorusEffect } from './Chorus';
export type { ChorusParams, ModulationType } from './Chorus';

export { CompressorEffect, LimiterEffect } from './Compressor';
export type { CompressorParams } from './Compressor';

export { NoiseGateEffect } from './NoiseGate';
export type { NoiseGateParams } from './NoiseGate';

export { WahWahEffect } from './WahWah';
export type { WahWahParams, WahMode } from './WahWah';

// ============================================
// 🎛️ PRESETS — готовые пресеты эффектов
// ============================================

export const GUITAR_PRESETS = {
  clean: {
    name: 'Clean',
    description: 'Чистый звук с легкой реверберацией',
    chain: {
      noiseGate: { threshold: -60, attack: 1, hold: 30, release: 80, range: -70, active: true },
      compressor: { threshold: -30, ratio: 2, attack: 5, release: 200, knee: 15, makeupGain: 3, active: true },
      distortion: { type: 'overdrive' as const, drive: 5, tone: 70, output: 0, active: false },
      chorus: { type: 'chorus' as const, rate: 1.2, depth: 30, mix: 25, feedback: 10, delay: 10, active: false },
      delay: { type: 'digital' as const, time: 400, feedback: 20, mix: 15, lowCut: 100, highCut: 8000, active: false },
      reverb: { type: 'hall' as const, decay: 1.5, preDelay: 20, damping: 50, mix: 25, roomSize: 40, active: true },
      wah: { mode: 'manual' as const, frequency: 600, q: 3, rate: 1, depth: 50, mix: 100, active: false, pedalPosition: 30 }
    }
  },
  crunch: {
    name: 'Crunch',
    description: 'Легкий драйв — классический рок',
    chain: {
      noiseGate: { threshold: -55, attack: 1, hold: 30, release: 80, range: -60, active: true },
      compressor: { threshold: -25, ratio: 3, attack: 3, release: 150, knee: 10, makeupGain: 4, active: true },
      distortion: { type: 'crunch' as const, drive: 45, tone: 65, output: 0, active: true },
      chorus: { type: 'chorus' as const, rate: 1, depth: 20, mix: 15, feedback: 5, delay: 8, active: false },
      delay: { type: 'analog' as const, time: 350, feedback: 25, mix: 20, lowCut: 80, highCut: 6000, active: false },
      reverb: { type: 'room' as const, decay: 0.8, preDelay: 10, damping: 40, mix: 20, roomSize: 30, active: true },
      wah: { mode: 'manual' as const, frequency: 600, q: 4, rate: 1, depth: 50, mix: 100, active: false, pedalPosition: 30 }
    }
  },
  overdrive: {
    name: 'Overdrive',
    description: 'Мягкий овердрайв — блюз/рок',
    chain: {
      noiseGate: { threshold: -55, attack: 1, hold: 30, release: 80, range: -60, active: true },
      compressor: { threshold: -22, ratio: 3, attack: 3, release: 150, knee: 10, makeupGain: 5, active: true },
      distortion: { type: 'overdrive' as const, drive: 60, tone: 60, output: 2, active: true },
      chorus: { type: 'chorus' as const, rate: 1.2, depth: 25, mix: 20, feedback: 8, delay: 10, active: false },
      delay: { type: 'analog' as const, time: 380, feedback: 28, mix: 22, lowCut: 100, highCut: 5500, active: false },
      reverb: { type: 'hall' as const, decay: 1.2, preDelay: 15, damping: 45, mix: 22, roomSize: 35, active: true },
      wah: { mode: 'manual' as const, frequency: 600, q: 4, rate: 1.5, depth: 50, mix: 100, active: false, pedalPosition: 30 }
    }
  },
  distortion: {
    name: 'Distortion',
    description: 'Жесткий дисторшн — хард-рок/метал',
    chain: {
      noiseGate: { threshold: -50, attack: 1, hold: 20, release: 60, range: -60, active: true },
      compressor: { threshold: -20, ratio: 4, attack: 2, release: 100, knee: 5, makeupGain: 6, active: true },
      distortion: { type: 'distortion' as const, drive: 75, tone: 50, output: 3, active: true },
      chorus: { type: 'chorus' as const, rate: 0.8, depth: 15, mix: 10, feedback: 5, delay: 6, active: false },
      delay: { type: 'digital' as const, time: 300, feedback: 20, mix: 15, lowCut: 150, highCut: 7000, active: false },
      reverb: { type: 'hall' as const, decay: 1.8, preDelay: 25, damping: 60, mix: 18, roomSize: 50, active: true },
      wah: { mode: 'manual' as const, frequency: 600, q: 5, rate: 1, depth: 50, mix: 100, active: false, pedalPosition: 30 }
    }
  },
  metal: {
    name: 'Metal',
    description: 'Тяжелый метал — агрессивный звук',
    chain: {
      noiseGate: { threshold: -45, attack: 1, hold: 15, release: 50, range: -60, active: true },
      compressor: { threshold: -18, ratio: 6, attack: 1, release: 80, knee: 3, makeupGain: 8, active: true },
      distortion: { type: 'metal' as const, drive: 90, tone: 40, output: 5, active: true },
      chorus: { type: 'chorus' as const, rate: 0.5, depth: 10, mix: 8, feedback: 3, delay: 5, active: false },
      delay: { type: 'digital' as const, time: 250, feedback: 15, mix: 10, lowCut: 200, highCut: 6000, active: false },
      reverb: { type: 'hall' as const, decay: 2.0, preDelay: 30, damping: 70, mix: 15, roomSize: 60, active: true },
      wah: { mode: 'manual' as const, frequency: 600, q: 6, rate: 1, depth: 50, mix: 100, active: false, pedalPosition: 30 }
    }
  },
  fuzz: {
    name: 'Fuzz',
    description: 'Fuzz — насыщенный грязный звук',
    chain: {
      noiseGate: { threshold: -50, attack: 2, hold: 20, release: 100, range: -60, active: true },
      compressor: { threshold: -28, ratio: 2, attack: 5, release: 200, knee: 15, makeupGain: 4, active: true },
      distortion: { type: 'fuzz' as const, drive: 70, tone: 55, output: 2, active: true },
      chorus: { type: 'chorus' as const, rate: 1.5, depth: 35, mix: 30, feedback: 12, delay: 12, active: false },
      delay: { type: 'analog' as const, time: 400, feedback: 25, mix: 20, lowCut: 80, highCut: 4000, active: false },
      reverb: { type: 'room' as const, decay: 0.6, preDelay: 5, damping: 30, mix: 15, roomSize: 20, active: true },
      wah: { mode: 'auto' as const, frequency: 800, q: 5, rate: 2, depth: 60, mix: 100, active: false, pedalPosition: 30 }
    }
  },
  jazz: {
    name: 'Jazz',
    description: 'Теплый джазовый звук',
    chain: {
      noiseGate: { threshold: -65, attack: 2, hold: 40, release: 100, range: -70, active: true },
      compressor: { threshold: -28, ratio: 2.5, attack: 8, release: 250, knee: 20, makeupGain: 2, active: true },
      distortion: { type: 'overdrive' as const, drive: 10, tone: 80, output: -2, active: false },
      chorus: { type: 'chorus' as const, rate: 1, depth: 20, mix: 15, feedback: 5, delay: 8, active: false },
      delay: { type: 'analog' as const, time: 450, feedback: 15, mix: 12, lowCut: 50, highCut: 4000, active: false },
      reverb: { type: 'plate' as const, decay: 1.0, preDelay: 10, damping: 30, mix: 20, roomSize: 25, active: true },
      wah: { mode: 'manual' as const, frequency: 600, q: 3, rate: 1, depth: 50, mix: 100, active: false, pedalPosition: 30 }
    }
  },
  ambient: {
    name: 'Ambient',
    description: 'Просторный эмбиент с большим ревером',
    chain: {
      noiseGate: { threshold: -65, attack: 3, hold: 50, release: 200, range: -70, active: true },
      compressor: { threshold: -30, ratio: 2, attack: 10, release: 300, knee: 20, makeupGain: 3, active: true },
      distortion: { type: 'overdrive' as const, drive: 15, tone: 75, output: -2, active: false },
      chorus: { type: 'chorus' as const, rate: 1.8, depth: 45, mix: 40, feedback: 15, delay: 15, active: true },
      delay: { type: 'digital' as const, time: 600, feedback: 35, mix: 30, lowCut: 50, highCut: 10000, active: true },
      reverb: { type: 'cathedral' as const, decay: 4.0, preDelay: 50, damping: 40, mix: 40, roomSize: 80, active: true },
      wah: { mode: 'auto' as const, frequency: 500, q: 3, rate: 0.5, depth: 30, mix: 50, active: false, pedalPosition: 30 }
    }
  },
  blues: {
    name: 'Blues',
    description: 'Классический блюзовый звук',
    chain: {
      noiseGate: { threshold: -60, attack: 1, hold: 30, release: 80, range: -65, active: true },
      compressor: { threshold: -26, ratio: 2.5, attack: 4, release: 180, knee: 12, makeupGain: 3, active: true },
      distortion: { type: 'overdrive' as const, drive: 35, tone: 70, output: 0, active: true },
      chorus: { type: 'chorus' as const, rate: 1.2, depth: 25, mix: 20, feedback: 8, delay: 10, active: false },
      delay: { type: 'analog' as const, time: 350, feedback: 22, mix: 18, lowCut: 80, highCut: 5000, active: false },
      reverb: { type: 'room' as const, decay: 0.6, preDelay: 8, damping: 35, mix: 18, roomSize: 25, active: true },
      wah: { mode: 'manual' as const, frequency: 600, q: 4, rate: 1.5, depth: 50, mix: 100, active: false, pedalPosition: 30 }
    }
  }
} as const;

export type GuitarPresetName = keyof typeof GUITAR_PRESETS;

/**
 * 🎛️ Effects Index
 * Re-exports all effect classes with AudioManager-compatible names
 *
 * HQ-эффекты (CompressorHQ, DelayHQ, ReverbHQ, LimiterHQ, CabinetIR)
 * реэкспортируются из src/audio/effects/ — единственный источник истины
 * для AudioWorklet процессоров.
 */

// Re-export unique (non-duplicated) effects
export { DistortionEffect } from './Distortion';
export { ChorusEffect } from './Chorus';
export { NoiseGateEffect } from './NoiseGate';
export { WahWahEffect } from './WahWah';

// Re-export HQ effects from the single source (src/audio/effects/)
import { DelayHQ } from '../../audio/effects/DelayHQ';
import { ReverbHQ } from '../../audio/effects/ReverbHQ';
import { CompressorHQ, LimiterHQ } from '../../audio/effects/CompressorHQ';
import { CabinetIR } from '../../audio/effects/CabinetIR';

export { DelayHQ, ReverbHQ, CompressorHQ, LimiterHQ, CabinetIR };

// Aliases for AudioManager compatibility
export { DelayHQ as DelayEffect };
export { ReverbHQ as ReverbEffect };
export { CompressorHQ as CompressorEffect };
export { LimiterHQ as LimiterEffect };

// Presets support for AudioManager
export type GuitarPresetName = 'clean' | 'crunch' | 'high-gain' | 'ambient';

export interface GuitarChainParams {
  noiseGate?: Record<string, number>;
  compressor?: Record<string, number>;
  distortion?: Record<string, number>;
  chorus?: Record<string, number>;
  delay?: Record<string, number>;
  reverb?: Record<string, number>;
  wah?: Record<string, number>;
  limiter?: Record<string, number>;
}

export interface GuitarPreset {
  name: string;
  type: GuitarPresetName;
  description: string;
  chain: GuitarChainParams;
}

export const GUITAR_PRESETS: Record<GuitarPresetName, GuitarPreset> = {
  clean: {
    name: 'Clean',
    type: 'clean',
    description: 'Чистый прозрачный звук',
    chain: {
      noiseGate: { threshold: -60, attack: 0.01, hold: 50, release: 100, range: -60 },
      compressor: { threshold: -18, ratio: 2, attack: 10, release: 200, knee: 6, makeupGain: 2, mix: 1 },
      distortion: { type: 0, drive: 0, tone: 50, output: 0 },
      chorus: { type: 0, rate: 1.5, depth: 30, mix: 20, feedback: 15, delay: 8 },
      delay: { delayTime: 380, feedback: 20, mix: 15 },
      reverb: { decay: 1.2, preDelay: 15, damping: 0.3, mix: 25, roomSize: 0.8 },
      wah: { mode: 0, frequency: 600, q: 5, rate: 1.5, depth: 40, mix: 100, pedalPosition: 50 },
      limiter: { threshold: -3, ratio: 50, attack: 0.01, release: 30 }
    }
  },
  crunch: {
    name: 'Crunch',
    type: 'crunch',
    description: 'Легкий перегруз, рок-звук',
    chain: {
      noiseGate: { threshold: -55, attack: 0.005, hold: 30, release: 100, range: -60 },
      compressor: { threshold: -22, ratio: 3, attack: 5, release: 150, knee: 4, makeupGain: 3, mix: 1 },
      distortion: { type: 0, drive: 40, tone: 60, output: 2 },
      chorus: { type: 0, rate: 1.2, depth: 25, mix: 15, feedback: 10, delay: 6 },
      delay: { delayTime: 420, feedback: 30, mix: 20 },
      reverb: { decay: 1.8, preDelay: 20, damping: 0.5, mix: 20, roomSize: 1.0 },
      wah: { mode: 0, frequency: 500, q: 5, rate: 1.2, depth: 35, mix: 100, pedalPosition: 50 },
      limiter: { threshold: -3, ratio: 50, attack: 0.01, release: 30 }
    }
  },
  'high-gain': {
    name: 'High Gain',
    type: 'high-gain',
    description: 'Тяжелый дисторшн для металла',
    chain: {
      noiseGate: { threshold: -45, attack: 0.001, hold: 10, release: 50, range: -60 },
      compressor: { threshold: -16, ratio: 6, attack: 1, release: 80, knee: 2, makeupGain: 6, mix: 1 },
      distortion: { type: 2, drive: 75, tone: 70, output: 3 },
      chorus: { type: 0, rate: 1.0, depth: 20, mix: 10, feedback: 5, delay: 4 },
      delay: { delayTime: 300, feedback: 35, mix: 25 },
      reverb: { decay: 1.5, preDelay: 10, damping: 0.6, mix: 12, roomSize: 1.2 },
      wah: { mode: 0, frequency: 400, q: 5, rate: 1.0, depth: 30, mix: 100, pedalPosition: 50 },
      limiter: { threshold: -6, ratio: 20, attack: 0.05, release: 50 }
    }
  },
  ambient: {
    name: 'Ambient',
    type: 'ambient',
    description: 'Просторный атмосферный звук',
    chain: {
      noiseGate: { threshold: -60, attack: 0.02, hold: 100, release: 200, range: -60 },
      compressor: { threshold: -24, ratio: 2, attack: 15, release: 300, knee: 8, makeupGain: 1, mix: 0.5 },
      distortion: { type: 0, drive: 10, tone: 40, output: 0 },
      chorus: { type: 0, rate: 2.0, depth: 50, mix: 35, feedback: 25, delay: 12 },
      delay: { delayTime: 600, feedback: 40, mix: 35 },
      reverb: { decay: 8.0, preDelay: 60, damping: 0.2, mix: 55, roomSize: 1.5 },
      wah: { mode: 0, frequency: 300, q: 3, rate: 2.0, depth: 50, mix: 50, pedalPosition: 50 },
      limiter: { threshold: -3, ratio: 50, attack: 0.01, release: 30 }
    }
  }
};


/**
 * 🌊 ReverbHQ — High-Quality Algorithmic Reverb
 * Стерео FDN (8 lines) + Early Reflections + Shimmer + Modulation
 * 
 * Вдохновлено: Strymon BigSky, Eventide Blackhole, Lexicon 480L
 * 
 * Фичи:
 * • Early Reflections: 8 tap-delay с pan и gain
 * • FDN Core: 8 линий, Hadamard 8×8 mixing, one-pole damping
 * • LFO-модуляция на delay lines (chorus-like diffusion)
 * • Shimmer: 2-grain pitch-shifter в feedback (+1 октава и выше)
 * • Stereo Width (Mid/Side)
 * • Density control (diffusion amount)
 * • RT60-based decay (корректная формула затухания)
 */

import { REVERB_HQ_PROCESSOR_CODE } from './ReverbWorklet';
import type { ReverbWorkletParams } from './ReverbWorklet';

export type ReverbHQType =
  | 'room'
  | 'hall'
  | 'plate'
  | 'spring'
  | 'cathedral'
  | 'ambient'
  | 'shimmer'
  | 'modulated'
  | 'custom';

export interface ReverbHQPreset {
  name: string;
  type: ReverbHQType;
  description: string;
  params: Partial<ReverbWorkletParams>;
}

export class ReverbHQ {
  private ctx: AudioContext;
  private workletNode?: AudioWorkletNode;
  private input: GainNode;
  private output: GainNode;
  private _active = true;
  private _type: ReverbHQType = 'hall';

  private params: Map<string, AudioParam> = new Map();
  private _values: ReverbWorkletParams = {
    decay: 2.0,
    preDelay: 0.03,
    damping: 0.4,
    mix: 0.3,
    roomSize: 1.0,
    modDepth: 0.001,
    modRate: 0.5,
    earlyLevel: 0.6,
    earlySize: 1.0,
    shimmerAmount: 0,
    shimmerPitch: 2.0,
    stereoWidth: 1.0,
    density: 0.7,
    active: 1,
  };

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
  }

  /** Загружает и инициализирует AudioWorklet */
  async init(): Promise<void> {
    if (this.workletNode) return;

    const blob = new Blob([REVERB_HQ_PROCESSOR_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try {
      await this.ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    this.workletNode = new AudioWorkletNode(this.ctx, 'reverb-hq-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      outputChannelCount: [2],
      parameterData: {
        decay: this._values.decay,
        preDelay: this._values.preDelay,
        damping: this._values.damping,
        mix: this._values.mix,
        roomSize: this._values.roomSize,
        modDepth: this._values.modDepth,
        modRate: this._values.modRate,
        earlyLevel: this._values.earlyLevel,
        earlySize: this._values.earlySize,
        shimmerAmount: this._values.shimmerAmount,
        shimmerPitch: this._values.shimmerPitch,
        stereoWidth: this._values.stereoWidth,
        density: this._values.density,
        active: this._values.active,
      },
    });

    const p = this.workletNode.parameters;
    [
      'decay', 'preDelay', 'damping', 'mix', 'roomSize',
      'modDepth', 'modRate', 'earlyLevel', 'earlySize',
      'shimmerAmount', 'shimmerPitch', 'stereoWidth', 'density', 'active',
    ].forEach((name) => {
      const param = (p as any).get(name);
      if (param) this.params.set(name, param);
    });

    this.input.connect(this.workletNode);
    this.workletNode.connect(this.output);
  }

  // ─── Parameter setters (with smoothing) ───

  setDecay(sec: number, rampSec = 0.05) {
    this._setParam('decay', Math.max(0.1, Math.min(20, sec)), rampSec);
  }

  setPreDelay(ms: number, rampSec = 0.02) {
    this._setParam('preDelay', Math.max(0, Math.min(200, ms)) / 1000, rampSec);
  }

  /** Damping: 0 = dark/warm, 1 = bright/air */
  setDamping(amount: number, rampSec = 0.05) {
    this._setParam('damping', Math.max(0, Math.min(1, amount)), rampSec);
  }

  setMix(percent: number, rampSec = 0.05) {
    this._setParam('mix', Math.max(0, Math.min(100, percent)) / 100, rampSec);
  }

  /** Room size: 0.5 = small, 1.0 = medium, 2.0 = huge */
  setRoomSize(scale: number, rampSec = 0.05) {
    this._setParam('roomSize', Math.max(0.5, Math.min(2.0, scale)), rampSec);
  }

  setModulation(depthMs: number, rateHz: number, rampSec = 0.05) {
    this._setParam('modDepth', Math.max(0, Math.min(5, depthMs)) / 1000, rampSec);
    this._setParam('modRate', Math.max(0.1, Math.min(3, rateHz)), rampSec);
  }

  /** Early reflections level: 0 = late only, 1 = full early */
  setEarlyLevel(level: number, rampSec = 0.05) {
    this._setParam('earlyLevel', Math.max(0, Math.min(1, level)), rampSec);
  }

  setEarlySize(scale: number, rampSec = 0.05) {
    this._setParam('earlySize', Math.max(0.5, Math.min(2.0, scale)), rampSec);
  }

  /** Shimmer amount: 0 = off, 1 = full octave-up feedback */
  setShimmerAmount(amount: number, rampSec = 0.05) {
    this._setParam('shimmerAmount', Math.max(0, Math.min(1, amount)), rampSec);
  }

  /** Shimmer pitch ratio: 2.0 = +1 octave, 0.5 = -1 octave */
  setShimmerPitch(ratio: number, rampSec = 0.05) {
    this._setParam('shimmerPitch', Math.max(0.5, Math.min(4.0, ratio)), rampSec);
  }

  /** Stereo width: 0 = mono, 1 = normal, 2 = super-wide */
  setStereoWidth(width: number, rampSec = 0.05) {
    this._setParam('stereoWidth', Math.max(0, Math.min(2, width)), rampSec);
  }

  /** Density: 0 = sparse/transparent, 1 = dense/diffused */
  setDensity(amount: number, rampSec = 0.05) {
    this._setParam('density', Math.max(0, Math.min(1, amount)), rampSec);
  }

  // ─── Type / Presets ───

  get type() {
    return this._type;
  }

  setType(type: ReverbHQType) {
    this._type = type;
    const preset = ReverbHQ.PRESETS[type];
    if (preset) {
      this.loadPreset(preset);
    }
  }

  loadPreset(preset: ReverbHQPreset) {
    const p = preset.params;
    if (p.decay !== undefined) this.setDecay(p.decay);
    if (p.preDelay !== undefined) this.setPreDelay(p.preDelay * 1000);
    if (p.damping !== undefined) this.setDamping(p.damping);
    if (p.mix !== undefined) this.setMix(p.mix * 100);
    if (p.roomSize !== undefined) this.setRoomSize(p.roomSize);
    if (p.modDepth !== undefined && p.modRate !== undefined) {
      this.setModulation(p.modDepth * 1000, p.modRate);
    }
    if (p.earlyLevel !== undefined) this.setEarlyLevel(p.earlyLevel);
    if (p.earlySize !== undefined) this.setEarlySize(p.earlySize);
    if (p.shimmerAmount !== undefined) this.setShimmerAmount(p.shimmerAmount);
    if (p.shimmerPitch !== undefined) this.setShimmerPitch(p.shimmerPitch);
    if (p.stereoWidth !== undefined) this.setStereoWidth(p.stereoWidth);
    if (p.density !== undefined) this.setDensity(p.density);
  }

  // ─── Bypass / Active ───

  bypass() {
    this._active = false;
    this._setParam('active', 0, 0.01);
    this._setParam('mix', 0, 0.01);
  }

  activate() {
    this._active = true;
    this._setParam('active', 1, 0.01);
    this._setParam('mix', this._values.mix, 0.05);
  }

  get active() {
    return this._active;
  }

  // ─── I/O ───

  getInputNode(): AudioNode {
    return this.input;
  }

  getOutputNode(): AudioNode {
    return this.output;
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.workletNode?.disconnect();
    this.workletNode = undefined;
  }

  // ─── Private ───

  private _setParam(name: string, value: number, rampSec: number) {
    (this._values as any)[name] = value;
    const param = this.params.get(name);
    if (param) {
      param.setTargetAtTime(value, this.ctx.currentTime, rampSec / 3);
    }
  }

  // ─── PRESETS ───

  static PRESETS: Record<string, ReverbHQPreset> = {
    room: {
      name: 'Room',
      type: 'room',
      description: 'Малое помещение, короткий хвост, плотные ранние отражения',
      params: {
        decay: 0.8,
        preDelay: 0.01,
        damping: 0.6,
        mix: 0.25,
        roomSize: 0.7,
        modDepth: 0.0005,
        modRate: 0.3,
        earlyLevel: 0.8,
        earlySize: 0.8,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 1.0,
        density: 0.9,
      },
    },

    hall: {
      name: 'Concert Hall',
      type: 'hall',
      description: 'Классический концертный зал, сбалансированный early/late',
      params: {
        decay: 2.2,
        preDelay: 0.03,
        damping: 0.4,
        mix: 0.3,
        roomSize: 1.0,
        modDepth: 0.001,
        modRate: 0.5,
        earlyLevel: 0.6,
        earlySize: 1.0,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 1.1,
        density: 0.7,
      },
    },

    plate: {
      name: 'Plate',
      type: 'plate',
      description: 'Яркий plate-реверб, плотный, с коротким pre-delay',
      params: {
        decay: 1.5,
        preDelay: 0.005,
        damping: 0.7,
        mix: 0.35,
        roomSize: 0.9,
        modDepth: 0.0008,
        modRate: 0.4,
        earlyLevel: 0.5,
        earlySize: 0.9,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 1.2,
        density: 0.85,
      },
    },

    spring: {
      name: 'Spring',
      type: 'spring',
      description: 'Винтажный spring reverb, boingy, мало diffusion',
      params: {
        decay: 1.2,
        preDelay: 0.002,
        damping: 0.3,
        mix: 0.4,
        roomSize: 0.6,
        modDepth: 0.002,
        modRate: 1.2,
        earlyLevel: 0.3,
        earlySize: 0.6,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 0.9,
        density: 0.4,
      },
    },

    cathedral: {
      name: 'Cathedral',
      type: 'cathedral',
      description: 'Огромное пространство, длинный pre-delay, медленное затухание',
      params: {
        decay: 6.0,
        preDelay: 0.05,
        damping: 0.2,
        mix: 0.35,
        roomSize: 1.6,
        modDepth: 0.0015,
        modRate: 0.2,
        earlyLevel: 0.7,
        earlySize: 1.4,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 1.3,
        density: 0.6,
      },
    },

    ambient: {
      name: 'Ambient',
      type: 'ambient',
      description: 'Плотный, модулированный, для пэдов и атмосферы',
      params: {
        decay: 4.0,
        preDelay: 0.02,
        damping: 0.5,
        mix: 0.45,
        roomSize: 1.2,
        modDepth: 0.003,
        modRate: 0.8,
        earlyLevel: 0.5,
        earlySize: 1.1,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 1.4,
        density: 0.8,
      },
    },

    shimmer: {
      name: 'Shimmer',
      type: 'shimmer',
      description: 'Octave-up feedback, плотный, эфирный (как Strymon BigSky)',
      params: {
        decay: 5.0,
        preDelay: 0.04,
        damping: 0.6,
        mix: 0.5,
        roomSize: 1.3,
        modDepth: 0.002,
        modRate: 0.6,
        earlyLevel: 0.4,
        earlySize: 1.0,
        shimmerAmount: 0.4,
        shimmerPitch: 2.0,
        stereoWidth: 1.5,
        density: 0.75,
      },
    },

    modulated: {
      name: 'Modulated',
      type: 'modulated',
      description: 'Глубокая модуляция delay lines, chorus-like reverb',
      params: {
        decay: 3.0,
        preDelay: 0.025,
        damping: 0.45,
        mix: 0.4,
        roomSize: 1.1,
        modDepth: 0.004,
        modRate: 1.5,
        earlyLevel: 0.5,
        earlySize: 1.0,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 1.3,
        density: 0.7,
      },
    },

    custom: {
      name: 'Custom',
      type: 'custom',
      description: 'Пользовательские настройки',
      params: {
        decay: 2.0,
        preDelay: 0.03,
        damping: 0.4,
        mix: 0.3,
        roomSize: 1.0,
        modDepth: 0.001,
        modRate: 0.5,
        earlyLevel: 0.6,
        earlySize: 1.0,
        shimmerAmount: 0,
        shimmerPitch: 2.0,
        stereoWidth: 1.0,
        density: 0.7,
      },
    },
  };
}

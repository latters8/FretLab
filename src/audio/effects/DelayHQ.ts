/**
 * ⏳ DelayHQ — High-Quality Delay Engine
 * Вдохновлено: Strymon Timeline, Meris Polymoon, Line 6 Helix, TC Electronic
 * 
 * Фичи:
 * • Multi-tap delay line (до 4 tap) с ритмическим spacing
 * • LFO-модуляция delay time (chorus/vibrato)
 * • Tilt EQ в feedback loop
 * • Soft-clip saturation в feedback
 * • Diffusion (all-pass chain) — smear/pre-delay
 * • Ducking (sidechain RMS)
 * • True ping-pong (cross-feedback L/R)
 * • Reverse mode (rolling buffer)
 * • Stereo width (Mid/Side)
 * • Плавная смена времени (интерполированный кольцевой буфер)
 */

import { DELAY_HQ_PROCESSOR_CODE } from './DelayWorklet';
import type { DelayWorkletParams } from './DelayWorklet';

export type DelayHQType =
  | 'digital'
  | 'analog'
  | 'tape'
  | 'pingpong'
  | 'reverse'
  | 'ducked'
  | 'modulated'
  | 'multi-tap'
  | 'shimmer';

export interface DelayHQPreset {
  name: string;
  type: DelayHQType;
  params: Partial<DelayWorkletParams>;
  tapPattern?: number[];
  tapPans?: number[];
  description?: string;
}

export class DelayHQ {
  private ctx: AudioContext;
  private workletNode?: AudioWorkletNode;
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private _active = true;
  private _type: DelayHQType = 'digital';

  // Parameter AudioParams (connected to worklet)
  private params: Map<string, AudioParam> = new Map();

  // Current values (for getter)
  private _values: DelayWorkletParams = {
    delayTime: 0.3,
    feedback: 0.35,
    mix: 0.25,
    modDepth: 0.003,
    modRate: 0.5,
    tilt: 0,
    saturation: 0.2,
    diffusion: 0.15,
    duckingThreshold: 0.0,
    duckingRelease: 0.998,
    reverse: 0,
    pingpong: 0,
    numTaps: 1,
    tapSpacing: 1.0,
    stereoWidth: 1.0,
    active: 1,
  };

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    // Dry path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Wet path will connect after worklet init
    this.dryGain.gain.value = 0.75;
    this.wetGain.gain.value = 0.25;
  }

  /** Загружает и инициализирует AudioWorklet */
  async init(): Promise<void> {
    if (this.workletNode) return;

    // Inline worklet registration via Blob (no separate file needed)
    const blob = new Blob([DELAY_HQ_PROCESSOR_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try {
      await this.ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    this.workletNode = new AudioWorkletNode(this.ctx, 'delay-hq-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      outputChannelCount: [2],
      parameterData: {
        delayTime: this._values.delayTime,
        feedback: this._values.feedback,
        mix: this._values.mix,
        modDepth: this._values.modDepth,
        modRate: this._values.modRate,
        tilt: this._values.tilt,
        saturation: this._values.saturation,
        diffusion: this._values.diffusion,
        duckingThreshold: this._values.duckingThreshold,
        duckingRelease: this._values.duckingRelease,
        reverse: this._values.reverse,
        pingpong: this._values.pingpong,
        numTaps: this._values.numTaps,
        tapSpacing: this._values.tapSpacing,
        stereoWidth: this._values.stereoWidth,
        active: this._values.active,
      },
    });

    // Cache AudioParams
    const p = this.workletNode.parameters;
    [
      'delayTime', 'feedback', 'mix', 'modDepth', 'modRate',
      'tilt', 'saturation', 'diffusion', 'duckingThreshold',
      'duckingRelease', 'reverse', 'pingpong', 'numTaps',
      'tapSpacing', 'stereoWidth', 'active',
    ].forEach((name) => {
      const param = (p as any).get(name);
      if (param) this.params.set(name, param);
    });

    // Connect: input -> worklet -> wetGain -> output
    this.input.connect(this.workletNode);
    this.workletNode.connect(this.wetGain);
    this.wetGain.connect(this.output);

    // Sync dry/wet gains with mix
    this._updateMix(this._values.mix);
  }

  // ─── Parameter setters (with smoothing) ───

  setDelayTime(ms: number, rampSec = 0.05) {
    this._setParam('delayTime', Math.max(20, Math.min(3000, ms)) / 1000, rampSec);
  }

  setFeedback(percent: number, rampSec = 0.02) {
    this._setParam('feedback', Math.max(0, Math.min(99.5, percent)) / 100, rampSec);
  }

  setMix(percent: number, rampSec = 0.05) {
    const mix = Math.max(0, Math.min(100, percent)) / 100;
    this._setParam('mix', mix, rampSec);
    this._updateMix(mix);
  }

  setModulation(depthMs: number, rateHz: number) {
    this._setParam('modDepth', Math.max(0, Math.min(15, depthMs)) / 1000, 0.05);
    this._setParam('modRate', Math.max(0, Math.min(8, rateHz)), 0.05);
  }

  /** Tilt: -1 (dark) .. 0 (neutral) .. 1 (bright) */
  setTilt(tilt: number) {
    this._setParam('tilt', Math.max(-1, Math.min(1, tilt)), 0.02);
  }

  setSaturation(amount: number) {
    this._setParam('saturation', Math.max(0, Math.min(1, amount)), 0.02);
  }

  setDiffusion(amount: number) {
    this._setParam('diffusion', Math.max(0, Math.min(1, amount)), 0.05);
  }

  /** Ducking: threshold 0..1 (normalized), release 0..1 mapped to coef */
  setDucking(threshold: number, release = 0.5) {
    const coef = 0.99 + release * 0.0099; // 0.99 .. 0.9999
    this._setParam('duckingThreshold', Math.max(0, Math.min(1, threshold)), 0.02);
    this._setParam('duckingRelease', coef, 0.02);
  }

  setReverse(enabled: boolean) {
    this._setParam('reverse', enabled ? 1 : 0, 0.01);
  }

  setPingPong(enabled: boolean) {
    this._setParam('pingpong', enabled ? 1 : 0, 0.01);
  }

  setNumTaps(n: number) {
    this._setParam('numTaps', Math.max(1, Math.min(4, Math.round(n))), 0.01);
  }

  setTapSpacing(multiplier: number) {
    this._setParam('tapSpacing', Math.max(0.5, Math.min(2.0, multiplier)), 0.05);
  }

  setStereoWidth(width: number) {
    this._setParam('stereoWidth', Math.max(0, Math.min(1, width)), 0.05);
  }

  /** Отправить кастомный tap pattern в процессор */
  setTapPattern(pattern: number[], pans?: number[]) {
    if (!this.workletNode) return;
    this.workletNode.port.postMessage({
      type: 'pattern',
      pattern: pattern.slice(0, 4),
      pans: pans ? pans.slice(0, 4) : [0, -0.5, 0.5, 0],
    });
  }

  // ─── Type / Presets ───

  get type() {
    return this._type;
  }

  setType(type: DelayHQType) {
    this._type = type;
    const preset = DelayHQ.PRESETS[type];
    if (preset) {
      this.loadPreset(preset);
    }
  }

  loadPreset(preset: DelayHQPreset) {
    const p = preset.params;
    if (p.delayTime !== undefined) this.setDelayTime(p.delayTime * 1000);
    if (p.feedback !== undefined) this.setFeedback(p.feedback * 100);
    if (p.mix !== undefined) this.setMix(p.mix * 100);
    if (p.modDepth !== undefined && p.modRate !== undefined) {
      this.setModulation(p.modDepth * 1000, p.modRate);
    }
    if (p.tilt !== undefined) this.setTilt(p.tilt);
    if (p.saturation !== undefined) this.setSaturation(p.saturation);
    if (p.diffusion !== undefined) this.setDiffusion(p.diffusion);
    if (p.duckingThreshold !== undefined) {
      this.setDucking(p.duckingThreshold, 0.5);
    }
    if (p.reverse !== undefined) this.setReverse(p.reverse > 0.5);
    if (p.pingpong !== undefined) this.setPingPong(p.pingpong > 0.5);
    if (p.numTaps !== undefined) this.setNumTaps(p.numTaps);
    if (p.tapSpacing !== undefined) this.setTapSpacing(p.tapSpacing);
    if (p.stereoWidth !== undefined) this.setStereoWidth(p.stereoWidth);

    if (preset.tapPattern) {
      this.setTapPattern(preset.tapPattern, preset.tapPans);
    }
  }

  // ─── Bypass / Active ───

  bypass() {
    this._active = false;
    this._setParam('active', 0, 0.01);
    this._updateMix(0);
  }

  activate() {
    this._active = true;
    this._setParam('active', 1, 0.01);
    this._updateMix(this._values.mix);
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
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.workletNode?.disconnect();
    this.workletNode = undefined;
  }

  // ─── Private ───

  private _setParam(name: string, value: number, rampSec: number) {
    (this._values as any)[name] = value;
    const param = this.params.get(name);
    if (param) {
      const t = this.ctx.currentTime + rampSec;
      param.setTargetAtTime(value, this.ctx.currentTime, rampSec / 3);
    }
  }

  private _updateMix(mix: number) {
    if (!this._active) {
      this.dryGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.01);
      this.wetGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
      return;
    }
    this.dryGain.gain.setTargetAtTime(1 - mix, this.ctx.currentTime, 0.02);
    this.wetGain.gain.setTargetAtTime(mix, this.ctx.currentTime, 0.02);
  }

  // ─── PRESETS (Line 6 / Strymon / Meris / TC inspired) ───

  static PRESETS: Record<string, DelayHQPreset> = {
    digital: {
      name: 'Digital Clean',
      type: 'digital',
      description: 'Чистый цифровой delay, максимальная прозрачность',
      params: {
        delayTime: 0.3,
        feedback: 0.35,
        mix: 0.25,
        modDepth: 0,
        modRate: 0,
        tilt: 0,
        saturation: 0,
        diffusion: 0.05,
        duckingThreshold: 0,
        reverse: 0,
        pingpong: 0,
        numTaps: 1,
        tapSpacing: 1,
        stereoWidth: 1,
      },
    },

    analog: {
      name: 'Analog Warm',
      type: 'analog',
      description: 'Теплый analog-style с насыщением и темным фильтром',
      params: {
        delayTime: 0.35,
        feedback: 0.45,
        mix: 0.3,
        modDepth: 0.001,
        modRate: 0.3,
        tilt: -0.4,
        saturation: 0.45,
        diffusion: 0.1,
        duckingThreshold: 0,
        reverse: 0,
        pingpong: 0,
        numTaps: 1,
        tapSpacing: 1,
        stereoWidth: 1,
      },
    },

    tape: {
      name: 'Tape Echo',
      type: 'tape',
      description: 'Ленточный echo: wow/flutter, насыщение, lo-fi фильтрация',
      params: {
        delayTime: 0.4,
        feedback: 0.5,
        mix: 0.35,
        modDepth: 0.008,
        modRate: 0.6,
        tilt: -0.6,
        saturation: 0.6,
        diffusion: 0.2,
        duckingThreshold: 0,
        reverse: 0,
        pingpong: 0,
        numTaps: 1,
        tapSpacing: 1,
        stereoWidth: 1,
      },
    },

    pingpong: {
      name: 'Ping-Pong',
      type: 'pingpong',
      description: 'True stereo ping-pong с cross-feedback',
      params: {
        delayTime: 0.35,
        feedback: 0.4,
        mix: 0.3,
        modDepth: 0.002,
        modRate: 0.4,
        tilt: 0.1,
        saturation: 0.15,
        diffusion: 0.1,
        duckingThreshold: 0,
        reverse: 0,
        pingpong: 1,
        numTaps: 1,
        tapSpacing: 1,
        stereoWidth: 1,
      },
    },

    reverse: {
      name: 'Reverse',
      type: 'reverse',
      description: 'Rolling reverse delay (2-sec buffer)',
      params: {
        delayTime: 0.5,
        feedback: 0.3,
        mix: 0.4,
        modDepth: 0,
        modRate: 0,
        tilt: 0.2,
        saturation: 0.2,
        diffusion: 0.15,
        duckingThreshold: 0,
        reverse: 1,
        pingpong: 0,
        numTaps: 1,
        tapSpacing: 1,
        stereoWidth: 1,
      },
    },

    ducked: {
      name: 'Ducked Delay',
      type: 'ducked',
      description: 'Sidechain-автоматика: тише wet когда громкий input',
      params: {
        delayTime: 0.35,
        feedback: 0.5,
        mix: 0.4,
        modDepth: 0.001,
        modRate: 0.2,
        tilt: 0,
        saturation: 0.1,
        diffusion: 0.1,
        duckingThreshold: 0.15,
        duckingRelease: 0.998,
        reverse: 0,
        pingpong: 0,
        numTaps: 1,
        tapSpacing: 1,
        stereoWidth: 1,
      },
    },

    modulated: {
      name: 'Modulated',
      type: 'modulated',
      description: 'Chorus/vibrato в delay line (как Strymon dTape)',
      params: {
        delayTime: 0.45,
        feedback: 0.4,
        mix: 0.35,
        modDepth: 0.012,
        modRate: 1.2,
        tilt: -0.2,
        saturation: 0.25,
        diffusion: 0.15,
        duckingThreshold: 0,
        reverse: 0,
        pingpong: 0,
        numTaps: 1,
        tapSpacing: 1,
        stereoWidth: 1,
      },
    },

    'multi-tap': {
      name: 'Multi-Tap Pattern',
      type: 'multi-tap',
      description: 'Ритмические multi-tap (как Strymon Pattern / Meris Multiply)',
      params: {
        delayTime: 0.25,
        feedback: 0.35,
        mix: 0.35,
        modDepth: 0.003,
        modRate: 0.5,
        tilt: 0.1,
        saturation: 0.1,
        diffusion: 0.25,
        duckingThreshold: 0,
        reverse: 0,
        pingpong: 0,
        numTaps: 4,
        tapSpacing: 1.0,
        stereoWidth: 0.8,
      },
      tapPattern: [1.0, 1.5, 2.0, 2.75],
      tapPans: [0, -0.7, 0.7, 0],
    },

    shimmer: {
      name: 'Shimmer-ish',
      type: 'shimmer',
      description: 'Мульти-tap + модуляция + diffusion для плотного ambient',
      params: {
        delayTime: 0.4,
        feedback: 0.55,
        mix: 0.45,
        modDepth: 0.01,
        modRate: 2.0,
        tilt: 0.3,
        saturation: 0.2,
        diffusion: 0.6,
        duckingThreshold: 0,
        reverse: 0,
        pingpong: 1,
        numTaps: 2,
        tapSpacing: 1.0,
        stereoWidth: 1.2, // >1 expands stereo
      },
      tapPattern: [1.0, 1.33],
      tapPans: [-0.5, 0.5],
    },
  };
}

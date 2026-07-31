/**
 * 📊 CompressorHQ — High-Quality Dynamics Processor
 * Классические топологии: Optical, FET, VCA, Tube, Brickwall
 * 
 * Вдохновлено: UA LA-2A, UREI 1176, SSL G-Bus, Fairchild 670, DBX 160
 * 
 * Фичи:
 * • 8 пресетов классических компрессоров
 * • Feed-forward / Feed-back detector topology
 * • Peak / RMS / Hybrid envelope detection
 * • Program-dependent release (opto-style)
 * • Saturation в gain reduction path
 * • Look-ahead для brickwall limiting
 * • Sidechain HPF (de-essing, bass management)
 * • Parallel mix (New York compression)
 * • GR metering через port message
 */

import { COMPRESSOR_HQ_PROCESSOR_CODE } from './CompressorWorklet';
import type { CompressorWorkletParams } from './CompressorWorklet';

export type CompressorType =
  | 'optical'
  | 'fet'
  | 'vca'
  | 'tube'
  | 'brickwall'
  | 'master-bus'
  | 'punch'
  | 'glue'
  | 'de-esser'
  | 'custom';

export interface CompressorHQPreset {
  name: string;
  type: CompressorType;
  description: string;
  params: Partial<CompressorWorkletParams>;
}

export class CompressorHQ {
  private ctx: AudioContext;
  private workletNode?: AudioWorkletNode;
  private input: GainNode;
  private output: GainNode;
  private _active = true;
  private _type: CompressorType = 'vca';
  private _grDb = 0;

  private params: Map<string, AudioParam> = new Map();
  private _values: CompressorWorkletParams = {
    threshold: -24,
    ratio: 4,
    attack: 3,
    release: 150,
    knee: 10,
    makeupGain: 6,
    mix: 1.0,
    detectorType: 1,  // RMS
    topology: 0,      // Feed-forward
    saturation: 0.1,
    scHpf: 0,
    lookahead: 0,
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

    const blob = new Blob([COMPRESSOR_HQ_PROCESSOR_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try {
      await this.ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    this.workletNode = new AudioWorkletNode(this.ctx, 'compressor-hq-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      outputChannelCount: [2],
      parameterData: {
        threshold: this._values.threshold,
        ratio: this._values.ratio,
        attack: this._values.attack,
        release: this._values.release,
        knee: this._values.knee,
        makeupGain: this._values.makeupGain,
        mix: this._values.mix,
        detectorType: this._values.detectorType,
        topology: this._values.topology,
        saturation: this._values.saturation,
        scHpf: this._values.scHpf,
        lookahead: this._values.lookahead,
        active: this._values.active,
      },
    });

    // GR metering
    this.workletNode.port.onmessage = (e) => {
      if (e.data.type === 'gr') {
        this._grDb = e.data.value;
      }
    };

    // Cache AudioParams
    const p = this.workletNode.parameters;
    [
      'threshold', 'ratio', 'attack', 'release', 'knee',
      'makeupGain', 'mix', 'detectorType', 'topology',
      'saturation', 'scHpf', 'lookahead', 'active',
    ].forEach((name) => {
      const param = (p as any).get(name);
      if (param) this.params.set(name, param);
    });

    this.input.connect(this.workletNode);
    this.workletNode.connect(this.output);
  }

  // ─── Parameter setters ───

  setThreshold(db: number, rampSec = 0.02) {
    this._setParam('threshold', Math.max(-60, Math.min(0, db)), rampSec);
  }

  setRatio(ratio: number, rampSec = 0.02) {
    this._setParam('ratio', Math.max(1, Math.min(50, ratio)), rampSec);
  }

  setAttack(ms: number, rampSec = 0.02) {
    this._setParam('attack', Math.max(0.01, Math.min(100, ms)), rampSec);
  }

  setRelease(ms: number, rampSec = 0.02) {
    this._setParam('release', Math.max(1, Math.min(3000, ms)), rampSec);
  }

  setKnee(db: number, rampSec = 0.02) {
    this._setParam('knee', Math.max(0, Math.min(40, db)), rampSec);
  }

  setMakeupGain(db: number, rampSec = 0.05) {
    this._setParam('makeupGain', Math.max(0, Math.min(24, db)), rampSec);
  }

  /** Parallel mix: 0 = dry only, 1 = compressed only */
  setMix(mix: number, rampSec = 0.05) {
    this._setParam('mix', Math.max(0, Math.min(1, mix)), rampSec);
  }

  /** Detector: 'peak' | 'rms' | 'hybrid' */
  setDetector(type: 'peak' | 'rms' | 'hybrid') {
    const val = type === 'peak' ? 0 : type === 'rms' ? 1 : 2;
    this._setParam('detectorType', val, 0.01);
  }

  /** Topology: 'feed-forward' | 'feed-back' */
  setTopology(type: 'feed-forward' | 'feed-back') {
    this._setParam('topology', type === 'feed-back' ? 1 : 0, 0.01);
  }

  setSaturation(amount: number, rampSec = 0.02) {
    this._setParam('saturation', Math.max(0, Math.min(1, amount)), rampSec);
  }

  /** Sidechain HPF: 0 = off, >20 Hz = filter bass from detector */
  setSidechainHpf(freq: number, rampSec = 0.02) {
    this._setParam('scHpf', Math.max(0, Math.min(1000, freq)), rampSec);
  }

  /** Look-ahead: 0 = off, up to 10ms (adds latency!) */
  setLookahead(ms: number, rampSec = 0.02) {
    this._setParam('lookahead', Math.max(0, Math.min(10, ms)), rampSec);
  }

  // ─── Type / Presets ───

  get type() {
    return this._type;
  }

  setType(type: CompressorType) {
    this._type = type;
    const preset = CompressorHQ.PRESETS[type];
    if (preset) {
      this.loadPreset(preset);
    }
  }

  loadPreset(preset: CompressorHQPreset) {
    const p = preset.params;
    if (p.threshold !== undefined) this.setThreshold(p.threshold);
    if (p.ratio !== undefined) this.setRatio(p.ratio);
    if (p.attack !== undefined) this.setAttack(p.attack);
    if (p.release !== undefined) this.setRelease(p.release);
    if (p.knee !== undefined) this.setKnee(p.knee);
    if (p.makeupGain !== undefined) this.setMakeupGain(p.makeupGain);
    if (p.mix !== undefined) this.setMix(p.mix);
    if (p.detectorType !== undefined) {
      const dt = p.detectorType === 0 ? 'peak' : p.detectorType === 1 ? 'rms' : 'hybrid';
      this.setDetector(dt);
    }
    if (p.topology !== undefined) {
      const top = p.topology === 1 ? 'feed-back' : 'feed-forward';
      this.setTopology(top);
    }
    if (p.saturation !== undefined) this.setSaturation(p.saturation);
    if (p.scHpf !== undefined) this.setSidechainHpf(p.scHpf);
    if (p.lookahead !== undefined) this.setLookahead(p.lookahead);
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
    this._setParam('mix', this._values.mix, 0.01);
  }

  get active() {
    return this._active;
  }

  /** Текущий gain reduction в dB (negative = compression) */
  getReduction(): number {
    return this._grDb;
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

  // ─── PRESETS (классические компрессоры) ───

  static PRESETS: Record<string, CompressorHQPreset> = {
    optical: {
      name: 'Optical (LA-2A)',
      type: 'optical',
      description: 'Мягкий, музыкальный opto-компрессор. Медленный attack, program-dependent release. Идеален для вокала и баса.',
      params: {
        threshold: -18,
        ratio: 3,
        attack: 10,
        release: 200,
        knee: 20,
        makeupGain: 4,
        mix: 1,
        detectorType: 1,  // RMS
        topology: 1,      // Feed-back (как LA-2A)
        saturation: 0.35,
        scHpf: 0,
        lookahead: 0,
      },
    },

    fet: {
      name: 'FET (1176)',
      type: 'fet',
      description: 'Агрессивный, быстрый FET-компрессор. Punchy drums, vocals, bass. Feed-back topology.',
      params: {
        threshold: -12,
        ratio: 8,
        attack: 0.5,
        release: 50,
        knee: 2,
        makeupGain: 3,
        mix: 1,
        detectorType: 0,  // Peak
        topology: 1,      // Feed-back
        saturation: 0.5,
        scHpf: 0,
        lookahead: 0,
      },
    },

    vca: {
      name: 'VCA (SSL/DBX)',
      type: 'vca',
      description: 'Чистый, прозрачный VCA-компрессор. Feed-forward, быстрый, точный. Bus compression.',
      params: {
        threshold: -20,
        ratio: 4,
        attack: 1,
        release: 120,
        knee: 6,
        makeupGain: 4,
        mix: 1,
        detectorType: 2,  // Hybrid
        topology: 0,      // Feed-forward
        saturation: 0.05,
        scHpf: 120,
        lookahead: 0,
      },
    },

    tube: {
      name: 'Tube (Vari-Mu)',
      type: 'tube',
      description: 'Теплый, плавный tube-компрессор. Slow attack, smooth release. Мастеринг, микс.',
      params: {
        threshold: -16,
        ratio: 2.5,
        attack: 15,
        release: 400,
        knee: 25,
        makeupGain: 3,
        mix: 1,
        detectorType: 1,  // RMS
        topology: 1,      // Feed-back
        saturation: 0.6,
        scHpf: 0,
        lookahead: 0,
      },
    },

    brickwall: {
      name: 'Brickwall Limiter',
      type: 'brickwall',
      description: 'Жесткий brickwall лимитер с look-ahead. Защита от клиппинга.',
      params: {
        threshold: -3,
        ratio: 50,
        attack: 0.01,
        release: 30,
        knee: 0,
        makeupGain: 0,
        mix: 1,
        detectorType: 0,  // Peak
        topology: 0,      // Feed-forward
        saturation: 0,
        scHpf: 0,
        lookahead: 5,
      },
    },

    'master-bus': {
      name: 'Master Bus',
      type: 'master-bus',
      description: 'Мягкое glue для мастер-шины. Низкий ratio, slow attack, auto-release.',
      params: {
        threshold: -22,
        ratio: 2,
        attack: 20,
        release: 250,
        knee: 15,
        makeupGain: 2,
        mix: 1,
        detectorType: 1,  // RMS
        topology: 0,      // Feed-forward
        saturation: 0.15,
        scHpf: 80,
        lookahead: 0,
      },
    },

    punch: {
      name: 'Punch',
      type: 'punch',
      description: 'FET-style punch для ударных. Быстрый attack, medium release, parallel mix.',
      params: {
        threshold: -10,
        ratio: 6,
        attack: 2,
        release: 80,
        knee: 4,
        makeupGain: 2,
        mix: 0.7,         // Parallel
        detectorType: 0,  // Peak
        topology: 1,      // Feed-back
        saturation: 0.4,
        scHpf: 0,
        lookahead: 0,
      },
    },

    glue: {
      name: 'Glue',
      type: 'glue',
      description: 'VCA bus compression. Низкий ratio, medium attack, низкая сатурация.',
      params: {
        threshold: -18,
        ratio: 2.5,
        attack: 10,
        release: 200,
        knee: 12,
        makeupGain: 2.5,
        mix: 1,
        detectorType: 1,  // RMS
        topology: 0,      // Feed-forward
        saturation: 0.1,
        scHpf: 100,
        lookahead: 0,
      },
    },

    'de-esser': {
      name: 'De-esser',
      type: 'de-esser',
      description: 'Компрессор с sidechain HPF для подавления сибилянтов.',
      params: {
        threshold: -20,
        ratio: 6,
        attack: 1,
        release: 60,
        knee: 6,
        makeupGain: 1,
        mix: 1,
        detectorType: 0,  // Peak
        topology: 0,      // Feed-forward
        saturation: 0,
        scHpf: 5000,      // Only highs trigger compression
        lookahead: 1,
      },
    },

    custom: {
      name: 'Custom',
      type: 'custom',
      description: 'Пользовательские настройки',
      params: {
        threshold: -24,
        ratio: 4,
        attack: 3,
        release: 150,
        knee: 10,
        makeupGain: 6,
        mix: 1,
        detectorType: 1,
        topology: 0,
        saturation: 0.1,
        scHpf: 0,
        lookahead: 0,
      },
    },
  };
}

// ─── Упрощенный Limiter на базе CompressorHQ ───

export class LimiterHQ {
  private comp: CompressorHQ;

  constructor(ctx: AudioContext) {
    this.comp = new CompressorHQ(ctx);
  }

  async init() {
    await this.comp.init();
    this.comp.setType('brickwall');
  }

  setThreshold(db: number) {
    this.comp.setThreshold(db);
  }

  setCeiling(db: number) {
    // Ceiling = threshold + makeup
    const currentThresh = this.comp['params'].get('threshold')?.value ?? -3;
    const makeup = db - currentThresh;
    this.comp.setMakeupGain(Math.max(0, makeup));
  }

  getReduction(): number {
    return this.comp.getReduction();
  }

  bypass() { this.comp.bypass(); }
  activate() { this.comp.activate(); }

  getInputNode(): AudioNode { return this.comp.getInputNode(); }
  getOutputNode(): AudioNode { return this.comp.getOutputNode(); }

  dispose() { this.comp.dispose(); }
}

/**
 * 🎛️ Distortion / Overdrive / Fuzz — гитарный драйв
 * Использует WaveShaperNode для нелинейного искажения
 */

export type DistortionType = 'overdrive' | 'distortion' | 'fuzz' | 'crunch' | 'metal';

export interface DistortionParams {
  type: DistortionType;
  drive: number;     // 0-100
  tone: number;      // 0-100 (low-pass filter)
  output: number;    // -20 to +20 dB
  active: boolean;
}

export class DistortionEffect {
  private input: GainNode;
  private output: GainNode;
  private waveshaper: WaveShaperNode;
  private toneFilter: BiquadFilterNode;
  private gain: GainNode;
  private _params: DistortionParams;

  constructor(ctx: AudioContext) {
    this._params = {
      type: 'overdrive',
      drive: 40,
      tone: 60,
      output: 0,
      active: true
    };

    this.input = ctx.createGain();
    this.gain = ctx.createGain();
    this.waveshaper = ctx.createWaveShaper();
    this.toneFilter = ctx.createBiquadFilter();
    this.output = ctx.createGain();

    // Соединение: input → gain → waveshaper → toneFilter → output
    this.input.connect(this.gain);
    this.gain.connect(this.waveshaper);
    this.waveshaper.connect(this.toneFilter);
    this.toneFilter.connect(this.output);

    this.updateParams();
  }

  get params(): DistortionParams {
    return { ...this._params };
  }

  setParams(p: Partial<DistortionParams>) {
    Object.assign(this._params, p);
    this.updateParams();
  }

  getInputNode(): AudioNode {
    return this.input;
  }

  getOutputNode(): AudioNode {
    return this.output;
  }

  bypass() {
    this._params.active = false;
    this.gain.gain.value = 0;
  }

  activate() {
    this._params.active = true;
    this.updateParams();
  }

  private updateParams() {
    if (!this._params.active) {
      this.gain.gain.value = 0;
      return;
    }

    // Drive → предусиление
    const driveDb = (this._params.drive / 100) * 40; // 0-40 dB
    this.gain.gain.value = Math.pow(10, driveDb / 20);

    // WaveShaper curve
    const samples = 4096;
    const curve = new Float32Array(samples);
    const drive = this._params.drive / 100;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1; // -1 to 1
      
      let y: number;
      switch (this._params.type) {
        case 'overdrive':
          // Мягкое насыщение (tanh)
          y = Math.tanh(x * (1 + drive * 5)) / Math.tanh(1 + drive * 5);
          break;
        case 'crunch':
          // Среднее насыщение
          y = (1 + drive * 3) * x / (1 + Math.abs(x) * drive * 3);
          break;
        case 'distortion':
          // Жесткое (hard clip)
          const threshold = 0.3 - drive * 0.25;
          y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) / threshold));
          y = y / (1 - Math.exp(-1 / threshold));
          break;
        case 'metal':
          // Очень жесткое
          const th = 0.15 - drive * 0.12;
          y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) / Math.max(th, 0.01)));
          y = y / (1 - Math.exp(-1 / Math.max(th, 0.01)));
          // Добавляем четные гармоники
          y = y * 0.7 + Math.sign(x) * Math.pow(Math.abs(x), 0.5) * 0.3;
          break;
        case 'fuzz':
          // Fuzz — ступенчатое искажение
          const bits = Math.max(2, 8 - drive * 7);
          const step = 2 / Math.pow(2, bits);
          y = Math.round(x / step) * step;
          break;
        default:
          y = x;
      }
      
      curve[i] = Math.max(-1, Math.min(1, y));
    }
    this.waveshaper.curve = curve;
    this.waveshaper.oversample = '4x';

    // Tone filter (low-pass)
    const toneFreq = 200 + (this._params.tone / 100) * 8000;
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = toneFreq;
    this.toneFilter.Q.value = 0.7;

    // Output gain
    const outputDb = this._params.output;
    this.output.gain.value = Math.pow(10, outputDb / 20);
  }

  dispose() {
    this.input.disconnect();
    this.gain.disconnect();
    this.waveshaper.disconnect();
    this.toneFilter.disconnect();
    this.output.disconnect();
  }
}

export function createDistortionCurve(type: DistortionType, drive: number): Float32Array {
  const samples = 4096;
  const curve = new Float32Array(samples);
  const d = drive / 100;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    let y: number;

    switch (type) {
      case 'overdrive':
        y = Math.tanh(x * (1 + d * 5)) / Math.tanh(1 + d * 5);
        break;
      case 'crunch':
        y = (1 + d * 3) * x / (1 + Math.abs(x) * d * 3);
        break;
      case 'distortion':
        const threshold = 0.3 - d * 0.25;
        y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) / Math.max(threshold, 0.01)));
        y = y / (1 - Math.exp(-1 / Math.max(threshold, 0.01)));
        break;
      case 'metal':
        const th = 0.15 - d * 0.12;
        y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) / Math.max(th, 0.01)));
        y = y / (1 - Math.exp(-1 / Math.max(th, 0.01)));
        y = y * 0.7 + Math.sign(x) * Math.pow(Math.abs(x), 0.5) * 0.3;
        break;
      case 'fuzz':
        const bits = Math.max(2, 8 - d * 7);
        const step = 2 / Math.pow(2, bits);
        y = Math.round(x / step) * step;
        break;
      default:
        y = x;
    }
    curve[i] = Math.max(-1, Math.min(1, y));
  }

  return curve;
}

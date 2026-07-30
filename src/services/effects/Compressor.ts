/**
 * 📊 Compressor — динамическая обработка
 * Компрессор с ratio, threshold, attack, release, knee
 */

export interface CompressorParams {
  threshold: number;  // -60 to 0 dB
  ratio: number;      // 1:1 to 20:1
  attack: number;     // 0.1 - 50 ms
  release: number;    // 10 - 1000 ms
  knee: number;       // 0-40 dB (soft knee)
  makeupGain: number; // 0-20 dB
  active: boolean;
}

export class CompressorEffect {
  private input: GainNode;
  private output: GainNode;
  private compressor: DynamicsCompressorNode;
  private makeupGainNode: GainNode;
  private _params: CompressorParams;

  constructor(ctx: AudioContext) {
    this._params = {
      threshold: -24,
      ratio: 4,
      attack: 3,
      release: 150,
      knee: 10,
      makeupGain: 6,
      active: true
    };

    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.compressor = ctx.createDynamicsCompressor();
    this.makeupGainNode = ctx.createGain();

    // input → compressor → makeupGain → output
    this.input.connect(this.compressor);
    this.compressor.connect(this.makeupGainNode);
    this.makeupGainNode.connect(this.output);

    this.updateParams();
  }

  get params(): CompressorParams {
    return { ...this._params };
  }

  setParams(p: Partial<CompressorParams>) {
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
    this.makeupGainNode.gain.value = 0;
  }

  activate() {
    this._params.active = true;
    this.updateParams();
  }

  private updateParams() {
    if (!this._params.active) {
      this.makeupGainNode.gain.value = 0;
      this.input.gain.value = 1;
      return;
    }

    this.compressor.threshold.value = this._params.threshold;
    this.compressor.ratio.value = this._params.ratio;
    this.compressor.attack.value = this._params.attack / 1000;
    this.compressor.release.value = this._params.release / 1000;
    this.compressor.knee.value = this._params.knee;

    // Makeup gain
    const makeupDb = this._params.makeupGain;
    this.makeupGainNode.gain.value = Math.pow(10, makeupDb / 20);
  }

  getReduction(): number {
    // Web Audio API не дает прямого доступа к GR,
    // но можно вычислить приблизительно
    return 0;
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.compressor.disconnect();
    this.makeupGainNode.disconnect();
  }
}

/**
 * 🎚️ Limiter — жесткий лимитер (частный случай компрессора)
 */
export class LimiterEffect {
  private input: GainNode;
  private output: GainNode;
  private compressor: DynamicsCompressorNode;
  private makeupGainNode: GainNode;
  private _active: boolean = true;
  private _params: { threshold: number; ratio: number; attack: number; release: number } = {
    threshold: -3,
    ratio: 20,
    attack: 1,
    release: 50,
  };

  constructor(ctx: AudioContext) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.compressor = ctx.createDynamicsCompressor();
    this.makeupGainNode = ctx.createGain();

    this.compressor.threshold.value = -3;
    this.compressor.ratio.value = 20;
    this.compressor.attack.value = 0.001;
    this.compressor.release.value = 0.05;
    this.compressor.knee.value = 0;

    this.input.connect(this.compressor);
    this.compressor.connect(this.makeupGainNode);
    this.makeupGainNode.connect(this.output);
    this.makeupGainNode.gain.value = 1;
  }

  get params() { return { ...this._params }; }

  setParams(p: Partial<{ threshold: number; ratio: number; attack: number; release: number }>) {
    Object.assign(this._params, p);
    if (p.threshold !== undefined) this.compressor.threshold.value = p.threshold;
    if (p.ratio !== undefined) this.compressor.ratio.value = p.ratio;
    if (p.attack !== undefined) this.compressor.attack.value = p.attack / 1000;
    if (p.release !== undefined) this.compressor.release.value = p.release / 1000;
  }

  getInputNode(): AudioNode { return this.input; }
  getOutputNode(): AudioNode { return this.output; }

  bypass() { this._active = false; this.makeupGainNode.gain.value = 0; }
  activate() { this._active = true; this.makeupGainNode.gain.value = 1; }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.compressor.disconnect();
    this.makeupGainNode.disconnect();
  }
}

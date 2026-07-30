/**
 * 😎 Wah-Wah — эффект "вау-вау"
 * Auto-wah с LFO + ручной режим (контроллер)
 */

export type WahMode = 'auto' | 'manual' | 'envelope';

export interface WahWahParams {
  mode: WahMode;
  frequency: number;   // 300-2000 Hz (базовая частота фильтра)
  q: number;           // 0.5-20 (резонанс)
  rate: number;        // 0.1-10 Hz (для auto mode)
  depth: number;       // 0-100 (глубина модуляции)
  mix: number;         // 0-100 (wet/dry)
  active: boolean;
  // Для ручного режима
  pedalPosition: number; // 0-100 (позиция педали)
}

export class WahWahEffect {
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private filter: BiquadFilterNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private lfoOffset: GainNode;
  private envelopeFollower: GainNode;
  private _params: WahWahParams;

  constructor(ctx: AudioContext) {
    this._params = {
      mode: 'auto',
      frequency: 600,
      q: 5,
      rate: 1.5,
      depth: 60,
      mix: 100,
      active: true,
      pedalPosition: 50
    };

    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.lfo = ctx.createOscillator();
    this.lfoGain = ctx.createGain();
    this.lfoOffset = ctx.createGain();
    this.envelopeFollower = ctx.createGain();

    // Dry
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Wet: input → filter → wetGain → output
    this.input.connect(this.filter);
    this.filter.connect(this.wetGain);
    this.wetGain.connect(this.output);

    // LFO → lfoGain → filter.frequency
    this.lfo.type = 'sine';
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfoOffset.gain.value = 1;
    this.lfoOffset.connect(this.filter.frequency);

    // Envelope follower (for envelope mode)
    this.input.connect(this.envelopeFollower);
    this.envelopeFollower.connect(this.filter.frequency);

    this.lfo.start();
    this.updateParams();
  }

  get params(): WahWahParams {
    return { ...this._params };
  }

  setParams(p: Partial<WahWahParams>) {
    Object.assign(this._params, p);
    this.updateParams();
  }

  getInputNode(): AudioNode {
    return this.input;
  }

  getOutputNode(): AudioNode {
    return this.output;
  }

  setPedal(pos: number) {
    this._params.pedalPosition = Math.max(0, Math.min(100, pos));
    if (this._params.mode === 'manual') {
      this.updateFilterFrequency();
    }
  }

  bypass() {
    this._params.active = false;
    this.wetGain.gain.value = 0;
    this.dryGain.gain.value = 1;
  }

  activate() {
    this._params.active = true;
    this.updateParams();
  }

  private updateParams() {
    if (!this._params.active) {
      this.wetGain.gain.value = 0;
      this.dryGain.gain.value = 1;
      return;
    }

    const mix = this._params.mix / 100;
    this.dryGain.gain.value = 1 - mix;
    this.wetGain.gain.value = mix;

    // Filter type
    this.filter.type = 'bandpass';
    this.filter.Q.value = this._params.q;

    // LFO settings
    this.lfo.frequency.value = this._params.rate;
    this.lfoGain.gain.value = 0; // default: no modulation

    this.envelopeFollower.gain.value = 0; // default: no envelope

    switch (this._params.mode) {
      case 'auto':
        this.lfoGain.gain.value = (this._params.depth / 100) * 1500;
        this.updateFilterFrequency();
        break;
      case 'manual':
        this.lfoGain.gain.value = 0;
        this.updateFilterFrequency();
        break;
      case 'envelope':
        this.lfoGain.gain.value = 0;
        this.envelopeFollower.gain.value = (this._params.depth / 100) * 2000;
        break;
    }
  }

  private updateFilterFrequency() {
    if (this._params.mode === 'manual') {
      const minFreq = 300;
      const maxFreq = 2000;
      const freq = minFreq + (this._params.pedalPosition / 100) * (maxFreq - minFreq);
      this.filter.frequency.value = freq;
      this.lfoOffset.gain.value = 0;
    } else {
      const base = this._params.frequency;
      this.filter.frequency.value = base;
      this.lfoOffset.gain.value = base;
    }
  }

  dispose() {
    this.lfo.stop();
    this.input.disconnect();
    this.output.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.filter.disconnect();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.lfoOffset.disconnect();
    this.envelopeFollower.disconnect();
  }
}

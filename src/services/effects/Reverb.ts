/**
 * 🌊 Reverb — эффект реверберации
 * Алгоритмический ревербератор (Schroeder) с поддержкой Convolver
 */

export type ReverbType = 'room' | 'hall' | 'plate' | 'spring' | 'cathedral' | 'ambient';

export interface ReverbParams {
  type: ReverbType;
  decay: number;      // 0.1 - 10s
  preDelay: number;   // 0-200 ms
  damping: number;    // 0-100
  mix: number;        // 0-100 (wet/dry)
  roomSize: number;   // 0-100
  active: boolean;
}

export class ReverbEffect {
  private ctx: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private preDelay: DelayNode;
  private lowpass1: BiquadFilterNode;
  private lowpass2: BiquadFilterNode;
  private lowpass3: BiquadFilterNode;
  private lowpass4: BiquadFilterNode;
  private feedback1: GainNode;
  private feedback2: GainNode;
  private feedback3: GainNode;
  private feedback4: GainNode;
  private _params: ReverbParams;

  // Schroeder reverberator: 4 parallel comb filters → 2 all-pass filters
  private combDelays: DelayNode[] = [];
  private combFeedbacks: GainNode[] = [];
  private allpassDelays: DelayNode[] = [];
  private allpassFeedbacks: GainNode[] = [];

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this._params = {
      type: 'hall',
      decay: 2.0,
      preDelay: 30,
      damping: 40,
      mix: 30,
      roomSize: 60,
      active: true
    };

    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.preDelay = ctx.createDelay(1);
    this.lowpass1 = ctx.createBiquadFilter();
    this.lowpass2 = ctx.createBiquadFilter();
    this.lowpass3 = ctx.createBiquadFilter();
    this.lowpass4 = ctx.createBiquadFilter();
    this.feedback1 = ctx.createGain();
    this.feedback2 = ctx.createGain();
    this.feedback3 = ctx.createGain();
    this.feedback4 = ctx.createGain();

    // Dry chain
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Wet chain: input → preDelay → comb filters → all-pass filters → wetGain → output
    this.input.connect(this.preDelay);

    // 4 comb filters with different delay times
    const combTimes = [0.0297, 0.0371, 0.0411, 0.0437];
    const allpassTimes = [0.005, 0.0017];

    for (let i = 0; i < 4; i++) {
      const delay = ctx.createDelay(0.1);
      delay.delayTime.value = combTimes[i];
      const fb = ctx.createGain();
      fb.gain.value = 0.6;
      
      this.preDelay.connect(delay);
      delay.connect(this[`lowpass${i + 1}` as keyof this] as BiquadFilterNode);
      const lp = this[`lowpass${i + 1}` as keyof this] as BiquadFilterNode;
      lp.connect(fb);
      fb.connect(delay); // feedback loop
      lp.connect(this.wetGain); // output tap

      this.combDelays.push(delay);
      this.combFeedbacks.push(fb);
    }

    // All-pass filters for density
    for (let i = 0; i < 2; i++) {
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = allpassTimes[i];
      const fb = ctx.createGain();
      fb.gain.value = 0.3;

      this.wetGain.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(this.output);

      this.allpassDelays.push(delay);
      this.allpassFeedbacks.push(fb);
    }

    this.wetGain.connect(this.output);

    this.updateParams();
  }

  get params(): ReverbParams {
    return { ...this._params };
  }

  setParams(p: Partial<ReverbParams>) {
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

    // Pre-delay
    this.preDelay.delayTime.value = this._params.preDelay / 1000;

    // Decay — feedback of comb filters
    const decay = this._params.decay;
    const baseFb = Math.pow(0.001, 1 / (decay * this.ctx.sampleRate * 0.03));
    
    for (let i = 0; i < 4; i++) {
      this.combFeedbacks[i].gain.value = baseFb * (1 + this._params.roomSize / 100 * 0.2);
    }

    // Damping — lowpass filters
    const damping = this._params.damping / 100;
    const dampingFreq = 2000 + (1 - damping) * 18000;
    
    for (let i = 0; i < 4; i++) {
      const lp = this[`lowpass${i + 1}` as keyof this] as BiquadFilterNode;
      lp.type = 'lowpass';
      lp.frequency.value = dampingFreq;
      lp.Q.value = 0.5;
    }

    // Type presets
    switch (this._params.type) {
      case 'room':
        this.preDelay.delayTime.value = 0.01;
        this.combFeedbacks.forEach(fb => fb.gain.value *= 0.7);
        break;
      case 'hall':
        // Default — already set
        break;
      case 'plate':
        this.preDelay.delayTime.value = 0.005;
        this.combDelays.forEach((d, i) => d.delayTime.value = [0.025, 0.031, 0.035, 0.039][i]);
        break;
      case 'spring':
        this.preDelay.delayTime.value = 0.002;
        this.combFeedbacks.forEach(fb => fb.gain.value *= 0.5);
        break;
      case 'cathedral':
        this.preDelay.delayTime.value = 0.05;
        this.combDelays.forEach((d, i) => d.delayTime.value = [0.04, 0.048, 0.052, 0.058][i]);
        this.combFeedbacks.forEach(fb => fb.gain.value *= 1.3);
        break;
      case 'ambient':
        this.preDelay.delayTime.value = 0.02;
        this.combDelays.forEach((d, i) => d.delayTime.value = [0.035, 0.042, 0.048, 0.055][i]);
        this.combFeedbacks.forEach(fb => fb.gain.value *= 1.1);
        break;
    }
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.preDelay.disconnect();
    this.combDelays.forEach(d => d.disconnect());
    this.combFeedbacks.forEach(fb => fb.disconnect());
    this.allpassDelays.forEach(d => d.disconnect());
    this.allpassFeedbacks.forEach(fb => fb.disconnect());
    for (let i = 1; i <= 4; i++) {
      const lp = this[`lowpass${i}` as keyof this] as BiquadFilterNode;
      if (lp) lp.disconnect();
      const fb = this[`feedback${i}` as keyof this] as GainNode;
      if (fb) fb.disconnect();
    }
  }
}

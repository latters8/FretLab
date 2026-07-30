/**
 * 🌊 Chorus / Flanger / Phaser — модуляционные эффекты
 * Использует LFO для модуляции задержки и фильтров
 */

export type ModulationType = 'chorus' | 'flanger' | 'phaser' | 'vibrato' | 'tremolo';

export interface ChorusParams {
  type: ModulationType;
  rate: number;       // 0.1 - 10 Hz
  depth: number;      // 0-100
  mix: number;        // 0-100 (wet/dry)
  feedback: number;   // 0-100
  delay: number;      // 0.1 - 30 ms (base delay for chorus/flanger)
  active: boolean;
}

export class ChorusEffect {
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private delayNode: DelayNode;
  private lfoGain: GainNode;
  private feedbackGain: GainNode;
  private lfo: OscillatorNode;
  private _params: ChorusParams;

  // For phaser
  private phaserFilters: BiquadFilterNode[] = [];
  private phaserLfoGain: GainNode;

  constructor(ctx: AudioContext) {
    this._params = {
      type: 'chorus',
      rate: 1.5,
      depth: 50,
      mix: 40,
      feedback: 20,
      delay: 8,
      active: true
    };

    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.delayNode = ctx.createDelay(0.1);
    this.lfoGain = ctx.createGain();
    this.feedbackGain = ctx.createGain();
    this.lfo = ctx.createOscillator();
    this.phaserLfoGain = ctx.createGain();

    // Dry
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Wet: input → delay → wetGain → output
    // Feedback: delay → feedbackGain → delay (loop)
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.output);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    // LFO → lfoGain → delay.delayTime (модуляция)
    this.lfo.type = 'sine';
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);

    // Phaser filters (6 all-pass filters)
    for (let i = 0; i < 6; i++) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.value = 400 + i * 300;
      filter.Q.value = 0.7;
      this.phaserFilters.push(filter);
    }
    this.lfo.connect(this.phaserLfoGain);
    this.phaserLfoGain.connect(this.phaserFilters[0].frequency);

    this.lfo.start();
    this.updateParams();
  }

  get params(): ChorusParams {
    return { ...this._params };
  }

  setParams(p: Partial<ChorusParams>) {
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

    // LFO rate
    this.lfo.frequency.value = this._params.rate;

    // Feedback
    this.feedbackGain.gain.value = this._params.feedback / 100 * 0.8;

    // Type-specific params
    switch (this._params.type) {
      case 'chorus':
        this.delayNode.delayTime.value = 0.008 + (this._params.delay / 100) * 0.015;
        this.lfoGain.gain.value = (this._params.depth / 100) * 0.003;
        this.lfo.type = 'sine';
        break;
      case 'flanger':
        this.delayNode.delayTime.value = 0.001 + (this._params.delay / 100) * 0.005;
        this.lfoGain.gain.value = (this._params.depth / 100) * 0.005;
        this.lfo.type = 'triangle';
        this.feedbackGain.gain.value = Math.min(0.7, this._params.feedback / 100 * 1.2);
        break;
      case 'phaser':
        this.delayNode.delayTime.value = 0.001;
        this.lfoGain.gain.value = 0;
        this.phaserLfoGain.gain.value = (this._params.depth / 100) * 3000;
        this.lfo.type = 'sine';
        // Connect phaser filters in chain
        this.input.disconnect();
        this.input.connect(this.phaserFilters[0]);
        for (let i = 0; i < 5; i++) {
          this.phaserFilters[i].connect(this.phaserFilters[i + 1]);
        }
        this.phaserFilters[5].connect(this.wetGain);
        this.phaserFilters[5].connect(this.feedbackGain);
        this.feedbackGain.connect(this.phaserFilters[0]);
        break;
      case 'vibrato':
        this.delayNode.delayTime.value = 0.003;
        this.lfoGain.gain.value = (this._params.depth / 100) * 0.004;
        this.dryGain.gain.value = 0; // 100% wet for vibrato
        this.wetGain.gain.value = 1;
        this.lfo.type = 'sine';
        break;
      case 'tremolo':
        this.delayNode.delayTime.value = 0.001;
        this.lfoGain.gain.value = 0;
        // For tremolo: modulate gain instead of delay
        this.dryGain.gain.value = 0.5 + (1 - this._params.mix / 100) * 0.5;
        this.wetGain.gain.value = 0.5 + (this._params.mix / 100) * 0.5;
        // Use LFO to modulate volume
        this.lfo.type = 'sine';
        break;
    }
  }

  dispose() {
    this.lfo.stop();
    this.input.disconnect();
    this.output.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.lfoGain.disconnect();
    this.lfo.disconnect();
    this.phaserFilters.forEach(f => f.disconnect());
    this.phaserLfoGain.disconnect();
  }
}

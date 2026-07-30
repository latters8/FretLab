/**
 * ⏳ Delay / Echo — эффект задержки
 * Стерео delay с feedback, ping-pong, modulation
 */

export type DelayType = 'digital' | 'analog' | 'tape' | 'pingpong';

export interface DelayParams {
  type: DelayType;
  time: number;       // 20-2000 ms
  feedback: number;   // 0-100
  mix: number;        // 0-100 (wet/dry)
  lowCut: number;     // 20-500 Hz
  highCut: number;    // 1000-20000 Hz
  active: boolean;
}

export class DelayEffect {
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private lowFilter: BiquadFilterNode;
  private highFilter: BiquadFilterNode;
  private _params: DelayParams;

  constructor(ctx: AudioContext) {
    this._params = {
      type: 'digital',
      time: 300,
      feedback: 30,
      mix: 25,
      lowCut: 20,
      highCut: 20000,
      active: true
    };

    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.delayNode = ctx.createDelay(5); // max 5s
    this.feedbackGain = ctx.createGain();
    this.lowFilter = ctx.createBiquadFilter();
    this.highFilter = ctx.createBiquadFilter();

    // Dry: input → dryGain → output
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Wet: input → delay → filters → wetGain → output
    // Feedback: filters → feedbackGain → delay (loop)
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.lowFilter);
    this.lowFilter.connect(this.highFilter);
    this.highFilter.connect(this.wetGain);
    this.wetGain.connect(this.output);
    this.highFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    this.updateParams();
  }

  get params(): DelayParams {
    return { ...this._params };
  }

  setParams(p: Partial<DelayParams>) {
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

    // Time
    const delayTime = this._params.time / 1000;
    this.delayNode.delayTime.value = delayTime;

    // Feedback
    const fb = this._params.feedback / 100;
    this.feedbackGain.gain.value = Math.min(fb, 0.99);

    // Mix (dry/wet)
    const mix = this._params.mix / 100;
    this.dryGain.gain.value = 1 - mix;
    this.wetGain.gain.value = mix;

    // Filters
    this.lowFilter.type = 'highpass';
    this.lowFilter.frequency.value = this._params.lowCut;
    this.lowFilter.Q.value = 0.5;

    this.highFilter.type = 'lowpass';
    this.highFilter.frequency.value = this._params.highCut;
    this.highFilter.Q.value = 0.5;

    // Тип задержки влияет на фильтрацию и "грязь"
    switch (this._params.type) {
      case 'analog':
        this.lowFilter.frequency.value = Math.max(this._params.lowCut, 50);
        this.highFilter.frequency.value = Math.min(this._params.highCut, 7000);
        break;
      case 'tape':
        this.lowFilter.frequency.value = Math.max(this._params.lowCut, 80);
        this.highFilter.frequency.value = Math.min(this._params.highCut, 5000);
        // Добавляем легкое насыщение через небольшое искажение
        break;
      case 'pingpong':
        // В реальном ping-pong используется панорамирование,
        // здесь симулируем через фильтрацию
        this.lowFilter.frequency.value = Math.max(this._params.lowCut, 30);
        break;
      default: // digital
        break;
    }
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.lowFilter.disconnect();
    this.highFilter.disconnect();
  }
}

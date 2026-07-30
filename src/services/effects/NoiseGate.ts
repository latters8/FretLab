/**
 * 🚪 Noise Gate — шумоподавитель
 * Открывается только когда сигнал превышает порог
 */

export interface NoiseGateParams {
  threshold: number;  // -80 to -20 dB
  attack: number;     // 0.1 - 20 ms
  hold: number;       // 10 - 500 ms
  release: number;    // 10 - 500 ms
  range: number;      // -80 to -20 dB (насколько глушит закрытый гейт)
  active: boolean;
}

export class NoiseGateEffect {
  private ctx: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private gateGain: GainNode;
  private envelopeDetector: GainNode;
  private _params: NoiseGateParams;
  private _isOpen: boolean = false;
  private _holdTimer: number = 0;
  private _lastSampleTime: number = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this._params = {
      threshold: -50,
      attack: 1,
      hold: 50,
      release: 100,
      range: -60,
      active: true
    };

    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.gateGain = ctx.createGain();
    this.envelopeDetector = ctx.createGain();

    // input → gateGain → output
    this.input.connect(this.gateGain);
    this.gateGain.connect(this.output);

    // Envelope follower (sidechain)
    this.input.connect(this.envelopeDetector);

    this.gateGain.gain.value = 0; // Closed by default
    this.updateParams();
  }

  get params(): NoiseGateParams {
    return { ...this._params };
  }

  setParams(p: Partial<NoiseGateParams>) {
    Object.assign(this._params, p);
    this.updateParams();
  }

  getInputNode(): AudioNode {
    return this.input;
  }

  getOutputNode(): AudioNode {
    return this.output;
  }

  /**
   * Должен вызываться в audio processing loop (onaudioprocess)
   * для анализа уровня сигнала и открытия/закрытия гейта
   */
  process(inputLevel: number) {
    if (!this._params.active) {
      this.gateGain.gain.value = 1;
      return;
    }

    const now = this.ctx.currentTime;
    const threshold = Math.pow(10, this._params.threshold / 20);
    const attackTime = this._params.attack / 1000;
    const releaseTime = this._params.release / 1000;
    const holdTime = this._params.hold / 1000;
    const range = Math.pow(10, this._params.range / 20);

    if (inputLevel > threshold) {
      // Signal above threshold - open gate
      this._isOpen = true;
      this._holdTimer = 0;
      this._lastSampleTime = now;

      // Attack: ramp up to 1
      this.gateGain.gain.linearRampToValueAtTime(1, now + attackTime);
    } else {
      if (this._isOpen) {
        this._holdTimer += now - this._lastSampleTime;
        this._lastSampleTime = now;

        if (this._holdTimer > holdTime) {
          // Hold time expired - close gate
          this._isOpen = false;
          this.gateGain.gain.linearRampToValueAtTime(range, now + releaseTime);
        }
      } else {
        // Gate is closed - keep at range
        this.gateGain.gain.linearRampToValueAtTime(range, now + 0.01);
      }
    }
  }

  bypass() {
    this._params.active = false;
    this.gateGain.gain.value = 1;
  }

  activate() {
    this._params.active = true;
    this.updateParams();
  }

  private updateParams() {
    // params are used in process()
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.gateGain.disconnect();
    this.envelopeDetector.disconnect();
  }
}

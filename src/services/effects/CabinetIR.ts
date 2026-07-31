import * as Tone from 'tone';

export class CabinetIR {
  private convolver: Tone.Convolver;
  private bypass: Tone.Gain;
  private output: Tone.Gain;

  constructor(irUrl: string = '/ir/IR-meza.wav', enabled: boolean = true) {
    // Convolver загружает IR
    this.convolver = new Tone.Convolver(irUrl);
    this.convolver.normalize = true;

    // Bypass-ветка (когда кабинет выключен)
    this.bypass = new Tone.Gain(enabled ? 0 : 1);

    // Выходной микшер
    this.output = new Tone.Gain(1);

    // Подключаем convolver в output
    this.convolver.connect(this.output);

    // Bypass тоже в output
    this.bypass.connect(this.output);
  }

  get input(): Tone.Convolver | Tone.Gain {
    // Вход — либо в convolver, либо в bypass
    return this.bypass.gain.value > 0.5 ? this.bypass : this.convolver;
  }

  get node(): Tone.Gain {
    return this.output;
  }

  setEnabled(value: boolean): void {
    // Плавный переход bypass ↔ convolver
    const rampTime = 0.05;
    if (value) {
      this.bypass.gain.rampTo(0, rampTime);
      this.convolver.connect(this.output);
    } else {
      this.bypass.gain.rampTo(1, rampTime);
      // Convolver остаётся подключённым, но входной сигнал идёт через bypass
    }
  }

  async loadIR(url: string): Promise<void> {
    await this.convolver.load(url);
  }

  connect(destination: Tone.ToneAudioNode | AudioNode | Tone.Param<any>): this {
    this.output.connect(destination as any);
    return this;
  }

  disconnect(): void {
    this.convolver.disconnect();
    this.bypass.disconnect();
    this.output.disconnect();
  }

  dispose(): void {
    this.convolver.dispose();
    this.bypass.dispose();
    this.output.dispose();
  }
}
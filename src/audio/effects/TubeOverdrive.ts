import * as Tone from 'tone';
import { createTubeCurve } from '../utils/createWaveshaperCurve';

export class TubeOverdrive {
  private inputGain: Tone.Gain;
  private waveshaper: Tone.WaveShaper;
  private outputGain: Tone.Gain;
  private eq: Tone.EQ3;

  constructor(
    drive: number = 0.2,
    tubeAmount: number = 0.3
  ) {
    // Входной gain — чем больше drive, тем выше входной сигнал
    this.inputGain = new Tone.Gain(1 + drive * 10);

    // WaveShaper с ламповой кривой
    const curve = createTubeCurve(44100, tubeAmount, 1 + drive * 5);
    this.waveshaper = new Tone.WaveShaper(curve, 2048);

    // Выходной gain — компенсируем громкость
    this.outputGain = new Tone.Gain(1 / (1 + drive * 2));

    // Пост-EQ — убираем "грязь" после искажения
    this.eq = new Tone.EQ3(0, 0, 0);
    this.eq.lowFrequency.value = 200;
    this.eq.highFrequency.value = 5000;

    // Цепь
    this.inputGain.chain(this.waveshaper, this.outputGain, this.eq);
  }

  get input(): Tone.Gain {
    return this.inputGain;
  }

  get output(): Tone.EQ3 {
    return this.eq;
  }

  setDrive(value: number): void {
    this.inputGain.gain.rampTo(1 + value * 10, 0.05);
    this.outputGain.gain.rampTo(1 / (1 + value * 2), 0.05);
  }

  setTubeAmount(value: number): void {
    const curve = createTubeCurve(44100, value, 1 + this.inputGain.gain.value * 0.5);
(this.waveshaper as any).curve = curve;
  }

  connect(destination: Tone.ToneAudioNode | AudioNode | Tone.Param<any>): this {
    this.eq.connect(destination as any);
    return this;
  }

  disconnect(): void {
    this.inputGain.disconnect();
    this.waveshaper.disconnect();
    this.outputGain.disconnect();
    this.eq.disconnect();
  }

  dispose(): void {
    this.inputGain.dispose();
    this.waveshaper.dispose();
    this.outputGain.dispose();
    this.eq.dispose();
  }
}
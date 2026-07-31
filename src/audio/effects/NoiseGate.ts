import * as Tone from 'tone';

export class NoiseGate {
  private gate: Tone.Gate;

  constructor(threshold = -50, attack = 0.01, release = 0.1) {
    this.gate = new Tone.Gate(threshold, attack);
    (this.gate as any).release = release;
  }

  get node(): Tone.Gate {
    return this.gate;
  }

  setThreshold(db: number): void {
    (this.gate as any).threshold = db;
  }

  setAttack(seconds: number): void {
    (this.gate as any).attack = seconds;
  }

  setRelease(seconds: number): void {
    (this.gate as any).release = seconds;
  }

  connect(destination: any): this {
    this.gate.connect(destination);
    return this;
  }

  disconnect(): void {
    this.gate.disconnect();
  }

  dispose(): void {
    this.gate.dispose();
  }
}
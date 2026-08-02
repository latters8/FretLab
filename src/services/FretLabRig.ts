/**
 * 🎛️ FretLabRig — единый гитарный процессор (AudioWorklet)
 *
 * Заменяет все старые гитарные процессоры проекта.
 * Цепочка: NoiseGate → TubeDrive → AmpEQ → CabinetIR → Delay → Reverb → Master
 *
 * Реализует:
 * - AudioWorklet (guitar-processor) загрузку через Blob URL
 * - getUserMedia с отключённым подавлением шума/эха
 * - Управление параметрами и педалями (AudioParam setValueAtTime)
 * - Загрузку IR (импульсных откликов) через port.postMessage
 * - FFT-анализатор для визуализации
 * - start() / stop() / dispose()
 */
import { GUITAR_RIG_PROCESSOR_CODE } from '../audio/worklet/guitarRigWorklet';

// ============================================
// 🎚️ ТИПЫ
// ============================================

export interface RigParamDescriptor {
  /** 0..1 — on/off */
  gateEnabled: number;
  gateThreshold: number;
  driveEnabled: number;
  drive: number;
  tubeAmount: number;
  eqEnabled: number;
  bass: number;
  mid: number;
  treble: number;
  cabEnabled: number;
  delayEnabled: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  reverbEnabled: number;
  reverbDecay: number;
  reverbMix: number;
  masterGain: number;
}

export const RIG_DEFAULTS: RigParamDescriptor = {
  gateEnabled: 1,
  gateThreshold: -50,
  driveEnabled: 1,
  drive: 20,
  tubeAmount: 30,
  eqEnabled: 1,
  bass: 0,
  mid: 0,
  treble: 0,
  cabEnabled: 1,
  delayEnabled: 1,
  delayTime: 30,
  delayFeedback: 30,
  delayMix: 20,
  reverbEnabled: 1,
  reverbDecay: 20,
  reverbMix: 15,
  masterGain: 100,
};

export type RigParamKey = keyof RigParamDescriptor;

// ============================================
// 🎛️ СЕРВИС
// ============================================

export class FretLabRig {
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private proc: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
private freqData: Uint8Array | null = null;

  private started = false;
  private params: RigParamDescriptor = { ...RIG_DEFAULTS };
  private pendingIR: Float32Array | null = null;

  // ─── Геттеры ───

  get isStarted(): boolean {
    return this.started;
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  get isReady(): boolean {
    return !!this.proc && this.ctx?.state !== 'closed';
  }

  get analyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  get currentParams(): RigParamDescriptor {
    return { ...this.params };
  }

  // ─── Инициализация / старт ───

  /**
   * Инициализирует AudioContext и AudioWorklet.
   * Безопасно вызывать повторно.
   */
  async init(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') return;

    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor({ latencyHint: 'interactive' });

    const blob = new Blob([GUITAR_RIG_PROCESSOR_CODE], { type: 'application/javascript' });
    await this.ctx.audioWorklet.addModule(URL.createObjectURL(blob));

    this.proc = new AudioWorkletNode(this.ctx, 'guitar-processor', {
      channelCount: 1,
      outputChannelCount: [1],
    });

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    // Синхронизация текущих параметров
    this._syncAllParams();

    // Отложенный IR (загруженный до старта)
    if (this.pendingIR) {
      this.proc.port.postMessage({ type: 'ir', buffer: this.pendingIR });
      this.pendingIR = null;
    }
  }

  /**
   * Открывает микрофон и подключает цепочку: mic → worklet → analyser → destination.
   */
  async start(): Promise<void> {
    if (this.started) return;

    if (!this.ctx || this.ctx.state === 'closed') {
      await this.init();
    }
    if (!this.ctx || !this.proc || !this.analyser) return;

    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.source.connect(this.proc);
    this.proc.connect(this.analyser).connect(this.ctx.destination);

    this.started = true;
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {
        /* noop */
      }
      this.source = null;
    }
    if (this.proc) {
      try {
        this.proc.disconnect();
      } catch {
        /* noop */
      }
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
    }
    this.started = false;
  }

  dispose(): void {
    this.stop();
    this.ctx = null;
    this.proc = null;
    this.analyser = null;
    this.freqData = null;
  }

  // ─── Параметры ───

  setParam<K extends RigParamKey>(key: K, value: RigParamDescriptor[K]): void {
    this.params[key] = value;
    const proc = this.proc;
    const ctx = this.ctx;
    if (!proc || !ctx || ctx.state === 'closed') return;

    const param = (proc.parameters as unknown as Map<string, AudioParam>).get(key as string);
    if (param) param.setValueAtTime(value as number, ctx.currentTime);
  }

  setParams(partial: Partial<RigParamDescriptor>): void {
    (Object.keys(partial) as RigParamKey[]).forEach((key) => {
      this.setParam(key, partial[key] as number);
    });
  }

  getParam<K extends RigParamKey>(key: K): RigParamDescriptor[K] {
    return this.params[key];
  }

  /**
   * Включает/выключает педаль (gateEnabled, driveEnabled, eqEnabled,
   * cabEnabled, delayEnabled, reverbEnabled).
   */
  togglePedal(name: string, on: boolean): void {
    const key = `${name}Enabled` as RigParamKey;
    this.setParam(key, on ? 1 : 0);
  }

  // ─── IR (Cabinet impulse response) ───

  /**
   * Загружает IR из AudioBuffer: обрезка до 2048 сэмплов и нормализация.
   */
  static async processIR(buffer: AudioBuffer): Promise<Float32Array> {
    const chData = buffer.getChannelData(0);
    const targetLen = Math.min(chData.length, 2048);
    const ir = new Float32Array(targetLen);
    let max = 0;
    for (let i = 0; i < targetLen; i++) {
      ir[i] = chData[i];
      if (Math.abs(ir[i]) > max) max = Math.abs(ir[i]);
    }
    if (max > 0) {
      for (let i = 0; i < targetLen; i++) ir[i] /= max;
    }
    return ir;
  }

  /**
   * Отправляет IR в процессор (или сохраняет до старта).
   */
  loadIR(ir: Float32Array): void {
    if (this.proc) {
      this.proc.port.postMessage({ type: 'ir', buffer: ir });
    } else {
      this.pendingIR = ir;
    }
  }

  // ─── Визуализация ───

getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.freqData) return new Uint8Array(0);
    this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  // ─── Приватное ───

  private _syncAllParams(): void {
    (Object.keys(this.params) as RigParamKey[]).forEach((key) => {
      const proc = this.proc;
      const ctx = this.ctx;
      if (!proc || !ctx || ctx.state === 'closed') return;
      const param = (proc.parameters as unknown as Map<string, AudioParam>).get(key as string);
      if (param) param.setValueAtTime(this.params[key] as number, ctx.currentTime);
    });
  }
}

/** Синглтон для использования на всех страницах */
export const fretLabRig = new FretLabRig();


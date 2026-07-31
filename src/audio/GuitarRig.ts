import * as Tone from 'tone';
import type { RigParams, ParamKey } from '../types/rig';
import { DEFAULT_PARAMS } from '../types/rig';
import { NoiseGate } from './effects/NoiseGate';
import { TubeOverdrive } from './effects/TubeOverdrive';
import { CabinetIR } from './effects/CabinetIR';
import { CompressorHQ } from './effects/CompressorHQ';
import { DelayHQ } from './effects/DelayHQ';
import { ReverbHQ } from './effects/ReverbHQ';

export class GuitarRig {
  // Tone.js front-end
  private input: InstanceType<typeof Tone.UserMedia>;
  private gate: NoiseGate;
  private overdrive: TubeOverdrive;
  private preEQ: InstanceType<typeof Tone.EQ3>;
  private presence: InstanceType<typeof Tone.Filter>;
  private cab: CabinetIR;

  // HQ Worklet back-end
  private comp: CompressorHQ;
  private delay: DelayHQ;
  private reverb: ReverbHQ;

  // Master & metering
  private master: InstanceType<typeof Tone.Gain>;
  private analyser: InstanceType<typeof Tone.Analyser>;

  private isStarted = false;
  private isInitialized = false;
  private params: RigParams;

  constructor(params: RigParams = DEFAULT_PARAMS) {
    this.params = { ...params };

    // --- Tone.js preamp section ---
    this.input = new Tone.UserMedia();
    this.gate = new NoiseGate(params.gateThreshold, params.gateAttack, params.gateRelease);
    this.overdrive = new TubeOverdrive(params.drive, params.tubeAmount);
    this.preEQ = new Tone.EQ3(params.bass, params.mid, params.treble);
    this.preEQ.lowFrequency.value = 150;
    this.preEQ.highFrequency.value = 4000;
    this.presence = new Tone.Filter(5000, 'highshelf');
    this.presence.gain.value = params.presence;
    this.cab = new CabinetIR(params.cabIR, params.cabEnabled);
    this.master = new Tone.Gain(params.masterVolume);
    this.analyser = new Tone.Analyser('fft', 2048);

    // --- HQ modules (native AudioWorklet) ---
    const rawCtx = Tone.getContext().rawContext as AudioContext;
    this.comp = new CompressorHQ(rawCtx);
    this.delay = new DelayHQ(rawCtx);
    this.reverb = new ReverbHQ(rawCtx);
  }

  /** Инициализация AudioWorklet. Обязательно вызвать до start(). */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    await Promise.all([
      this.comp.init(),
      this.delay.init(),
      this.reverb.init(),
    ]);

    this._syncAll();

    // === SIGNAL CHAIN ===
    // Tone.js: input -> gate -> tube -> EQ -> presence -> cab
    this.input.connect(this.gate.node);
    this.gate.node.connect(this.overdrive.input);
    this.overdrive.output.connect(this.preEQ);
    this.preEQ.connect(this.presence);
    this.presence.connect(this.cab.node);

    // Native bridge: cab (Tone) -> Compressor -> Delay -> Reverb
    this.cab.node.connect(this.comp.getInputNode());
    this.comp.getOutputNode().connect(this.delay.getInputNode());
    this.delay.getOutputNode().connect(this.reverb.getInputNode());

    // Back to Tone.js: Reverb -> Master -> Analyser -> Out
    this.reverb.getOutputNode().connect(this.master.input);
    this.master.connect(this.analyser).toDestination();

    this.isInitialized = true;
    console.log('[GuitarRig] HQ chain initialized');
  }

  async start(): Promise<void> {
    if (!this.isInitialized) await this.init();
    if (this.isStarted) return;
    await Tone.start();
    await this.input.open();
    this.isStarted = true;
  }

  stop(): void {
    this.input.close();
    this.isStarted = false;
  }

  get started() { return this.isStarted; }
  get initialized() { return this.isInitialized; }

  setParam<K extends ParamKey>(key: K, value: RigParams[K]): void {
    this.params[key] = value;

    switch (key) {
      // Gate
      case 'gateThreshold': this.gate.setThreshold(value as number); break;
      case 'gateAttack':    this.gate.setAttack(value as number); break;
      case 'gateRelease':   this.gate.setRelease(value as number); break;

      // Preamp
      case 'drive':      this.overdrive.setDrive(value as number); break;
      case 'tubeAmount': this.overdrive.setTubeAmount(value as number); break;

      // EQ
      case 'bass':     this.preEQ.low.value = value as number; break;
      case 'mid':      this.preEQ.mid.value = value as number; break;
      case 'treble':   this.preEQ.high.value = value as number; break;
      case 'presence': this.presence.gain.value = value as number; break;

      // Cabinet
      case 'cabEnabled': this.cab.setEnabled(value as boolean); break;
      case 'cabIR':      this.cab.loadIR(value as string); break;

      // Compressor
      case 'compEnabled':   value ? this.comp.activate() : this.comp.bypass(); break;
      case 'compType':      this.comp.setType(value as any); break;
      case 'compThreshold': this.comp.setThreshold(value as number); break;
      case 'compRatio':     this.comp.setRatio(value as number); break;
      case 'compAttack':    this.comp.setAttack(value as number); break;
      case 'compRelease':   this.comp.setRelease(value as number); break;
      case 'compKnee':      this.comp.setKnee(value as number); break;
      case 'compMakeup':    this.comp.setMakeupGain(value as number); break;
      case 'compMix':       this.comp.setMix(value as number); break;
      case 'compSaturation':this.comp.setSaturation(value as number); break;

      // Delay
      case 'delayEnabled':  value ? this.delay.activate() : this.delay.bypass(); break;
      case 'delayType':     this.delay.setType(value as any); break;
      case 'delayTime':     this.delay.setDelayTime(value as number); break;
      case 'delayFeedback': this.delay.setFeedback(value as number); break;
      case 'delayMix':      this.delay.setMix(value as number); break;
      case 'delayModDepth':
      case 'delayModRate':
        this.delay.setModulation(this.params.delayModDepth, this.params.delayModRate);
        break;
      case 'delaySaturation': this.delay.setSaturation(value as number); break;
      case 'delayDiffusion':  this.delay.setDiffusion(value as number); break;

      // Reverb
      case 'reverbEnabled':   value ? this.reverb.activate() : this.reverb.bypass(); break;
      case 'reverbType':      this.reverb.setType(value as any); break;
      case 'reverbDecay':     this.reverb.setDecay(value as number); break;
      case 'reverbPreDelay':  this.reverb.setPreDelay(value as number); break;
      case 'reverbDamping':   this.reverb.setDamping(value as number); break;
      case 'reverbMix':       this.reverb.setMix(value as number); break;
      case 'reverbRoomSize':  this.reverb.setRoomSize(value as number); break;
      case 'reverbModDepth':
      case 'reverbModRate':
        this.reverb.setModulation(this.params.reverbModDepth, this.params.reverbModRate);
        break;
      case 'reverbEarlyLevel': this.reverb.setEarlyLevel(value as number); break;
      case 'reverbShimmer':    this.reverb.setShimmerAmount(value as number); break;

      // Master
      case 'masterVolume': this.master.gain.rampTo(value as number, 0.05); break;
    }
  }

  getParam<K extends ParamKey>(key: K): RigParams[K] {
    return this.params[key];
  }

  /** Gain Reduction от компрессора (для VU-метра) */
  getReduction(): number {
    return this.comp.getReduction();
  }

  getFFT(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }

  getWaveform(): Float32Array {
    this.analyser.type = 'waveform';
    const val = this.analyser.getValue() as Float32Array;
    this.analyser.type = 'fft';
    return val;
  }

  dispose(): void {
    this.input.dispose();
    this.gate.dispose();
    this.overdrive.dispose();
    this.preEQ.dispose();
    this.presence.dispose();
    this.cab.dispose();
    this.comp.dispose();
    this.delay.dispose();
    this.reverb.dispose();
    this.master.dispose();
    this.analyser.dispose();
  }

  // ─── Private ───

  private _syncAll() {
    const p = this.params;

    // Comp
    p.compEnabled ? this.comp.activate() : this.comp.bypass();
    this.comp.setType(p.compType);
    this.comp.setThreshold(p.compThreshold);
    this.comp.setRatio(p.compRatio);
    this.comp.setAttack(p.compAttack);
    this.comp.setRelease(p.compRelease);
    this.comp.setKnee(p.compKnee);
    this.comp.setMakeupGain(p.compMakeup);
    this.comp.setMix(p.compMix);
    this.comp.setSaturation(p.compSaturation);

    // Delay
    p.delayEnabled ? this.delay.activate() : this.delay.bypass();
    this.delay.setType(p.delayType);
    this.delay.setDelayTime(p.delayTime);
    this.delay.setFeedback(p.delayFeedback);
    this.delay.setMix(p.delayMix);
    this.delay.setModulation(p.delayModDepth, p.delayModRate);
    this.delay.setSaturation(p.delaySaturation);
    this.delay.setDiffusion(p.delayDiffusion);

    // Reverb
    p.reverbEnabled ? this.reverb.activate() : this.reverb.bypass();
    this.reverb.setType(p.reverbType);
    this.reverb.setDecay(p.reverbDecay);
    this.reverb.setPreDelay(p.reverbPreDelay);
    this.reverb.setDamping(p.reverbDamping);
    this.reverb.setMix(p.reverbMix);
    this.reverb.setRoomSize(p.reverbRoomSize);
    this.reverb.setModulation(p.reverbModDepth, p.reverbModRate);
    this.reverb.setEarlyLevel(p.reverbEarlyLevel);
    this.reverb.setShimmerAmount(p.reverbShimmer);
  }
}
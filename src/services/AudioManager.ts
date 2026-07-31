// src/services/AudioManager.ts

import * as Tone from 'tone';
import {
  DistortionEffect, DelayEffect, ReverbEffect, ChorusEffect, 
  CompressorEffect, LimiterEffect, NoiseGateEffect, WahWahEffect,
  GUITAR_PRESETS, type GuitarPresetName
} from './effects/index';

class AudioManager {
  private static instance: AudioManager;

  // 🎹 Ленивые поля (инициализация при первом обращении)
  private _chordSynth: Tone.PolySynth | null = null;
  private _metronomeSynth: Tone.MembraneSynth | null = null;
  private _guitarSynth: Tone.PolySynth | null = null;
  private _bassSynth: Tone.MonoSynth | null = null;
  private _stringsSynth: Tone.PolySynth | null = null;
  private _pianoSynth: Tone.PolySynth | null = null;
  private _drumKick: Tone.MembraneSynth | null = null;
  private _drumSnare: Tone.NoiseSynth | null = null;
  private _drumHihat: Tone.NoiseSynth | null = null;
  private _drumCrash: Tone.NoiseSynth | null = null;
  private _drumRide: Tone.MetalSynth | null = null;
  private _drumTom: Tone.MembraneSynth | null = null;

  // 🥁 Сэмплеры (ленивая инициализация)
  public drumSampler: Tone.Sampler | null = null;
  public guitarSampler: Tone.Sampler | null = null;
  public bassSampler: Tone.Sampler | null = null;
  
  private drumSamplerPromise: Promise<Tone.Sampler> | null = null;
  private guitarSamplerPromise: Promise<void> | null = null;

  // 🎚️ Микшерные каналы
  private channels: Record<string, Tone.Volume> = {};

  // 🎚️ EQ фильтры (3-полосный эквалайзер на мастер-канале)
  private eqLow: Tone.BiquadFilter | null = null;
  private eqMid: Tone.BiquadFilter | null = null;
  private eqHigh: Tone.BiquadFilter | null = null;

  // 📊 Ссылки на осцилляторы для Web Audio API
  private oscillators: OscillatorNode[] = [];
  private timeouts: number[] = [];

// 📋 Очередь отложенных EQ команд (накапливаем до старта контекста)
  private pendingEQ: { band: 'low' | 'mid' | 'high'; value: number }[] = [];

  // 🎛️ DSP EFFECTS CHAIN — виртуальный процессор
  public effectsChain: {
    noiseGate: NoiseGateEffect | null;
    compressor: CompressorEffect | null;
    distortion: DistortionEffect | null;
    chorus: ChorusEffect | null;
    delay: DelayEffect | null;
    reverb: ReverbEffect | null;
    wah: WahWahEffect | null;
    limiter: LimiterEffect | null;
  } = {
    noiseGate: null,
    compressor: null,
    distortion: null,
    chorus: null,
    delay: null,
    reverb: null,
    wah: null,
    limiter: null
  };

  // 🎛️ Текущий пресет
  private _currentPreset: GuitarPresetName | 'custom' = 'clean';

  // 🎛️ Guitar DSP routing: sampler/synth → effects chain → master
  private guitarDSPChain: {
    input: Tone.Gain;
    output: Tone.Gain;
    nodes: AudioNode[];
  } | null = null;

  private constructor() {
    // 🎛️ Инициализация EQ фильтров (на мастер-канале)
    this.eqLow = new Tone.BiquadFilter({
      type: 'lowshelf',
      frequency: 60,
      gain: 0,
    });
    this.eqMid = new Tone.BiquadFilter({
      type: 'peaking',
      frequency: 1000,
      Q: 1,
      gain: 0,
    });
    this.eqHigh = new Tone.BiquadFilter({
      type: 'highshelf',
      frequency: 8000,
      gain: 0,
    });

    // Соединяем EQ последовательно: eqLow → eqMid → eqHigh → Destination
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.toDestination();

    // 🎛️ Инициализация микшера
    this.channels = {
      master: new Tone.Volume(0).connect(this.eqLow), // мастер теперь идет через EQ
      guitar: new Tone.Volume(6), // +6 dB по умолчанию для гитары
      bass: new Tone.Volume(0),
      drums: new Tone.Volume(0),
      chords: new Tone.Volume(-12), // Дефолтно приглушаем аккорды
    };

    // Подключаем все каналы в мастер-шину
    this.channels.guitar.connect(this.channels.master);
    this.channels.bass.connect(this.channels.master);
    this.channels.drums.connect(this.channels.master);
    this.channels.chords.connect(this.channels.master);
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  // ============================================
  // 🎚️ УПРАВЛЕНИЕ МИКШЕРОМ (Volume & Mute)
  // ============================================
  public setVolume(channel: 'master' | 'guitar' | 'bass' | 'drums' | 'chords', db: number) {
    if (this.channels[channel]) {
      this.channels[channel].volume.rampTo(db, 0.05);
    }
  }

  public setMute(channel: 'master' | 'guitar' | 'bass' | 'drums' | 'chords', muted: boolean) {
    if (this.channels[channel]) {
      this.channels[channel].mute = muted;
    }
  }

  // ============================================
  // 🎚️ УПРАВЛЕНИЕ EQ (3-полосный эквалайзер)
  // ============================================
  public setEQ(band: 'low' | 'mid' | 'high', value: number) {
    // value от -12 до +12 dB
    try {
      const filterMap = {
        low: this.eqLow,
        mid: this.eqMid,
        high: this.eqHigh,
      };
      const filter = filterMap[band];
      if (filter) {
        // Проверяем, что Tone.js контекст запущен (rampTo может падать если контекст suspended)
        const ctx = Tone.getContext();
        if (ctx.state === 'suspended') {
          // Сохраняем в очередь — применим после init()
          this.pendingEQ.push({ band, value });
        } else {
          filter.gain.rampTo(value, 0.05);
        }
      }
    } catch (err) {
      console.warn(`🎚️ EQ setEQ failed for ${band}:`, err);
    }
  }

  // ============================================
  // 🎹 ЛЕНИВЫЕ ГЕТТЕРЫ ДЛЯ СИНТЕЗАТОРОВ (Fallback)
  // ============================================
  get chordSynth(): Tone.PolySynth {
    if (!this._chordSynth) {
      this._chordSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' as any },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 1.5 }
      } as any).connect(this.channels.chords);
    }
    return this._chordSynth;
  }

  get metronomeSynth(): Tone.MembraneSynth {
    if (!this._metronomeSynth) {
      this._metronomeSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 2,
        oscillator: { type: 'sine' as any },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.01 }
      } as any).toDestination();
      this._metronomeSynth.volume.value = -12;
    }
    return this._metronomeSynth;
  }

  get guitarSynth(): Tone.PolySynth {
    if (!this._guitarSynth) {
      this._guitarSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' as any },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 1 }
      } as any).connect(this.channels.guitar);
    }
    return this._guitarSynth;
  }

  get bassSynth(): Tone.MonoSynth {
    if (!this._bassSynth) {
      this._bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' as any },
        filter: { Q: 1, type: 'lowpass', rolloff: -24 },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1, baseFrequency: 100, octaves: 3 }
      } as any).connect(this.channels.bass);
    }
    return this._bassSynth;
  }

  get stringsSynth(): Tone.PolySynth {
    if (!this._stringsSynth) {
      this._stringsSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' as any },
        envelope: { attack: 1, decay: 0.5, sustain: 0.8, release: 2 }
      } as any).connect(this.channels.chords);
    }
    return this._stringsSynth;
  }

  get pianoSynth(): Tone.PolySynth {
    if (!this._pianoSynth) {
      this._pianoSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' as any },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.5, release: 1.5 }
      } as any).connect(this.channels.chords);
    }
    return this._pianoSynth;
  }

  get drumKick(): Tone.MembraneSynth {
    if (!this._drumKick) {
      this._drumKick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        oscillator: { type: 'sine' as any },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
      } as any).connect(this.channels.drums);
    }
    return this._drumKick;
  }

  get drumSnare(): Tone.NoiseSynth {
    if (!this._drumSnare) {
      this._drumSnare = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
      } as any).connect(this.channels.drums);
    }
    return this._drumSnare;
  }

  get drumHihat(): Tone.NoiseSynth {
    if (!this._drumHihat) {
      this._drumHihat = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
      } as any).connect(this.channels.drums);
    }
    return this._drumHihat;
  }

  get drumCrash(): Tone.NoiseSynth {
    if (!this._drumCrash) {
      this._drumCrash = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1.5 }
      } as any).connect(this.channels.drums);
    }
    return this._drumCrash;
  }

  get drumRide(): Tone.MetalSynth {
    if (!this._drumRide) {
      this._drumRide = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      } as any).connect(this.channels.drums);
    }
    return this._drumRide;
  }

  get drumTom(): Tone.MembraneSynth {
    if (!this._drumTom) {
      this._drumTom = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' as any },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      } as any).connect(this.channels.drums);
    }
    return this._drumTom;
  }

  // ✅ FIX: Не создаём отдельный AudioContext, используем Tone.js контекст
  private getAudioContext(): AudioContext {
    return Tone.getContext().rawContext as AudioContext;
  }

  // ============================================
  // 📦 ЛЕНИВАЯ ИНИЦИАЛИЗАЦИЯ СЭМПЛЕРОВ (ИСПРАВЛЕНО)
  // ============================================
  private async ensureDrumSampler(): Promise<Tone.Sampler> {
    if (this.drumSampler) return this.drumSampler;
    if (this.drumSamplerPromise) return this.drumSamplerPromise;

    this.drumSamplerPromise = new Promise((resolve) => {
      // ИСПРАВЛЕНИЕ: Передаем единый объект настроек
      const sampler = new Tone.Sampler({
        urls: {
          C1: 'kick.mp3',
          D1: 'snare.mp3',
          'F#1': 'hihat.mp3',
          A1: 'crash.mp3',
          E1: 'ride.wav',
          G1: 'tom.mp3',
        },
        baseUrl: './samples/drums/',
        onload: () => {
          console.log('✅ Drum sampler loaded into mixer');
          resolve(sampler);
        }
      }).connect(this.channels.drums);
      
      this.drumSampler = sampler;
    });

    return this.drumSamplerPromise;
  }

  private async ensureGuitarAndBassSamplers(): Promise<void> {
    if (this.guitarSampler && this.bassSampler) return;
    if (this.guitarSamplerPromise) return;

    this.guitarSamplerPromise = new Promise((resolve) => {
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 2) resolve();
      };

      // 🎸 Гитарные сэмплы
      this.guitarSampler = new Tone.Sampler({
        urls: { "E2": "E2.mp3", "A2": "A2.mp3", "D3": "D3.mp3", "G3": "G3.mp3", "B3": "B3.mp3", "E4": "E4.mp3" },
        baseUrl: "./samples/guitar/",
        onload: () => {
          console.log("🎸 Реальные гитарные сэмплы подключены!");
          checkDone();
        }
      }).connect(this.channels.guitar);

      // 🎸 Басовые сэмплы (исправлен путь на ./samples/bass/ + корректные имена файлов)
      this.bassSampler = new Tone.Sampler({
        urls: { "E1": "E1.mp3", "A1": "A1.mp3", "D2": "D1.mp3", "G1": "G1.mp3" },
        baseUrl: "./samples/bass/",
        onload: () => {
          console.log("🎛️ Басовые сэмплы подключены!");
          checkDone();
        }
      }).connect(this.channels.bass);
    });
  }

  // ============================================
  // 🎸 ВОСПРОИЗВЕДЕНИЕ ГИТАРЫ (ИСПРАВЛЕНО)
  // ============================================
  public playGuitarNote(noteOrFreq: string | number, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity: number = 0.7) {
    const t = time || Tone.now();
    
    // Если сэмплер загружен
    if (this.guitarSampler && this.guitarSampler.loaded) {
      // ИСПРАВЛЕНИЕ: Конвертируем частоту (number) в строку-ноту, чтобы Sampler мог её проиграть
      const noteName = typeof noteOrFreq === 'number' ? Tone.Frequency(noteOrFreq).toNote() : noteOrFreq;
      this.guitarSampler.triggerAttackRelease(noteName, duration, t, velocity);
      return;
    }

    // Fallback на синтезаторы
    if (typeof noteOrFreq === 'number') {
      this.playWebAudioGuitarNote(noteOrFreq, Tone.Time(duration).toSeconds(), t as number, velocity);
    } else {
      this.guitarSynth.triggerAttackRelease(noteOrFreq, duration, t, velocity);
    }
  }

  public playWebAudioGuitarNote(
    freq: number,
    duration: number,
    startTime?: number,
    velocity: number = 0.7
  ): void {
    const ctx = this.getAudioContext();
    // ✅ FIX: Используем Tone.now() вместо ctx.currentTime (рассинхрон!)
    const time = startTime ?? Tone.now() + 0.05;

    try {
      const destinationNode = Tone.getContext().rawContext.createGain();
      Tone.connect(destinationNode as any, this.channels.guitar);
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, time);
      gain1.gain.setValueAtTime(0, time);
      gain1.gain.linearRampToValueAtTime(velocity * 0.6, time + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc1.connect(gain1);
      gain1.connect(destinationNode);
      osc1.start(time);
      osc1.stop(time + duration + 0.05);
      this.oscillators.push(osc1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 2, time);
      gain2.gain.setValueAtTime(0, time);
      gain2.gain.linearRampToValueAtTime(velocity * 0.15, time + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.8);
      osc2.connect(gain2);
      gain2.connect(destinationNode);
      osc2.start(time);
      osc2.stop(time + duration * 0.8 + 0.05);
      this.oscillators.push(osc2);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 1.25, time);
      gain3.gain.setValueAtTime(0, time);
      gain3.gain.linearRampToValueAtTime(velocity * 0.1, time + 0.01);
      gain3.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.6);
      osc3.connect(gain3);
      gain3.connect(destinationNode);
      osc3.start(time);
      osc3.stop(time + duration * 0.6 + 0.05);
      this.oscillators.push(osc3);
    } catch (err) {
      console.error('Ошибка воспроизведения гитарной ноты:', err);
    }
  }

  // ============================================
  // 🎻 ВОСПРОИЗВЕДЕНИЕ БАСА
  // ============================================
  public playBassNote(note: string | number, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity: number = 0.9) {
    const t = time || Tone.now();
    if (this.bassSampler && this.bassSampler.loaded) {
      this.bassSampler.triggerAttackRelease(note, duration, t, velocity);
    } else {
      this.bassSynth.triggerAttackRelease(note, duration, t, velocity);
    }
  }

  // ============================================
  // 🥁 ВОСПРОИЗВЕДЕНИЕ БАРАБАНОВ
  // ============================================
  public playDrumHit(type: 'kick' | 'snare' | 'hihat' | 'crash' | 'ride' | 'tom', time?: Tone.Unit.Time, velocity?: number) {
    const vel = velocity || 0.8;
    const t = (time ?? Tone.now()) as number;
    const defaultTime = Math.max(t, Tone.now() + 0.0001);

    const noteMap: Record<string, string> = {
      kick: 'C1', snare: 'D1', hihat: 'F#1', crash: 'A1', ride: 'E1', tom: 'G1'
    };

    // Если сэмплер загружен — используем его
    if (this.drumSampler && this.drumSampler.loaded) {
      const note = noteMap[type];
      if (note) {
        this.drumSampler.triggerAttackRelease(note, 0.2, defaultTime, vel);
        return;
      }
    }

    // Fallback на синтезаторы
    switch (type) {
      case 'kick': this.drumKick.triggerAttackRelease(60, 0.2, defaultTime, vel); break;
      case 'snare': this.drumSnare.triggerAttackRelease(0.15, defaultTime, vel); break;
      case 'hihat': this.drumHihat.triggerAttackRelease(0.05, defaultTime, vel * 0.6); break;
      case 'crash': this.drumCrash.triggerAttackRelease(0.4, defaultTime, vel * 0.7); break;
      case 'ride': this.drumRide.triggerAttackRelease(0.2, defaultTime, vel * 0.8); break;
      case 'tom': this.drumTom.triggerAttackRelease(80, 0.15, defaultTime, vel * 0.9); break;
    }
  }

public playMetronome(time: Tone.Unit.Time, isAccent: boolean = false) {
    const freq = isAccent ? 1000 : 800;
    this.metronomeSynth.triggerAttackRelease(freq, 0.05, time, 0.5);
  }

  // ============================================
  // 🎛️ DSP CHAIN MANAGEMENT — виртуальный процессор
  // ============================================

  /**
   * Инициализирует цепочку DSP эффектов для гитарного канала
   * Соединяет: Input → NoiseGate → Compressor → Distortion → EQ → Chorus → Delay → Reverb → Limiter → Output
   */
  public initGuitarDSPChain() {
    // Если уже инициализирована — не делаем повторно
    if (this.guitarDSPChain) {
      console.log('🎛️ DSP chain already initialized');
      return;
    }

    try {
      const ctx = this.getAudioContext();
      
      // Создаём input/output узлы для DSP цепочки
      const input = new Tone.Gain(1);
      const output = new Tone.Gain(1);
      
      // Подключаем: input → guitar channel (bypass default)
      input.connect(this.channels.guitar);
      
      // Создаём все эффекты
      const noiseGate = new NoiseGateEffect(ctx);
      const compressor = new CompressorEffect(ctx);
      const distortion = new DistortionEffect(ctx);
      const chorus = new ChorusEffect(ctx);
      const delay = new DelayEffect(ctx);
      const reverb = new ReverbEffect(ctx);
      const wah = new WahWahEffect(ctx);
      const limiter = new LimiterEffect(ctx);
      
      this.effectsChain = {
        noiseGate,
        compressor,
        distortion,
        chorus,
        delay,
        reverb,
        wah,
        limiter
      };
      
      // Соединяем последовательно: 
      // NoiseGate → Compressor → Distortion → Chorus → Delay → Reverb → Limiter
      noiseGate.getOutputNode().connect(compressor.getInputNode());
      compressor.getOutputNode().connect(distortion.getInputNode());
      distortion.getOutputNode().connect(chorus.getInputNode());
      chorus.getOutputNode().connect(delay.getInputNode());
      delay.getOutputNode().connect(reverb.getInputNode());
      reverb.getOutputNode().connect(limiter.getInputNode());
      
      // Сохраняем ссылки для реконфигурации
      this.guitarDSPChain = {
        input,
        output,
        nodes: [
          noiseGate.getInputNode(),
          compressor.getInputNode(),
          distortion.getInputNode(),
          chorus.getInputNode(),
          delay.getInputNode(),
          reverb.getInputNode(),
          wah.getInputNode(),
          limiter.getInputNode()
        ]
      };
      
      console.log('🎛️ Guitar DSP chain initialized: NoiseGate → Compressor → Distortion → Chorus → Delay → Reverb → Limiter');
    } catch (err) {
      console.warn('🎛️ Failed to initialize DSP chain:', err);
    }
  }

  /**
   * Применяет пресет эффектов
   */
  public setPreset(presetName: GuitarPresetName) {
    const preset = GUITAR_PRESETS[presetName];
    if (!preset) {
      console.warn(`🎛️ Unknown preset: ${presetName}`);
      return;
    }

    this._currentPreset = presetName;
    const chain = preset.chain;

    // Применяем параметры к каждому эффекту
    if (this.effectsChain.noiseGate && chain.noiseGate) {
      this.effectsChain.noiseGate.setParams(chain.noiseGate);
    }
    if (this.effectsChain.compressor && chain.compressor) {
      const c = chain.compressor;
      this.effectsChain.compressor.setThreshold(c.threshold ?? -24);
      this.effectsChain.compressor.setRatio(c.ratio ?? 4);
      this.effectsChain.compressor.setAttack(c.attack ?? 3);
      this.effectsChain.compressor.setRelease(c.release ?? 150);
      this.effectsChain.compressor.setKnee(c.knee ?? 10);
      this.effectsChain.compressor.setMakeupGain(c.makeupGain ?? 6);
      this.effectsChain.compressor.setMix(c.mix ?? 1);
    }
    if (this.effectsChain.distortion && chain.distortion) {
      this.effectsChain.distortion.setParams(chain.distortion);
    }
    if (this.effectsChain.chorus && chain.chorus) {
      this.effectsChain.chorus.setParams(chain.chorus);
    }
    if (this.effectsChain.delay && chain.delay) {
      const d = chain.delay;
      if (d.delayTime !== undefined) this.effectsChain.delay.setDelayTime(d.delayTime);
      if (d.feedback !== undefined) this.effectsChain.delay.setFeedback(d.feedback);
      if (d.mix !== undefined) this.effectsChain.delay.setMix(d.mix);
    }
    if (this.effectsChain.reverb && chain.reverb) {
      const r = chain.reverb;
      if (r.decay !== undefined) this.effectsChain.reverb.setDecay(r.decay);
      if (r.preDelay !== undefined) this.effectsChain.reverb.setPreDelay(r.preDelay);
      if (r.damping !== undefined) this.effectsChain.reverb.setDamping(r.damping);
      if (r.mix !== undefined) this.effectsChain.reverb.setMix(r.mix);
      if (r.roomSize !== undefined) this.effectsChain.reverb.setRoomSize(r.roomSize);
    }
    if (this.effectsChain.wah && chain.wah) {
      this.effectsChain.wah.setParams(chain.wah);
    }
    if (this.effectsChain.limiter && chain.limiter) {
      const l = chain.limiter;
      if (l.threshold !== undefined) this.effectsChain.limiter.setThreshold(l.threshold);
    }

    console.log(`🎛️ Applied preset: ${preset.name} (${preset.description})`);
  }

  /**
   * Возвращает название текущего пресета
   */
  public getCurrentPreset(): GuitarPresetName | 'custom' {
    return this._currentPreset;
  }

  /**
   * Возвращает параметры эффекта
   */
  public getEffectParams(effectName: keyof typeof AudioManager.prototype.effectsChain) {
    const effect = this.effectsChain[effectName];
    if (!effect || typeof effect === 'object' && 'params' in effect) {
      return (effect as any)?.params || null;
    }
    return null;
  }

  /**
   * Обновляет параметры эффекта в реальном времени
   */
  public updateEffect(effectName: keyof typeof AudioManager.prototype.effectsChain, params: any) {
    const effect = this.effectsChain[effectName];
    if (effect && typeof (effect as any).setParams === 'function') {
      (effect as any).setParams(params);
      this._currentPreset = 'custom'; // сброс пресета при ручной правке
    }
  }

  /**
   * Включает/выключает эффект (bypass)
   */
  public bypassEffect(effectName: keyof typeof AudioManager.prototype.effectsChain, bypassed: boolean) {
    const effect = this.effectsChain[effectName];
    if (effect) {
      if (bypassed) {
        (effect as any).bypass?.();
      } else {
        (effect as any).activate?.();
      }
    }
  }

  /**
   * Возвращает все параметры эффектов для UI
   */
  public getAllEffectParams() {
    return {
      noiseGate: (this.effectsChain.noiseGate as any)?.params || null,
      compressor: (this.effectsChain.compressor as any)?.params || null,
      distortion: (this.effectsChain.distortion as any)?.params || null,
      chorus: (this.effectsChain.chorus as any)?.params || null,
      delay: (this.effectsChain.delay as any)?.params || null,
      reverb: (this.effectsChain.reverb as any)?.params || null,
      wah: (this.effectsChain.wah as any)?.params || null,
    };
  }

  public stopAll() {
    Tone.Transport.stop();
    Tone.Transport.cancel(0);

    try { this.chordSynth.releaseAll(); } catch(_) {}
    try { this.guitarSynth.releaseAll(); } catch(_) {}
    try { this.bassSynth.triggerRelease(Tone.now()); } catch(_) {}
    try { this.stringsSynth.releaseAll(); } catch(_) {}
    try { this.pianoSynth.releaseAll(); } catch(_) {}
    try { this.drumSampler?.releaseAll(); } catch(_) {}
    try { this.guitarSampler?.releaseAll(); } catch(_) {}
    try { this.bassSampler?.releaseAll(); } catch(_) {}
    try { this.drumKick.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumSnare.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumHihat.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumCrash.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumRide.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumTom.triggerRelease(Tone.now()); } catch(_) {}

    // 🔥 Аварийное глушение master-канала: прибиваем уже запланированные 
    // через Web Audio API ноты кратковременным отключением звука
    // (rampTo -Infinity, потом обратно к 0 через 100ms)
    try {
      const masterVol = this.channels.master;
      if (masterVol) {
        const currentVol = masterVol.volume.value;
        masterVol.volume.rampTo(-Infinity, 0.01);
        // Возвращаем громкость после паузы, чтобы звук не остался выключенным
        setTimeout(() => {
          try {
            masterVol.volume.rampTo(currentVol, 0.05);
          } catch(_) {}
        }, 100);
      }
    } catch(_) {}

    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(_) {}
    });
    this.oscillators = [];

    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
  }

  public async init() {
    await Tone.start();
    
    // 🔥 Flush отложенных EQ команд (накопленных пока контекст был suspended)
    if (this.pendingEQ.length > 0) {
      const filterMap = {
        low: this.eqLow,
        mid: this.eqMid,
        high: this.eqHigh,
      };
      for (const cmd of this.pendingEQ) {
        const filter = filterMap[cmd.band];
        if (filter) {
          try {
            filter.gain.rampTo(cmd.value, 0.05);
          } catch (_) {}
        }
      }
      this.pendingEQ = [];
      console.log('🎚️ Applied pending EQ settings');
    }

    // ⏳ Ждём загрузки сэмплов, чтобы гитара играла сэмплами, а не синтезатором
    try {
      await Promise.all([
        this.ensureDrumSampler(),
        this.ensureGuitarAndBassSamplers()
      ]);
      console.log('✅ Все сэмплы загружены (гитара, бас, барабаны)');
    } catch (err) {
      console.warn('⚠️ Некоторые сэмплы не загрузились, используем фоллбек:', err);
    }
    
    console.log('✅ AudioManager инициализирован и подключен к микшеру');
  }
}

export const audioManager = AudioManager.getInstance();
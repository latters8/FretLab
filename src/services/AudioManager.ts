// src/services/AudioManager.ts

import * as Tone from 'tone';

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

  // 📊 Ссылки на осцилляторы для Web Audio API
  private oscillators: OscillatorNode[] = [];
  private timeouts: number[] = [];

  private constructor() {
    // 🎛️ Инициализация микшера
    this.channels = {
      master: new Tone.Volume(0).toDestination(),
      guitar: new Tone.Volume(0),
      bass: new Tone.Volume(0),
      drums: new Tone.Volume(0),
      chords: new Tone.Volume(-6), // Дефолтно приглушаем аккорды
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

    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(_) {}
    });
    this.oscillators = [];

    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
  }

  public async init() {
    await Tone.start();
    
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
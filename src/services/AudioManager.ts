// src/services/AudioManager.ts

import * as Tone from 'tone';

class AudioManager {
  private static instance: AudioManager;
  
  // 🎵 Web Audio API контекст
  private audioCtx: AudioContext | null = null;
  
  // 🎹 Tone.js синтезаторы (для сложных звуков)
  public chordSynth: Tone.PolySynth;
  public metronomeSynth: Tone.MembraneSynth;
  public guitarSynth: Tone.PolySynth;
  public bassSynth: Tone.MonoSynth;
  public stringsSynth: Tone.PolySynth;
  public pianoSynth: Tone.PolySynth;

  // 🥁 Барабаны
  public drumKick: Tone.MembraneSynth;
  public drumSnare: Tone.NoiseSynth;
  public drumHihat: Tone.NoiseSynth;
  public drumCrash: Tone.NoiseSynth;
  public drumRide: Tone.MetalSynth;
  public drumTom: Tone.MembraneSynth;
  public drumSampler: Tone.Sampler;

  // 📊 Ссылки на осцилляторы для Web Audio API
  private oscillators: OscillatorNode[] = [];
  private timeouts: number[] = [];

  private constructor() {
    // ============================================
    // 1. ИНИЦИАЛИЗАЦИЯ TONE.JS СИНТЕЗАТОРОВ
    // ============================================
    
    // Аккорды
    this.chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' as any },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 1.5 }
    } as any).toDestination();
    this.chordSynth.volume.value = -10;

    // Метроном
    this.metronomeSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'sine' as any },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.01 }
    } as any).toDestination();
    this.metronomeSynth.volume.value = -12;

    // Гитара (бэкап)
    this.guitarSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' as any },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 1 }
    } as any).toDestination();
    this.guitarSynth.volume.value = -8;

    // Бас
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' as any },
      filter: { Q: 1, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1, baseFrequency: 100, octaves: 3 }
    } as any).toDestination();
    this.bassSynth.volume.value = -6;

    // Струнные
    this.stringsSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' as any },
      envelope: { attack: 1, decay: 0.5, sustain: 0.8, release: 2 }
    } as any).toDestination();
    this.stringsSynth.volume.value = -12;

    // Рояль
    this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' as any },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.5, release: 1.5 }
    } as any).toDestination();
    this.pianoSynth.volume.value = -8;

    // ============================================
    // 2. БАРАБАНЫ (MIDI)
    // ============================================
    this.drumKick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 5,
      oscillator: { type: 'sine' as any },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
    } as any).toDestination();
    this.drumKick.volume.value = 0;

    this.drumSnare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
    } as any).toDestination();
    this.drumSnare.volume.value = -8;

    this.drumHihat = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
    } as any).toDestination();
    this.drumHihat.volume.value = -14;

    this.drumCrash = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1.5 }
    } as any).toDestination();
    this.drumCrash.volume.value = -12;

    this.drumRide = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    } as any).toDestination();
    this.drumRide.volume.value = -16;

    this.drumTom = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' as any },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    } as any).toDestination();
    this.drumTom.volume.value = -10;

    // ============================================
    // 3. СЭМПЛЕР БАРАБАНОВ
    // ============================================
    this.drumSampler = new Tone.Sampler({
      urls: {
        "C1": "kick.mp3",
        "D1": "snare.mp3",
        "F#1": "hihat.mp3",
        "A1": "crash.mp3",
        "E1": "ride.mp3",
        "G1": "tom.mp3",
      },
      baseUrl: "/samples/drums/",
      onload: () => {
        console.log('✅ Барабаны сэмплы загружены!');
        this.drumSampler.volume.value = -8;
      },
      onerror: () => {
        console.warn('⚠️ Барабаны сэмплы не найдены, используем MIDI синтез');
      }
    } as any).toDestination();
    this.drumSampler.volume.value = -8;
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  // ============================================
  // 🎵 WEB AUDIO API - ИНИЦИАЛИЗАЦИЯ
  // ============================================
  public async initAudioContext(): Promise<AudioContext> {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    
    return this.audioCtx;
  }

  // ============================================
  // 🎸 WEB AUDIO API - ВОСПРОИЗВЕДЕНИЕ НОТЫ (как в Tablature)
  // ============================================
  public playWebAudioNote(
    freq: number,
    duration: number,
    startTime?: number,
    velocity: number = 0.7,
    type: OscillatorType = 'triangle'
  ): void {
    const ctx = this.audioCtx;
    if (!ctx) return;

    const time = startTime || ctx.currentTime + 0.05;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    // Быстрая атака, плавный спад (как в Tablature)
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.7, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration + 0.05);
    
    // Сохраняем ссылку для остановки
    this.oscillators.push(osc);
  }

  // ============================================
  // 🎸 WEB AUDIO API - ГИТАРНАЯ НОТА (с гармониками)
  // ============================================
  public playWebAudioGuitarNote(
    freq: number,
    duration: number,
    startTime?: number,
    velocity: number = 0.7
  ): void {
    const ctx = this.audioCtx;
    if (!ctx) return;

    const time = startTime || ctx.currentTime + 0.05;
    
    // Основной тон (треугольная волна для мягкости)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(velocity * 0.6, time + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(time);
    osc1.stop(time + duration + 0.05);
    this.oscillators.push(osc1);

    // Гармоника 1 (октава, с меньшей громкостью)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 2, time);
    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(velocity * 0.15, time + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(time);
    osc2.stop(time + duration * 0.8 + 0.05);
    this.oscillators.push(osc2);

    // Гармоника 2 (терция, для теплоты)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 1.25, time);
    gain3.gain.setValueAtTime(0, time);
    gain3.gain.linearRampToValueAtTime(velocity * 0.1, time + 0.01);
    gain3.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.6);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(time);
    osc3.stop(time + duration * 0.6 + 0.05);
    this.oscillators.push(osc3);
  }

  // ============================================
  // ⏹️ ОСТАНОВКА ВСЕГО
  // ============================================
  public stopAll() {
    // Останавливаем Tone.Transport
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    
    // Останавливаем Tone.js синтезаторы
    try { this.chordSynth.releaseAll(); } catch(_) {}
    try { this.guitarSynth.releaseAll(); } catch(_) {}
    try { this.bassSynth.triggerRelease(Tone.now()); } catch(_) {}
    try { this.stringsSynth.releaseAll(); } catch(_) {}
    try { this.pianoSynth.releaseAll(); } catch(_) {}
    try { this.drumSampler.releaseAll(); } catch(_) {}
    try { this.drumKick.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumSnare.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumHihat.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumCrash.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumRide.triggerRelease(Tone.now()); } catch(_) {}
    try { this.drumTom.triggerRelease(Tone.now()); } catch(_) {}
    
    // Останавливаем Web Audio API осцилляторы
    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(_) {}
    });
    this.oscillators = [];
    
    // Очищаем таймауты
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
  }

  // ============================================
  // 🥁 МЕТОДЫ ДЛЯ БАРАБАНОВ
  // ============================================
  public playDrumHit(type: 'kick' | 'snare' | 'hihat' | 'crash' | 'ride' | 'tom', time?: Tone.Unit.Time, velocity?: number) {
    const vel = velocity || 0.8;
    const defaultTime = time || Tone.now();
    
    const noteMap: Record<string, string> = {
      kick: 'C1',
      snare: 'D1',
      hihat: 'F#1',
      crash: 'A1',
      ride: 'E1',
      tom: 'G1'
    };
    
    if (this.drumSampler.loaded) {
      const note = noteMap[type];
      if (note) {
        this.drumSampler.triggerAttackRelease(note, 0.2, defaultTime, vel);
        return;
      }
    }
    
    switch (type) {
      case 'kick': this.drumKick.triggerAttackRelease(60, 0.2, defaultTime, vel); break;
      case 'snare': this.drumSnare.triggerAttackRelease(0.15, defaultTime, vel); break;
      case 'hihat': this.drumHihat.triggerAttackRelease(0.05, defaultTime, vel * 0.6); break;
      case 'crash': this.drumCrash.triggerAttackRelease(0.4, defaultTime, vel * 0.7); break;
      case 'ride': this.drumRide.triggerAttackRelease(0.2, defaultTime, vel * 0.8); break;
      case 'tom': this.drumTom.triggerAttackRelease(80, 0.15, defaultTime, vel * 0.9); break;
    }
  }

  // ============================================
  // 🎵 МЕТРОНОМ
  // ============================================
  public playMetronome(time: Tone.Unit.Time, isAccent: boolean = false) {
    const freq = isAccent ? 1000 : 800;
    this.metronomeSynth.triggerAttackRelease(freq, 0.05, time, 0.5);
  }

  // ============================================
  // 🎸 МЕТОДЫ ДЛЯ ГИТАРЫ (совместимость с Tone.js)
  // ============================================
  public playGuitarNote(note: string | number, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity?: number) {
    const defaultTime = time || Tone.now();
    this.guitarSynth.triggerAttackRelease(note, duration, defaultTime, velocity);
  }

  public async init() {
    await this.initAudioContext();
    await Tone.start();
  }
}

export const audioManager = AudioManager.getInstance();
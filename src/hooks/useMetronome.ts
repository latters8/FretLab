// src/hooks/useMetronome.ts

import { useEffect, useRef } from 'react';
import type { TimeSignature } from '../context/MusicContext';

export const useMetronome = (bpm: number, timeSignature: TimeSignature) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIdRef = useRef<number>(0);
  const stepRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Инициализация AudioContext только при необходимости
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playClick = (time: number, isAccent: boolean) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = isAccent ? 1500 : 1000;
      
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.08);
    } catch (e) {
      console.warn('Click sound error:', e);
    }
  };

  const scheduler = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const currentTime = ctx.currentTime;
    const lookahead = 0.1;
    const secondsPerBeat = 60.0 / bpm;
    const beatsPerBar = timeSignature.beats;

    while (nextNoteTimeRef.current < currentTime + lookahead) {
      const isAccent = stepRef.current % beatsPerBar === 0;
      playClick(nextNoteTimeRef.current, isAccent);
      
      nextNoteTimeRef.current += secondsPerBeat / 4; // 16-я нота для точности
      stepRef.current = (stepRef.current + 1) % 32;
    }

    timerIdRef.current = requestAnimationFrame(scheduler);
  };

  const startMetronome = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    isPlayingRef.current = true;
    nextNoteTimeRef.current = ctx.currentTime + 0.1;
    stepRef.current = 0;
    scheduler();
  };

  const stopMetronome = () => {
    isPlayingRef.current = false;
    if (timerIdRef.current) {
      cancelAnimationFrame(timerIdRef.current);
      timerIdRef.current = 0;
    }
    stepRef.current = 0;
  };

  useEffect(() => {
    // Подписываемся на изменение статуса воспроизведения из MusicContext
    const handlePlayStateChange = (event: CustomEvent) => {
      if (event.detail.isPlaying) {
        startMetronome();
      } else {
        stopMetronome();
      }
    };

    window.addEventListener('metronome-toggle', handlePlayStateChange as EventListener);

    return () => {
      window.removeEventListener('metronome-toggle', handlePlayStateChange as EventListener);
      stopMetronome();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [bpm, timeSignature]);

  // Перезапуск при изменении BPM или размера
  useEffect(() => {
    if (isPlayingRef.current) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm, timeSignature]);

  return {
    start: startMetronome,
    stop: stopMetronome,
    isPlaying: isPlayingRef.current
  };
};
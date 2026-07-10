import { useState, useRef, useEffect, useCallback } from 'react';

export const useMetronome = (bpm: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number>(0);
  const stepCounter = useRef(0); // Используем ref для счетчика шагов

  const playClick = (time: number, isAccent: boolean) => {
    const osc = audioContext.current!.createOscillator();
    const envelope = audioContext.current!.createGain();
    osc.frequency.value = isAccent ? 1200 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(envelope);
    envelope.connect(audioContext.current!.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;
    
    const currentTime = audioContext.current.currentTime;
    const interval = 60.0 / bpm;
    
    while (nextNoteTime.current < currentTime + 0.1) {
      // Определяем акцент (каждый 4-й удар)
      const isAccent = stepCounter.current % 4 === 0;
      playClick(nextNoteTime.current, isAccent);
      nextNoteTime.current += interval;
      
      // Обновляем счетчик и состояние
      stepCounter.current = (stepCounter.current + 1) % 32;
      setCurrentStep(stepCounter.current);
    }
    timerID.current = requestAnimationFrame(scheduler);
  }, [bpm]);

  useEffect(() => {
    if (isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      // Сброс при старте
      stepCounter.current = 0;
      setCurrentStep(0);
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      if (timerID.current) {
        cancelAnimationFrame(timerID.current);
      }
      setCurrentStep(-1); // -1 означает, что метроном остановлен
    }
    
    return () => {
      if (timerID.current) {
        cancelAnimationFrame(timerID.current);
      }
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
      }
    };
  }, [isPlaying, bpm, scheduler]);

  return { isPlaying, setIsPlaying, currentStep };
};
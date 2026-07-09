// src/hooks/useMetronome.ts
import { useState, useEffect, useRef } from 'react';

export const useMetronome = (bpm: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const stepCounterRef = useRef<number>(0);

  const scheduleNote = (time: number) => {
    const oscillator = audioContextRef.current?.createOscillator();
    const gainNode = audioContextRef.current?.createGain();
    
    if (oscillator && gainNode && audioContextRef.current) {
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = 1000;
      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      oscillator.start(time);
      oscillator.stop(time + 0.1);
      
      // Обновляем текущий шаг при каждом ударе метронома
      stepCounterRef.current = (stepCounterRef.current + 1) % 32;
      setCurrentStep(stepCounterRef.current);
    }
  };

  const scheduler = () => {
    if (!audioContextRef.current) return;
    
    const currentTime = audioContextRef.current.currentTime;
    const interval = 60.0 / bpm;
    
    while (nextNoteTimeRef.current < currentTime + 0.1) {
      scheduleNote(nextNoteTimeRef.current);
      nextNoteTimeRef.current += interval;
    }
    
    timerRef.current = requestAnimationFrame(scheduler);
  };

  useEffect(() => {
    if (isPlaying) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      stepCounterRef.current = 0;
      setCurrentStep(0);
      scheduler();
    } else if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      audioContextRef.current?.close();
      setCurrentStep(-1);
    }
    
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      audioContextRef.current?.close();
    };
  }, [isPlaying, bpm]);

  return { isPlaying, setIsPlaying, currentStep };
};
// src/hooks/useTuner.ts

import { useState, useEffect, useRef, useCallback } from 'react';

const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const useTuner = () => {
  const [isActive, setIsActive] = useState(false);
  const [note, setNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);
  const [frequency, setFrequency] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const audioDataRef = useRef<Float32Array | null>(null);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } 
      });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsActive(true);
      tick();
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Please allow microphone access to use the Tuner.");
    }
  };

  const stopTuner = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    
    setIsActive(false);
    setNote('');
    setCents(0);
    setFrequency(0);
    audioDataRef.current = null;
  };

  const getAudioData = useCallback((): Float32Array | null => {
    if (!analyserRef.current || !isActive) return null;
    
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    audioDataRef.current = buffer;
    return buffer;
  }, [isActive]);

  const findPitchMPM = (buf: Float32Array, sampleRate: number): [number, number] => {
    const size = buf.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / size);
    
    if (rms < 0.015) return [-1, 0];

    const nsdf = new Float32Array(size);
    for (let tau = 0; tau < size / 2; tau++) {
      let acf = 0;
      let df = 0;
      for (let i = 0; i < size - tau; i++) {
        acf += buf[i] * buf[i + tau];
        df += buf[i] * buf[i] + buf[i + tau] * buf[i + tau];
      }
      nsdf[tau] = df === 0 ? 0 : (2 * acf) / df;
    }

    let maxPositions: number[] = [];
    let period = -1;
    let clarity = 0;

    let seekingPositives = true;
    for (let i = 1; i < size / 2 - 1; i++) {
      if (seekingPositives) {
        if (nsdf[i] > 0) seekingPositives = false;
        continue;
      }
      if (nsdf[i] > nsdf[i - 1] && nsdf[i] > nsdf[i + 1]) {
        maxPositions.push(i);
      }
    }

    let highestPeakValue = -1;
    let highestPeakPos = -1;
    
    for (const pos of maxPositions) {
      if (nsdf[pos] > highestPeakValue && nsdf[pos] > 0.4) {
        highestPeakValue = nsdf[pos];
        highestPeakPos = pos;
      }
    }

    if (highestPeakPos !== -1) {
      const alpha = nsdf[highestPeakPos - 1];
      const beta = nsdf[highestPeakPos];
      const gamma = nsdf[highestPeakPos + 1];
      const pCount = highestPeakPos + 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
      
      period = pCount;
      clarity = highestPeakValue;
    }

    const pitch = period !== -1 ? sampleRate / period : -1;
    return [pitch, clarity];
  };

  const tick = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;
    
    const now = performance.now();
    
    if (now - lastUpdateRef.current > 50) {
      const buf = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(buf);
      audioDataRef.current = buf;
      
      const [pitch, clarity] = findPitchMPM(buf, audioCtxRef.current.sampleRate);
      
      if (clarity > 0.82 && pitch > 60 && pitch < 1000) {
        setFrequency(Math.round(pitch * 10) / 10);
        
        const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2));
        const noteIndex = (Math.round(noteNum) + 69) % 12;
        const noteName = NOTE_STRINGS[noteIndex >= 0 ? noteIndex : noteIndex + 12];
        
        const expectedFreq = 440 * Math.pow(2, Math.round(noteNum) / 12);
        let centsOff = Math.floor(1200 * Math.log2(pitch / expectedFreq));
        centsOff = Math.max(-50, Math.min(50, centsOff));
        
        setNote(noteName);
        setCents(centsOff);
      }
      lastUpdateRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => stopTuner();
  }, []);

  return { 
    isActive, 
    startTuner, 
    stopTuner, 
    note, 
    cents, 
    frequency,
    getAudioData
  };
};
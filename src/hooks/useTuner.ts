import { useState, useEffect, useRef } from 'react';

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

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      console.error("Microphone access denied or error:", err);
      alert("Please allow microphone access to use the FretLab Tuner.");
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
  };

  // Алгоритм автокорреляции (вычисляет базовую частоту из звуковой волны)
  const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Недостаточно звука (тишина)

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  const tick = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;
    
    const buf = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buf);
    const ac = autoCorrelate(buf, audioCtxRef.current.sampleRate);
    
    if (ac !== -1) {
      const pitch = ac;
      setFrequency(Math.round(pitch));
      
      const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2));
      const noteIndex = (Math.round(noteNum) + 69) % 12;
      const noteName = NOTE_STRINGS[noteIndex >= 0 ? noteIndex : noteIndex + 12];
      
      // Вычисление отклонения (центы: от -50 до +50)
      const expectedFreq = 440 * Math.pow(2, (Math.round(noteNum)) / 12);
      let centsOff = Math.floor(1200 * Math.log2(pitch / expectedFreq));
      centsOff = Math.max(-50, Math.min(50, centsOff)); // Ограничиваем шкалу
      
      setNote(noteName);
      setCents(centsOff);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => stopTuner(); // Очистка при закрытии компонента
  }, []);

  return { isActive, startTuner, stopTuner, note, cents, frequency };
};
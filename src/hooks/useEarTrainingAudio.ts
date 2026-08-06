// src/hooks/useEarTrainingAudio.ts
//
// Инкапсулирует работу с микрофоном, анализатором тона (PitchAnalyzer) и
// микро-лупером (Ditto-style playback) для модуля EarTrainer.
//
// - Захват аудио через `navigator.mediaDevices.getUserMedia` (без эхо/AGC/шумодава,
//   как в useRecordingAnalyzer / useTuner).
// - Двойной поток данных:
//     * MediaRecorder -> Blob (для "Play My Take" / микро-лупера)
//     * Float32Array (сырые данные) -> findPitchMPM -> frequencyToNote (распознавание нот)
// - Тщательная очистка ресурсов при размонтировании/остановке.

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  findPitchMPM,
  frequencyToNote,
  PITCH_MIN_HZ,
  PITCH_MAX_HZ,
  CLARITY_THRESHOLD,
} from '../services/PitchAnalyzer';

export interface DetectedNote {
  note: string;          // имя ноты, напр. "E"
  octave: number;        // напр. 4
  frequency: number;     // Гц
  cents: number;         // отклонение от идеала, -50..50
  startTime: number;     // мс от начала записи
  duration: number;      // мс
}

// Через сколько тишины/шума закрываем текущую ноту
const SILENCE_GAP_MS = 150;
// Отбрасываем слишком короткие "нотки" как шум/призвуки
const MIN_NOTE_DURATION_MS = 60;
// Частота опроса анализатора (мс)
const SAMPLE_INTERVAL_MS = 50;
// MIME для MediaRecorder (с фоллбэками)
const RECORD_MIME = 'audio/webm';

export const useEarTrainingAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [detectedNotes, setDetectedNotes] = useState<DetectedNote[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);

  // --- Рефы для аудио-цепочки ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastSampleRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // --- Рефы для построения событий нот ---
  const currentEventRef = useRef<{
    note: string;
    octave: number;
    startTime: number;
    lastVoicedTime: number;
    frequencies: number[];
    centsSamples: number[];
  } | null>(null);
  const finishedNotesRef = useRef<DetectedNote[]>([]);

  const finalizeCurrentEvent = useCallback((endTime: number) => {
    const cur = currentEventRef.current;
    if (!cur) return;
    currentEventRef.current = null;

    const duration = endTime - cur.startTime;
    if (duration < MIN_NOTE_DURATION_MS) return;

    const avgFrequency =
      cur.frequencies.reduce((a, b) => a + b, 0) / (cur.frequencies.length || 1);
    const avgCents =
      cur.centsSamples.reduce((a, b) => a + b, 0) / (cur.centsSamples.length || 1);

    finishedNotesRef.current.push({
      note: cur.note,
      octave: cur.octave,
      frequency: avgFrequency,
      cents: avgCents,
      startTime: cur.startTime,
      duration,
    });
  }, []);

  // --- Анализ одного сэмпла (внутренний шаг цикла) ---
  const tick = useCallback(() => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const now = performance.now();
    if (now - lastSampleRef.current > SAMPLE_INTERVAL_MS) {
      const buf = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(buf);

      const { pitch, clarity } = findPitchMPM(buf, audioCtxRef.current.sampleRate);
      const elapsed = now - startTimeRef.current;

      const voiced =
        clarity > CLARITY_THRESHOLD && pitch > PITCH_MIN_HZ && pitch < PITCH_MAX_HZ;

      if (voiced) {
        const info = frequencyToNote(pitch);
        if (info) {
          const cur = currentEventRef.current;
          const sameNote =
            cur && cur.note === info.note && cur.octave === info.octave;

          if (!cur) {
            currentEventRef.current = {
              note: info.note,
              octave: info.octave,
              startTime: elapsed,
              lastVoicedTime: elapsed,
              frequencies: [info.frequency],
              centsSamples: [info.cents],
            };
          } else if (sameNote) {
            cur.lastVoicedTime = elapsed;
            cur.frequencies.push(info.frequency);
            cur.centsSamples.push(info.cents);
          } else {
            // Смена ноты — закрываем предыдущую, начинаем новую
            finalizeCurrentEvent(elapsed);
            currentEventRef.current = {
              note: info.note,
              octave: info.octave,
              startTime: elapsed,
              lastVoicedTime: elapsed,
              frequencies: [info.frequency],
              centsSamples: [info.cents],
            };
          }
        }
      } else {
        // Тишина/шум — закрываем ноту, если пауза дольше порога
        const cur = currentEventRef.current;
        if (cur && elapsed - cur.lastVoicedTime > SILENCE_GAP_MS) {
          finalizeCurrentEvent(cur.lastVoicedTime);
        }
      }

      lastSampleRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, [finalizeCurrentEvent]);

  // --- Старт записи ---
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
      });
      streamRef.current = stream;

      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtor();
      audioCtxRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // MediaRecorder для микро-лупера
      let recorder: MediaRecorder | null = null;
      try {
        recorder = new MediaRecorder(stream, RECORD_MIME ? { mimeType: RECORD_MIME } : undefined);
      } catch {
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          recorder = null;
        }
      }

      chunksRef.current = [];
      if (recorder) {
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder?.mimeType || 'audio/webm' });
          setRecordedBlob(blob);
          if (recordedUrl) URL.revokeObjectURL(recordedUrl);
          const url = URL.createObjectURL(blob);
          setRecordedUrl(url);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      }

      // Сброс состояния
      finishedNotesRef.current = [];
      currentEventRef.current = null;
      startTimeRef.current = performance.now();
      lastSampleRef.current = 0;
      setDetectedNotes([]);
      setRecordedBlob(null);
      setIsRecording(true);

      rafIdRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('EarTraining microphone error:', err);
      alert('Разреши доступ к микрофону, чтобы записать и проанализировать ответ.');
    }
  }, [tick, recordedUrl]);

  // --- Стоп записи ---
  const stopRecording = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const now = performance.now() - startTimeRef.current;
    finalizeCurrentEvent(now);

    // Останавливаем MediaRecorder (событие onstop сформирует Blob)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    mediaRecorderRef.current = null;

    // Освобождаем микрофон и контекст
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;

    setDetectedNotes(finishedNotesRef.current);
    setIsRecording(false);
  }, [finalizeCurrentEvent]);

  // --- Микро-лупер: воспроизведение записи "как есть" ---
  const playTake = useCallback(() => {
    if (!recordedUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const el = audioElementRef.current;
    el.src = recordedUrl;
    el.onended = () => setIsPlayingBack(false);
    el.onplay = () => setIsPlayingBack(true);
    el.onpause = () => setIsPlayingBack(false);
    el.play().catch((err) => console.error('PlayTake error:', err));
  }, [recordedUrl]);

  const stopTake = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlayingBack(false);
    }
  }, []);

  // --- Получение сырых данных для canvas (опционально) ---
  const getAudioData = useCallback((): Float32Array | null => {
    if (!analyserRef.current || !isRecording) return null;
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    return buffer;
  }, [isRecording]);

  // --- Очистка при размонтировании ---
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (audioElementRef.current) audioElementRef.current.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRecording,
    detectedNotes,
    recordedBlob,
    recordedUrl,
    isPlayingBack,
    startRecording,
    stopRecording,
    playTake,
    stopTake,
    getAudioData,
  };
};

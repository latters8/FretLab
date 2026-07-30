// src/hooks/useRecordingAnalyzer.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { findPitchMPM, frequencyToNote, PITCH_MIN_HZ, PITCH_MAX_HZ, CLARITY_THRESHOLD } from '../services/PitchAnalyzer';
import { useMusicTheory, useMusicPlayback } from '../context/MusicContext';

export interface NoteEvent {
  note: string;
  octave: number;
  startTime: number;   // мс от начала записи
  endTime: number;      // мс от начала записи
  duration: number;     // мс
  avgFrequency: number;
  avgCents: number;     // средняя точность интонации по всей длительности ноты
  inScale: boolean;
}

export interface RecordingSummary {
  totalNotes: number;
  inScaleCount: number;
  inScalePercent: number;
  avgAbsCents: number;          // средняя ошибка интонации по модулю
  rhythmCV: number | null;      // коэффициент вариации интервалов между нотами (0 = идеально ровно)
  outOfScaleNotes: NoteEvent[]; // для показа конкретных "мимо нот"
  tips: string[];
}

// Нота считается закрытой, если тишина/шум держится дольше этого порога
const SILENCE_GAP_MS = 150;
// Слишком короткие "нотки" отфильтровываем как шум/призвуки
const MIN_NOTE_DURATION_MS = 60;
// Частота опроса анализатора (мс), как в useTuner
const SAMPLE_INTERVAL_MS = 50;

export const useRecordingAnalyzer = () => {
  const { getScaleNotes } = useMusicTheory();
  const { bpm } = useMusicPlayback();

  const [isRecording, setIsRecording] = useState(false);
  const [noteEvents, setNoteEvents] = useState<NoteEvent[]>([]);
  const [summary, setSummary] = useState<RecordingSummary | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastSampleRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Текущая "строящаяся" нота + накопленные сэмплы центов для усреднения
  const currentEventRef = useRef<{
    note: string;
    octave: number;
    startTime: number;
    lastVoicedTime: number;
    frequencies: number[];
    centsSamples: number[];
  } | null>(null);

  const finishedEventsRef = useRef<NoteEvent[]>([]);

  const finalizeCurrentEvent = useCallback((endTime: number) => {
    const cur = currentEventRef.current;
    if (!cur) return;

    const duration = endTime - cur.startTime;
    currentEventRef.current = null;
    if (duration < MIN_NOTE_DURATION_MS) return; // отбрасываем шум

    const avgFrequency =
      cur.frequencies.reduce((a, b) => a + b, 0) / (cur.frequencies.length || 1);
    const avgCents =
      cur.centsSamples.reduce((a, b) => a + b, 0) / (cur.centsSamples.length || 1);

    const scale = getScaleNotes();
    const inScale = scale.includes(cur.note);

    finishedEventsRef.current.push({
      note: cur.note,
      octave: cur.octave,
      startTime: cur.startTime,
      endTime,
      duration,
      avgFrequency,
      avgCents,
      inScale,
    });
  }, [getScaleNotes]);

  const getAudioData = useCallback((): Float32Array | null => {
    if (!analyserRef.current || !isRecording) return null;
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    return buffer;
  }, [isRecording]);

  const tick = useCallback(() => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const now = performance.now();
    if (now - lastSampleRef.current > SAMPLE_INTERVAL_MS) {
      const buf = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(buf);

      const { pitch, clarity } = findPitchMPM(buf, audioCtxRef.current.sampleRate);
      const elapsed = now - startTimeRef.current;

      const voiced = clarity > CLARITY_THRESHOLD && pitch > PITCH_MIN_HZ && pitch < PITCH_MAX_HZ;

      if (voiced) {
        const info = frequencyToNote(pitch);
        if (info) {
          const cur = currentEventRef.current;
          const sameNote = cur && cur.note === info.note && cur.octave === info.octave;

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
        // Тишина/шум — если держится дольше порога, закрываем текущую ноту
        const cur = currentEventRef.current;
        if (cur && elapsed - cur.lastVoicedTime > SILENCE_GAP_MS) {
          finalizeCurrentEvent(cur.lastVoicedTime);
        }
      }

      lastSampleRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, [finalizeCurrentEvent]);

  const buildSummary = useCallback((events: NoteEvent[]): RecordingSummary => {
    const totalNotes = events.length;
    const inScaleCount = events.filter(e => e.inScale).length;
    const inScalePercent = totalNotes ? Math.round((inScaleCount / totalNotes) * 100) : 0;

    const avgAbsCents = totalNotes
      ? events.reduce((sum, e) => sum + Math.abs(e.avgCents), 0) / totalNotes
      : 0;

    let rhythmCV: number | null = null;
    if (totalNotes > 2) {
      const onsets = events.map(e => e.startTime);
      const intervals = onsets.slice(1).map((t, i) => t - onsets[i]);
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance =
        intervals.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / intervals.length;
      const stddev = Math.sqrt(variance);
      rhythmCV = mean > 0 ? stddev / mean : null;
    }

    const outOfScaleNotes = events.filter(e => !e.inScale);

    const tips: string[] = [];

    if (totalNotes === 0) {
      tips.push('Не удалось распознать ни одной ноты — сыграй чуть громче и ближе к микрофону.');
    } else {
      if (avgAbsCents > 20) {
        tips.push(`🎯 Интонация плывёт (в среднем ${avgAbsCents.toFixed(0)} центов мимо) — подтяни строй перед записью.`);
      } else if (avgAbsCents > 10) {
        tips.push(`🎯 Интонация в целом неплохая, но есть небольшой уход (${avgAbsCents.toFixed(0)} центов) — есть куда расти.`);
      } else {
        tips.push('🎯 Интонация точная — попадаешь в ноты стабильно.');
      }

      if (inScalePercent < 70 && totalNotes >= 4) {
        tips.push(`🎼 ${100 - inScalePercent}% нот вне текущего лада — если это не осознанная хроматика, проверь позицию на грифе.`);
      } else if (totalNotes >= 4) {
        tips.push(`🎼 ${inScalePercent}% нот попадают в лад — хорошее чувство тональности.`);
      }

      if (rhythmCV !== null) {
        if (rhythmCV > 0.35) {
          tips.push('🥁 Тайминг между нотами сильно плавает — позанимайся под метроном на медленном темпе.');
        } else if (rhythmCV > 0.18) {
          tips.push('🥁 Ритм в целом ровный, но есть небольшие сдвиги — подтяни точность атак.');
        } else {
          tips.push('🥁 Ритмически очень стабильно, хорошая внутренняя пульсация.');
        }
      }

      if (bpm) {
        tips.push(`ℹ️ Анализ выполнен относительно текущего темпа ${bpm} BPM и тональности из плеера.`);
      }
    }

    return { totalNotes, inScaleCount, inScalePercent, avgAbsCents, rhythmCV, outOfScaleNotes, tips };
  }, [bpm]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
      });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      finishedEventsRef.current = [];
      currentEventRef.current = null;
      startTimeRef.current = performance.now();
      lastSampleRef.current = 0;

      setNoteEvents([]);
      setSummary(null);
      setIsRecording(true);
      rafIdRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Разреши доступ к микрофону, чтобы записать и проанализировать игру.');
    }
  }, [tick]);

  const stopRecording = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();

    const now = performance.now() - startTimeRef.current;
    finalizeCurrentEvent(now);

    const events = finishedEventsRef.current;
    setNoteEvents(events);
    setSummary(buildSummary(events));
    setIsRecording(false);
  }, [finalizeCurrentEvent, buildSummary]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    noteEvents,
    summary,
    getAudioData,
  };
};

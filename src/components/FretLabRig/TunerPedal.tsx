import React, { useEffect, useRef, useState } from 'react';
import { fretLabRig } from '../../services/FretLabRig';
import {
  CLARITY_THRESHOLD,
  PITCH_MAX_HZ,
  PITCH_MIN_HZ,
  findPitchMPM,
  frequencyToNote,
} from '../../services/PitchAnalyzer';

interface TunerPedalProps {
  isRunning: boolean;
  active: boolean;
  onRequestStart: () => Promise<void> | void;
}

const TunerPedal: React.FC<TunerPedalProps> = ({ isRunning, active, onRequestStart }) => {
  const [note, setNote] = useState('--');
  const [frequency, setFrequency] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [detected, setDetected] = useState(false);
  const [clarity, setClarity] = useState(0);
  const smoothedPitchRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let lastTick = 0;

    const tick = () => {
      const now = performance.now();
      if (now - lastTick < 70) {
        raf = requestAnimationFrame(tick);
        return;
      }

      lastTick = now;
      const data = fretLabRig.getTimeDomainData();
      const sampleRate = fretLabRig.context?.sampleRate ?? 44100;

      if (data.length > 0) {
        const result = findPitchMPM(data, sampleRate);
        if (
          result.pitch > PITCH_MIN_HZ &&
          result.pitch < PITCH_MAX_HZ &&
          result.clarity > CLARITY_THRESHOLD
        ) {
          const smoothedPitch = smoothedPitchRef.current
            ? smoothedPitchRef.current * 0.55 + result.pitch * 0.45
            : result.pitch;
          smoothedPitchRef.current = smoothedPitch;

          const noteInfo = frequencyToNote(smoothedPitch);
          if (noteInfo) {
            setNote(noteInfo.note);
            setFrequency(noteInfo.frequency);
            setCents(noteInfo.cents);
            setDetected(true);
            setClarity(result.clarity);
          }
        } else {
          setDetected(false);
          setClarity(result.clarity);
        }
      } else {
        setDetected(false);
        setClarity(0);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, isRunning]);

  useEffect(() => {
    if (!active) {
      setNote('--');
      setFrequency(null);
      setCents(0);
      setDetected(false);
      setClarity(0);
      smoothedPitchRef.current = 0;
    }
  }, [active]);

  const isInTune = Math.abs(cents) < 4;
  const color = detected ? (isInTune ? '#4ade80' : '#f59e0b') : '#64748b';

  return (
    <div className="rig-tuner-card">
      <div className="rig-tuner-display" style={{ borderColor: detected ? `${color}33` : 'rgba(255,255,255,0.08)' }}>
        <div className="rig-tuner-note" style={{ color }}>
          {note}
        </div>
        <div className="rig-tuner-meta">
          <span>{frequency ? `${frequency.toFixed(1)} Hz` : isRunning ? 'Listening…' : 'Start rig to tune'}</span>
          <span>{detected ? `${cents > 0 ? '+' : ''}${cents}¢` : '—'}</span>
        </div>

        <div className="rig-tuner-track">
          <div className="rig-tuner-center" />
          <div
            className="rig-tuner-pointer"
            style={{ left: `calc(50% + ${Math.max(-46, Math.min(46, cents))}px)` }}
          />
        </div>

        <div className="rig-tuner-footer">
          <span>{detected ? (isInTune ? 'Perfect pitch' : cents > 0 ? 'Slightly sharp' : 'Slightly flat') : 'Play a string'}</span>
          <span>{clarity.toFixed(2)}</span>
        </div>
      </div>

      {!isRunning && (
        <button className="rig-tuner-btn" onClick={() => void onRequestStart()}>
          Start rig
        </button>
      )}
    </div>
  );
};

export default TunerPedal;

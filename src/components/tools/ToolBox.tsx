// src/components/tools/ToolBox.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import GuitarTuner from './GuitarTuner';
import RecordingAnalyzer from './RecordingAnalyzer';
import GuitarProcessor from './GuitarProcessor';
import { Button } from '../ui/Button';
// import { IconButton } from '../ui/IconButton';
import * as Tone from 'tone';

const TIME_SIGNATURES = [
  { beats: 4, noteValue: 4, label: '4/4' },
  { beats: 3, noteValue: 4, label: '3/4' },
  { beats: 2, noteValue: 4, label: '2/4' },
  { beats: 6, noteValue: 8, label: '6/8' },
];

const ToolBox: React.FC = () => {
  const { bpm, setBpm, timeSignature, setTimeSignature } = useMusic();
  const [isMetroPlaying, setIsMetroPlaying] = useState(false);
  
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const beatCountRef = useRef(0);

  // Инициализация синтезатора метронома
  useEffect(() => {
    synthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).toDestination();
    synthRef.current.volume.value = -6;

    return () => {
      synthRef.current?.dispose();
      loopRef.current?.dispose();
    };
  }, []);

  // Жесткая привязка лупа к BPM и размеру
  useEffect(() => {
    if (loopRef.current) {
      loopRef.current.dispose();
    }

    const interval = `${timeSignature.noteValue}n`;
    
    loopRef.current = new Tone.Loop((time) => {
      if (!synthRef.current) return;
      const isAccent = beatCountRef.current % timeSignature.beats === 0;
      synthRef.current.triggerAttackRelease(isAccent ? "C4" : "C3", "32n", time, isAccent ? 1 : 0.5);
      beatCountRef.current++;
    }, interval);

    Tone.Transport.bpm.value = bpm;

    if (isMetroPlaying) {
      loopRef.current.start(0);
      Tone.Transport.start();
    }

    return () => {
      loopRef.current?.dispose();
    };
  }, [bpm, timeSignature, isMetroPlaying]);

  const toggleMetronome = async () => {
    if (isMetroPlaying) {
      loopRef.current?.stop();
      Tone.Transport.stop();
      setIsMetroPlaying(false);
      beatCountRef.current = 0;
    } else {
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      loopRef.current?.start(0);
      Tone.Transport.start();
      setIsMetroPlaying(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* МЕТРОНОМ */}
      <div style={{
        background: 'var(--bg-panel)',
        padding: '20px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ marginRight: '8px', fontSize: '16px' }} aria-hidden="true">⏱️</span>
          <span style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            letterSpacing: '0.5px',
          }}>Metronome Studio</span>

          <div style={{ marginLeft: 'auto' }}>
            <Button
              variant={isMetroPlaying ? 'primary' : 'secondary'}
              size="sm"
              onClick={toggleMetronome}
              aria-label={isMetroPlaying ? 'Stop metronome' : 'Start metronome'}
              aria-pressed={isMetroPlaying}
              iconLeft={isMetroPlaying ? '■' : '▶'}
            >
              {isMetroPlaying ? 'Stop' : 'Start'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <input
            type="number"
            value={bpm}
            onChange={e => { const v = Number(e.target.value); if(v >= 20 && v <= 300) setBpm(v); }}
            style={{
              width: '75px',
              background: 'var(--bg-root)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '20px',
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 900,
              textAlign: 'center',
              padding: '6px 0',
              outline: 'none',
            }}
          />
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {TIME_SIGNATURES.map(sig => {
            const isActive =
              timeSignature.beats === sig.beats &&
              timeSignature.noteValue === sig.noteValue;
            return (
              <Button
                key={sig.label}
                variant="secondary"
                size="sm"
                active={isActive}
                onClick={() => setTimeSignature({ beats: sig.beats, noteValue: sig.noteValue })}
                aria-pressed={isActive}
                aria-label={`Time signature ${sig.label}`}
                fullWidth
              >
                {sig.label}
              </Button>
            );
          })}
        </div>
      </div>

<GuitarProcessor />
      <GuitarTuner />
      <RecordingAnalyzer />

    </div>
  );
};

export default ToolBox;
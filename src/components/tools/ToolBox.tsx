// src/components/tools/ToolBox.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import GuitarTuner from './GuitarTuner';
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

  const toggleMetronome = async (e: React.MouseEvent) => {
    (e.currentTarget as HTMLButtonElement).blur();
    
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
      <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ marginRight: '8px', fontSize: '16px' }}>⏱️</span>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Metronome Studio</span>
          
          <button 
            onClick={toggleMetronome} 
            style={{ marginLeft: 'auto', width: '38px', height: '38px', borderRadius: '50%', background: isMetroPlaying ? 'var(--accent)' : 'var(--bg-secondary)', color: isMetroPlaying ? '#000' : 'var(--accent)', border: `2px solid var(--accent)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', transition: '0.2s', boxShadow: isMetroPlaying ? '0 0 12px var(--accent)' : 'none' }}
          >
            {isMetroPlaying ? '■' : '▶'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <input 
            type="number" 
            value={bpm} 
            onChange={e => { const v = Number(e.target.value); if(v >= 20 && v <= 300) setBpm(v); }} 
            style={{ width: '75px', background: 'var(--bg-root)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '20px', fontWeight: 900, textAlign: 'center', padding: '6px 0', outline: 'none' }} 
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
          {TIME_SIGNATURES.map(sig => (
            <button
              key={sig.label}
              onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); setTimeSignature({ beats: sig.beats, noteValue: sig.noteValue }); }}
              style={{
                background: timeSignature.beats === sig.beats && timeSignature.noteValue === sig.noteValue ? 'var(--accent)' : 'var(--bg-root)',
                color: timeSignature.beats === sig.beats && timeSignature.noteValue === sig.noteValue ? '#000' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                padding: '6px 0',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {sig.label}
            </button>
          ))}
        </div>
      </div>

      <GuitarTuner />

    </div>
  );
};

export default ToolBox;
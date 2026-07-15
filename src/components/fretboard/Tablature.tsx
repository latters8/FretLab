// src/components/fretboard/Tablature.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSmartLick, type Lick } from '../../services/AIEngine';
import { generateTips, type Tip } from '../../utils/tipsGenerator';
import TablatureDisplay from './TablatureDisplay';

const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];

interface TablatureProps {
  compact?: boolean;
}

const Tablature: React.FC<TablatureProps> = ({ compact = false }) => {
  const { mode, keyNote, getScaleNotes, bpm, timeSignature } = useMusic();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentLick, setCurrentLick] = useState<Lick | null>(null);
  const [localActiveStep, setLocalActiveStep] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [tips, setTips] = useState<Tip[]>([]);

  // 🔥 КОНТЕКСТ СОЗДАЕТСЯ ОДИН РАЗ (Нет утечек!)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'G', 'A'];
    const safeKey = keyNote || 'C';
    const safeMode = mode || 'major';
    
    const newLick = generateSmartLick(
      safeScale, safeKey, safeMode, bpm || 120, timeSignature || { beats: 4, noteValue: 4 }
    );
    setCurrentLick(newLick);
    
    try {
      setTips(generateTips(newLick, safeKey, safeMode, ['I', 'IV', 'V', 'I'], bpm || 120));
    } catch (e) {}
    stopPlayback();
  }, [keyNote, mode, bpm, timeSignature, getScaleNotes]);

  // 🔥 МГНОВЕННЫЙ ОСТАНОВ (Без убийства контекста)
  const stopPlayback = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (err) {}
    });
    oscillatorsRef.current = [];

    setIsPlayingAudio(false);
    setLocalActiveStep(-1);
  };

  const handleGenerate = (e?: React.MouseEvent) => {
    if (e) (e.currentTarget as HTMLButtonElement).blur(); 
    if (isPlayingAudio) stopPlayback();

    setIsGenerating(true);
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'G', 'A'];

    setTimeout(() => {
      const newLick = generateSmartLick(safeScale, keyNote || 'C', mode || 'major', bpm || 120, timeSignature || { beats: 4, noteValue: 4 });
      setCurrentLick(newLick);
      try {
        setTips(generateTips(newLick, keyNote || 'C', mode || 'major', ['I', 'IV', 'V', 'I'], bpm || 120));
      } catch (err) {}
      setIsGenerating(false);
    }, 350);
  };

  const playLickAudio = async (e?: React.MouseEvent) => {
    if (e) (e.currentTarget as HTMLButtonElement).blur(); 
    if (!currentLick || isPlayingAudio) return;

    stopPlayback();

    // 🔥 Инициализируем контекст ТОЛЬКО если его нет
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    
    const ctx = audioCtxRef.current;
    
    // Пробуждаем браузерный аудио-движок
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setIsPlayingAudio(true);
    setLocalActiveStep(-1);

    try {
      let startTime = ctx.currentTime + 0.05;
      const currentBpm = (bpm || 120) * playbackSpeed;
      const quarterDuration = 60 / currentBpm;

      currentLick.notes.forEach((note, index) => {
        const durationMap: Record<string, number> = { '4n': 1.0, '8n': 0.5, '16n': 0.25, '2n': 2.0 };
        const factor = durationMap[note.duration || '8n'] || 0.5;
        const actualDuration = quarterDuration * factor;

        const timeoutId = window.setTimeout(() => setLocalActiveStep(index), (startTime - ctx.currentTime) * 1000);
        timeoutsRef.current.push(timeoutId);

        if (!note.isRest && note.fret !== null) {
          const freq = OPEN_FREQS[note.string] * Math.pow(2, note.fret / 12);
          
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + actualDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + actualDuration + 0.05);
          
          oscillatorsRef.current.push(osc);
        }

        startTime += actualDuration;
      });

      const endTimeout = window.setTimeout(() => stopPlayback(), (startTime - ctx.currentTime) * 1000 + 300);
      timeoutsRef.current.push(endTimeout);

    } catch (err) {
      stopPlayback();
    }
  };

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: compact ? '0' : '16px' }}>
      
      <div style={{ padding: compact ? '10px 16px' : '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: compact ? '11px' : '12px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎲 AI Phrase Builder</span>
          <span style={{ fontSize: compact ? '13px' : '14px', fontWeight: 900, color: 'var(--accent)' }}>{currentLick ? currentLick.name : 'Генерация...'}</span>
        </div>

        {!compact && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>SPEED</span>
              <input type="range" min="0.5" max="1.8" step="0.1" value={playbackSpeed} onChange={e => setPlaybackSpeed(parseFloat(e.target.value))} style={{ width: '70px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 900 }}>{playbackSpeed.toFixed(1)}x</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {!isPlayingAudio ? (
                <button onClick={playLickAudio} disabled={isGenerating || !currentLick} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>▶ PLAY</button>
              ) : (
                <button onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); stopPlayback(); }} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>⏹ STOP</button>
              )}
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || isPlayingAudio} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
              🎲 RE-GENERATE
            </button>
          </div>
        )}
      </div>

<div style={{ padding: compact ? '12px' : '24px', overflowX: 'auto', background: '#111216', flex: 1, display: 'flex', alignItems: 'flex-start' }}>
<TablatureDisplay notes={currentLick ? currentLick.notes : []} activeStep={localActiveStep} isGenerating={isGenerating} compact={compact} noteSpacing={compact ? 50 : 70} height={compact ? 160 : 260} />
      </div>

      {tips.length > 0 && !compact && (
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💡 Анализ фразы:</div>
          {tips.slice(0, 2).map((tip, i) => (
            <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)', background: 'rgba(0,255,157,0.03)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid #00b8ff' }}>
              <strong>{tip.title}:</strong> {tip.description}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Tablature;
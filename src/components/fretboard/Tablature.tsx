// src/components/fretboard/Tablature.tsx

import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSmartLick, type Lick } from '../../services/AIEngine';
import { generateTips, type Tip } from '../../utils/tipsGenerator';
import TablatureDisplay from './TablatureDisplay';
import AnimatedTipBlock from '../tips/AnimatedTipBlock';
import * as Tone from 'tone';
import { audioManager } from '../../services/AudioManager';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const effectiveCompact = compact || isMobile;

  const timeoutsRef = useRef<number[]>([]);
  const playbackIdRef = useRef<number>(0);
  const sequencePartRef = useRef<Tone.Part | null>(null);
  const playheadAnimRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);


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

  // 🔥 МГНОВЕННЫЙ ОСТАНОВ — отменяет Tone.Transport (сэмплы) + синтезаторы (как в SoloGenerator)
  const stopPlayback = () => {
    playbackIdRef.current += 1; // инкремент отменяет все запланированные ноты
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Остановка Tone.Part — отменяет запланированные сэмплы (аналог SoloGenerator)
    if (sequencePartRef.current) {
      try {
        sequencePartRef.current.stop();
        sequencePartRef.current.dispose();
      } catch (_) {}
      sequencePartRef.current = null;
    }

    // Остановка Transport — отменяет все future события
    Tone.Transport.stop();
    Tone.Transport.cancel(0);

    // Safety net: останавливаем синтезаторы и осцилляторы
    audioManager.stopAll();

    cancelAnimationFrame(playheadAnimRef.current);

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

  // 🎸 Воспроизведение через Tone.Part + AudioManager (как в SoloGenerator)
  const playLickAudio = async (e?: React.MouseEvent) => {
    if (e) (e.currentTarget as HTMLButtonElement).blur(); 
    if (!currentLick || isPlayingAudio) return;

    stopPlayback();

    // Инициализация AudioManager (загружает гитарные сэмплы из public/samples/guitar/)
    await audioManager.init();
    await Tone.start();

    setIsPlayingAudio(true);
    setLocalActiveStep(-1);

    try {
      const currentBpm = (bpm || 120) * playbackSpeed;
      const quarterDuration = 60 / currentBpm;

      Tone.Transport.bpm.value = currentBpm;

      const currentPlaybackId = playbackIdRef.current;
      const events: any[] = [];
      let totalDurationSec = 0;

      currentLick.notes.forEach((note, index) => {
        const durationMap: Record<string, number> = { '4n': 1.0, '8n': 0.5, '16n': 0.25, '2n': 2.0 };
        const factor = durationMap[note.duration || '8n'] || 0.5;
        const actualDurationSec = quarterDuration * factor;

        const timeSec = totalDurationSec;
        totalDurationSec += actualDurationSec;

        // Визуальная подсветка активной ноты через setTimeout (не звук!)
        const timeoutId = window.setTimeout(() => {
          if (playbackIdRef.current !== currentPlaybackId) return;
          setLocalActiveStep(index);
        }, timeSec * 1000);
        timeoutsRef.current.push(timeoutId);

        if (!note.isRest && note.fret !== null) {
          const freq = OPEN_FREQS[note.string] * Math.pow(2, note.fret / 12);
          const velocity = note.accent ? 0.9 : 0.6;

          events.push({
            time: timeSec,
            type: 'solo_web_audio',
            freq,
            duration: actualDurationSec,
            velocity,
            index
          });
        }
      });

      // Создаём Tone.Part — он будет управляться через Transport
      // При stop() Part.dispose() отменяет ВСЕ запланированные сэмплы
      sequencePartRef.current = new Tone.Part((time, value) => {
        if (value.type === 'solo_web_audio' && !value.isRest) {
          audioManager.playGuitarNote(
            value.freq,
            value.duration,
            time + 0.02,
            value.velocity
          );
        }
      }, events).start(0);

      // Не зацикливаем (как в Tablature — однократное воспроизведение)
      sequencePartRef.current.loop = false;

      Tone.Transport.start();
      startTimeRef.current = Tone.now();

      // Авто-остановка по окончании
      const endTimeout = window.setTimeout(() => {
        if (playbackIdRef.current !== currentPlaybackId) return;
        stopPlayback();
      }, totalDurationSec * 1000 + 500);
      timeoutsRef.current.push(endTimeout);

    } catch (err) {
      console.error('[Tablature] playLickAudio error:', err);
      stopPlayback();
    }
  };

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: effectiveCompact ? '0' : '16px' }}>
      
      <div style={{ padding: effectiveCompact ? '10px 16px' : '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: effectiveCompact ? '11px' : '12px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎲 AI Phrase Builder</span>
          <span style={{ fontSize: effectiveCompact ? '13px' : '14px', fontWeight: 900, color: 'var(--accent)' }}>{currentLick ? currentLick.name : 'Генерация...'}</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', width: effectiveCompact ? '100%' : 'auto', marginTop: effectiveCompact ? '8px' : '0' }}>
          {!effectiveCompact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>SPEED</span>
              <input type="range" min="0.5" max="1.8" step="0.1" value={playbackSpeed} onChange={e => setPlaybackSpeed(parseFloat(e.target.value))} style={{ width: '70px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 900 }}>{playbackSpeed.toFixed(1)}x</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            {!isPlayingAudio ? (
              <button onClick={playLickAudio} disabled={isGenerating || !currentLick} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: `${effectiveCompact ? '8px 20px' : '6px 16px'}`, borderRadius: '4px', fontWeight: 900, fontSize: `${effectiveCompact ? '13px' : '11px'}`, cursor: 'pointer', minWidth: effectiveCompact ? '80px' : 'auto' }}>▶ PLAY</button>
            ) : (
              <button onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); stopPlayback(); }} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: `${effectiveCompact ? '8px 20px' : '6px 16px'}`, borderRadius: '4px', fontWeight: 900, fontSize: `${effectiveCompact ? '13px' : '11px'}`, cursor: 'pointer', minWidth: effectiveCompact ? '80px' : 'auto' }}>⏹ STOP</button>
            )}
          </div>

          <button onClick={handleGenerate} disabled={isGenerating || isPlayingAudio} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: `${effectiveCompact ? '8px 18px' : '6px 14px'}`, borderRadius: '4px', fontSize: `${effectiveCompact ? '13px' : '11px'}`, fontWeight: 800, cursor: 'pointer', minWidth: effectiveCompact ? '100px' : 'auto' }}>
            🎲 RE-GENERATE
          </button>
        </div>
      </div>

<div style={{ padding: effectiveCompact ? '12px' : '24px', overflowX: 'auto', background: '#111216', flex: 1, display: 'flex', alignItems: 'flex-start' }}>
<TablatureDisplay notes={currentLick ? currentLick.notes : []} activeStep={localActiveStep} isGenerating={isGenerating} compact={effectiveCompact} noteSpacing={effectiveCompact ? 50 : 70} height={effectiveCompact ? 160 : 260} />
      </div>

      {tips.length > 0 && !effectiveCompact && (
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>💡 Совет:</div>
          <AnimatedTipBlock tips={tips} />
        </div>
      )}

    </div>
  );
};

export default Tablature;

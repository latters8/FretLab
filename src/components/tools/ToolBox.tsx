// src/components/tools/ToolBox.tsx

import React, { useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';
import { useTuner } from '../../hooks/useTuner';

const ToolBox: React.FC = () => {
  const { 
    bpm, setBpm, isPlaying, togglePlay, 
    timeSignature, setTimeSignature 
  } = useMusic();
  
  // Подключаем аудио-движок студийного метронома
  useMetronome(bpm, timeSignature);
  
  // Подключаем хроматический тюнер
  const { 
    isActive: isTunerActive, 
    startTuner, 
    stopTuner, 
    note: tunerNote, 
    cents, 
    frequency,
    getAudioData
  } = useTuner();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const TIME_SIGNATURES = [
    { beats: 4, noteValue: 4, label: '4/4' },
    { beats: 3, noteValue: 4, label: '3/4' },
    { beats: 2, noteValue: 4, label: '2/4' },
    { beats: 6, noteValue: 8, label: '6/8' },
    { beats: 5, noteValue: 4, label: '5/4' },
    { beats: 7, noteValue: 4, label: '7/4' },
    { beats: 12, noteValue: 8, label: '12/8' }
  ];

  // 🔥 ГОРЯЧИЕ КЛАВИШИ: Нажатие клавиши 'T' включает/выключает тюнер из любого места
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'е') {
        e.preventDefault();
        isTunerActive ? stopTuner() : startTuner();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTunerActive, startTuner, stopTuner]);

  // 🔥 ЖИВОЙ СИНХРОННЫЙ ЦИКЛ ОТРИСОВКИ ОСЦИЛЛОГРАММЫ (Исправляет чёрный экран canvas)
  useEffect(() => {
    if (!isTunerActive || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      if (!isTunerActive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Рисуем аудио-сетричную сетку на фоне
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const linesCount = 4;
      for (let i = 0; i <= linesCount; i++) {
        const y = (canvas.height / linesCount) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Получаем бинарный поток частот из микрофонного буфера гитары
      const dataArray = typeof getAudioData === 'function' ? getAudioData() : null;

      ctx.beginPath();
      if (!dataArray || dataArray.length === 0) {
        // Если тишина — рисуем красивую ровную струну посередине
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        const isInTune = Math.abs(cents) < 5;
        ctx.strokeStyle = isInTune ? '#4ade80' : 'var(--accent)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 6;
        ctx.shadowColor = isInTune ? 'rgba(74,222,128,0.4)' : 'rgba(0,255,157,0.2)';

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] * 1.4;
          const y = (v * canvas.height / 2) + canvas.height / 2;

          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Сбрасываем фильтры теней
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isTunerActive, cents, getAudioData]);

  const isInTune = Math.abs(cents) < 5;
  const tunerColor = isTunerActive ? (isInTune ? '#4ade80' : '#f59e0b') : 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ============================================================ */}
      {/* СЕКЦИЯ А: МЕТРОНОМ                                           */}
      {/* ============================================================ */}
      <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ marginRight: '8px', fontSize: '16px' }}>⏱️</span>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Metronome Studio</span>
          
          {/* Кнопка Play/Stop с фиксом опечатки justifyContent и защитой от зажатого Пробела */}
          <button 
            onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); togglePlay(); }} 
            style={{ marginLeft: 'auto', width: '38px', height: '38px', borderRadius: '50%', background: isPlaying ? 'var(--accent)' : 'var(--bg-secondary)', color: isPlaying ? '#000' : 'var(--accent)', border: `2px solid var(--accent)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', transition: '0.2s', boxShadow: isPlaying ? '0 0 12px var(--accent)' : 'none' }}
          >
            {isPlaying ? '■' : '▶'}
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

        {/* Сетка размеров такта */}
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

      {/* ============================================================ */}
      {/* СЕКЦИЯ Б: ХРОМАТИЧЕСКИЙ ТЮНЕР ГИТАРЫ                         */}
      {/* ============================================================ */}
      <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🎙️</span>
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Chromatic Tuner</span>
          </div>
          <button
            onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); isTunerActive ? stopTuner() : startTuner(); }}
            style={{
              background: isTunerActive ? '#ff4444' : 'var(--accent)',
              color: isTunerActive ? '#fff' : '#000',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              transition: '0.2s',
              boxShadow: isTunerActive ? 'none' : '0 0 12px var(--accent)'
            }}
          >
            {isTunerActive ? 'TURN OFF' : 'LISTEN'}
          </button>
        </div>

        {isTunerActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'var(--bg-root)', padding: '16px', borderRadius: '8px', border: `1px solid ${isInTune ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.02)'}` }}>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', position: 'relative' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'monospace', color: isInTune ? '#4ade80' : 'var(--text-primary)', textShadow: isInTune ? '0 0 24px #4ade80' : 'none', transition: 'color 0.2s' }}>
                {tunerNote || '--'}
              </span>
              {cents > 3 && <span style={{ color: '#ef4444', fontSize: '16px', fontWeight: 900, position: 'absolute', right: '-18px', top: '10px' }}>♯</span>}
              {cents < -3 && <span style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 900, position: 'absolute', left: '-18px', top: '10px' }}>♭</span>}
            </div>

            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 700 }}>
              {frequency ? `${frequency.toFixed(1)} Hz` : 'Detecting...'}
            </span>

            {/* ИНДИКАТОР ЦЕНТОВ / СТРЕЛКА ОТКЛОНЕНИЯ */}
            <div style={{ width: '100%', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'monospace' }}>
                <span style={{ color: '#3b82f6' }}>-50b</span>
                <span style={{ color: '#4ade80', fontWeight: 900 }}>IN TUNE</span>
                <span style={{ color: '#ef4444' }}>+50#</span>
              </div>
              
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', position: 'relative', overflow: 'visible' }}>
                <div style={{ position: 'absolute', left: '50%', top: '-2px', width: '2px', height: '10px', background: 'rgba(255,255,255,0.15)' }} />
                
                <div style={{
                  position: 'absolute',
                  top: '-3px',
                  left: `${50 + (cents || 0) * 1.0}%`,
                  width: '6px',
                  height: '12px',
                  background: tunerColor,
                  borderRadius: '2px',
                  transform: 'translateX(-50%)',
                  transition: 'left 0.1s ease-out, background-color 0.2s',
                  boxShadow: isTunerActive ? `0 0 8px ${tunerColor}` : 'none'
                }} />
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, color: tunerColor, textAlign: 'center', marginTop: '4px' }}>
              {tunerNote ? (isInTune ? '🎯 ИДЕАЛЬНО!' : (cents > 0 ? '⚠️ Перетянут (Высоко)' : '⚠️ Недотянут (Низко)')) : 'Сыграйте струну...'}
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '32px 0', background: 'var(--bg-root)', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎙️</span>
            <span>Нажмите кнопку <strong style={{ color: 'var(--accent)' }}>LISTEN</strong> или <strong style={{ color: 'var(--accent)' }}>T</strong>,<br />чтобы активировать тюнер</span>
          </div>
        )}

        {/* ПАНЕЛЬ ВИЗУАЛИЗАЦИИ ВОЛНЫ */}
        <div style={{ width: '100%', height: '60px', background: '#0b0c10', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)', overflow: 'hidden' }}>
          <canvas 
            ref={canvasRef} 
            width={260} 
            height={60} 
            style={{ width: '100%', height: '100%', display: 'block' }} 
          />
        </div>

      </div>

    </div>
  );
};

export default ToolBox;
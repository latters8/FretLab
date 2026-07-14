// src/components/tools/GuitarTuner.tsx
import React, { useRef, useEffect } from 'react';
import { useTuner } from '../../hooks/useTuner';

const GuitarTuner: React.FC = () => {
  // 🔥 Забираем getAudioData, чтобы оживить осциллограмму сигнала
  const { isActive, note, cents, frequency, startTuner, stopTuner, getAudioData } = useTuner() as any;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // 🔥 ЖИВОЙ ЦИКЛ АНИМАЦИИ ДЛЯ ХОЛСТА (Исправляет чёрный экран)
  useEffect(() => {
    if (!isActive || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Очищаем холст, если тюнер выключен
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
      if (!isActive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Рисуем сетку на заднем фоне
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const lines = 6;
      for (let i = 0; i <= lines; i++) {
        const y = (canvas.height / lines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Получаем реальные данные звуковой волны из хука
      const dataArray = typeof getAudioData === 'function' ? getAudioData() : null;

      ctx.beginPath();
      // Если гитара молчит или тюнер только запущен — рисуем ровную линию
      if (!dataArray || dataArray.length === 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        // Подсвечиваем волну зелёным, если нота поймана идеально accurate (< 5 центов)
        const isInTune = Math.abs(cents) < 5;
        ctx.strokeStyle = isInTune ? '#4ade80' : 'var(--accent)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = isInTune ? 'rgba(74,222,128,0.5)' : 'rgba(0,255,157,0.3)';

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          // Масштабируем амплитуду волны под высоту нашего окошка
          const v = dataArray[i] * 1.5; 
          const y = (v * canvas.height / 2) + canvas.height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        // Сбрасываем тени, чтобы не тормозил остальной интерфейс
        ctx.shadowBlur = 0; 
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, cents, getAudioData]);

  const isInTune = Math.abs(cents) < 5;
  const tunerColor = isActive ? (isInTune ? '#4ade80' : '#f59e0b') : 'var(--text-muted)';

  return (
    <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* ПАНЕЛЬ ЗАГОЛОВКА И КНОПКА ТУМБЛЕРА */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎙️</span>
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Chromatic Tuner</span>
        </div>
        <button
          onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); isActive ? stopTuner() : startTuner(); }}
          style={{
            background: isActive ? '#ff4444' : 'var(--accent)',
            color: isActive ? '#fff' : '#000',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer',
            transition: '0.2s',
            boxShadow: isActive ? 'none' : '0 0 12px var(--accent)'
          }}
        >
          {isActive ? 'TURN OFF' : 'LISTEN'}
        </button>
      </div>

      {/* ГЛАВНЫЙ ДИСПЛЕЙ НОТЫ И ЧАСТОТЫ */}
      {isActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'var(--bg-root)', padding: '16px', borderRadius: '8px', border: `1px solid ${isInTune ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.02)'}` }}>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', position: 'relative' }}>
            <span style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'monospace', color: isInTune ? '#4ade80' : 'var(--text-primary)', textShadow: isInTune ? '0 0 24px #4ade80' : 'none', transition: 'color 0.2s' }}>
              {note || '--'}
            </span>
            {cents > 3 && <span style={{ color: '#ef4444', fontSize: '16px', fontWeight: 900, position: 'absolute', right: '-18px', top: '10px' }}>♯</span>}
            {cents < -3 && <span style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 900, position: 'absolute', left: '-18px', top: '10px' }}>♭</span>}
          </div>

          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 700 }}>
            {frequency ? `${frequency.toFixed(1)} Hz` : 'Detecting...'}
          </span>

          {/* КРУГОВАЯ ШКАЛА / СТРЕЛКА ЦЕНТОВ */}
          <div style={{ width: '100%', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'monospace' }}>
              <span style={{ color: '#3b82f6' }}>-50b</span>
              <span style={{ color: '#4ade80', fontWeight: 900 }}>IN TUNE</span>
              <span style={{ color: '#ef4444' }}>+50#</span>
            </div>
            
            {/* Трэк шкалы */}
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', position: 'relative', overflow: 'visible' }}>
              {/* Центральная идеальная отметка */}
              <div style={{ position: 'absolute', left: '50%', top: '-2px', width: '2px', height: '10px', background: 'rgba(255,255,255,0.15)' }} />
              
              {/* Подвижная стрелка-бегунок */}
              <div style={{
                position: 'absolute',
                top: '-3px',
                left: `${50 + (cents || 0) * 1.0}%`, // Маппинг центов (-50 до +50) в проценты ширины
                width: '6px',
                height: '12px',
                background: tunerColor,
                borderRadius: '2px',
                transform: 'translateX(-50%)',
                transition: 'left 0.1s ease-out, background-color 0.2s',
                boxShadow: isActive ? `0 0 8px ${tunerColor}` : 'none'
              }} />
            </div>
          </div>

          {/* ТЕКСТОВАЯ ПОДСКАЗКА СТУДЕНТУ */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: tunerColor, textAlign: 'center', marginTop: '4px' }}>
            {note ? (isInTune ? '🎯 ИДЕАЛЬНО!' : (cents > 0 ? '⚠️ Слишком высоко (Перетянут)' : '⚠️ Слишком низко (Недотянут)')) : 'Сыграйте струну...'}
          </div>

        </div>
      ) : (
        /* СОСТОЯНИЕ ОЖИДАНИЯ */
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '32px 0', background: 'var(--bg-root)', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🎙️</span>
          <span>Нажмите кнопку <strong style={{ color: 'var(--accent)' }}>LISTEN</strong>,<br />чтобы активировать тюнер</span>
        </div>
      )}

      {/* ОКНО ЖИВОЙ ЗВУКОВОЙ ВОЛНЫ */}
      <div style={{ width: '100%', height: '60px', background: '#0b0c10', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)', overflow: 'hidden' }}>
        <canvas 
          ref={canvasRef} 
          width={260} 
          height={60} 
          style={{ width: '100%', height: '100%', display: 'block' }} 
        />
      </div>

    </div>
  );
};

export default GuitarTuner;
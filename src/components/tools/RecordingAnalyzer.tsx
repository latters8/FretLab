// src/components/tools/RecordingAnalyzer.tsx
import React, { useRef, useEffect } from 'react';
import { useRecordingAnalyzer } from '../../hooks/useRecordingAnalyzer';

const RecordingAnalyzer: React.FC = () => {
  const { isRecording, startRecording, stopRecording, noteEvents, summary, getAudioData } =
    useRecordingAnalyzer();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Живая волна во время записи — тот же паттерн, что в GuitarTuner
  useEffect(() => {
    if (!isRecording || !canvasRef.current) {
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
      if (!isRecording) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dataArray = getAudioData();
      ctx.beginPath();
      if (!dataArray || dataArray.length === 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(239,68,68,0.4)';

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] * 1.5;
          const y = (v * canvas.height) / 2 + canvas.height / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, getAudioData]);

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--bg-panel)',
        padding: '20px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* ЗАГОЛОВОК И КНОПКА ЗАПИСИ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎧</span>
<span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.5px',
            }}
          >
            Recording Analyzer — соответствие сыгранной фразы выбранной тональности
          </span>
        </div>
        <button
          onClick={(e) => {
            (e.currentTarget as HTMLButtonElement).blur();
            isRecording ? stopRecording() : startRecording();
          }}
          style={{
            background: isRecording ? '#ff4444' : 'var(--accent)',
            color: isRecording ? '#fff' : '#000',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer',
            transition: '0.2s',
            boxShadow: isRecording ? 'none' : '0 0 12px var(--accent)',
          }}
        >
          {isRecording ? '⏹ STOP' : '⏺ RECORD'}
        </button>
      </div>

      {/* ВОЛНА ВО ВРЕМЯ ЗАПИСИ */}
      {isRecording && (
        <div
          style={{
            width: '100%',
            height: '60px',
            background: '#0b0c10',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.02)',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={260}
            height={60}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {/* СОСТОЯНИЕ ОЖИДАНИЯ (ничего ещё не записано) */}
      {!isRecording && !summary && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
            padding: '32px 0',
            background: 'var(--bg-root)',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🎸</span>
          <span>
            Нажми <strong style={{ color: 'var(--accent)' }}>RECORD</strong> и сыграй фразу —
            <br />
            разберём интонацию, лад и ритм
          </span>
        </div>
      )}

      {/* РЕЗУЛЬТАТЫ АНАЛИЗА */}
      {!isRecording && summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Сводные метрики */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Metric label="Ноты" value={String(summary.totalNotes)} />
            <Metric label="В ладу" value={`${summary.inScalePercent}%`} />
            <Metric label="Интонация" value={`±${summary.avgAbsCents.toFixed(0)}¢`} />
          </div>

          {/* Советы */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {summary.tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  fontSize: '12px',
                  lineHeight: 1.4,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-root)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                }}
              >
                {tip}
              </div>
            ))}
          </div>

          {/* Таймлайн распознанных нот */}
          {noteEvents.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                Распознанные ноты
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {noteEvents.map((ev, i) => (
                  <span
                    key={i}
                    title={`${ev.duration.toFixed(0)}ms, ${ev.avgCents > 0 ? '+' : ''}${ev.avgCents.toFixed(0)}¢`}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 7px',
                      borderRadius: '4px',
                      background: ev.inScale ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                      color: ev.inScale ? '#4ade80' : '#ef4444',
                      border: `1px solid ${ev.inScale ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}
                  >
                    {ev.note}
                    {ev.octave}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startRecording}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🔁 Записать ещё раз
          </button>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      flex: 1,
      textAlign: 'center',
      background: 'var(--bg-root)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '10px 6px',
    }}
  >
    <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
      {value}
    </div>
    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '2px' }}>
      {label}
    </div>
  </div>
);

export default RecordingAnalyzer;

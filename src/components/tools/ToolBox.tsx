import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';
import { useTuner } from '../../hooks/useTuner';

const ToolBox: React.FC = () => {
  const { bpm, setBpm, isPlaying, togglePlay } = useMusic();
  useMetronome(bpm);
  
  const { isActive: isTunerActive, startTuner, stopTuner, note: tunerNote, cents, frequency } = useTuner();

  // Логика цвета и LED-индикации
  const isPerfectPitch = Math.abs(cents) < 5;
  //const isSharp = cents > 0;
  
  // Создаем массив из 21 деления (от -10 до +10), каждое деление = 5 центов
  const leds = Array.from({ length: 21 }, (_, i) => i - 10);
  const activeLedIndex = Math.round(cents / 5);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
      
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
        🎛️ Control Center
      </div>

      {/* 1. METRONOME */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-root)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>TEMPO</span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 900 }}>BPM</span>
        </div>
        
        <input 
          type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} 
          style={{ width: '70px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontWeight: 900, fontSize: '18px', outline: 'none', textAlign: 'center', padding: '4px 0' }} 
        />
        
        <button 
          onClick={togglePlay} 
          style={{ marginLeft: 'auto', width: '42px', height: '42px', borderRadius: '50%', background: isPlaying ? 'var(--accent)' : 'var(--bg-secondary)', color: isPlaying ? '#000' : 'var(--accent)', border: `2px solid var(--accent)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', transition: '0.2s', boxShadow: isPlaying ? '0 0 12px var(--accent)' : 'none' }}
        >
          {isPlaying ? '■' : '▶'}
        </button>
      </div>

      {/* 2. WAZA / KORG STYLE TUNER */}
      <div style={{ background: '#0a0a0c', padding: '20px 16px', borderRadius: '12px', border: '2px solid #1a1a20', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.8)' }}>
        
        {/* Блик на "стекле" прибора */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <span style={{ fontSize: '10px', color: '#666', fontWeight: 900, letterSpacing: '1px', fontFamily: 'monospace' }}>PITCHBLACK ENGINE</span>
          <button 
            onClick={isTunerActive ? stopTuner : startTuner}
            style={{
              background: isTunerActive ? 'transparent' : '#1a1a20',
              color: isTunerActive ? 'var(--accent)' : '#666',
              border: `1px solid ${isTunerActive ? 'var(--accent)' : '#333'}`,
              padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: '0.2s',
              boxShadow: isTunerActive ? 'inset 0 0 8px rgba(0,255,157,0.2), 0 0 8px rgba(0,255,157,0.4)' : 'none'
            }}
          >
            {isTunerActive ? 'BYPASS (ON)' : 'ENGAGE (OFF)'}
          </button>
        </div>

        {isTunerActive ? (
          <div style={{ textAlign: 'center', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* LED Дисплей (Нота) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: isPerfectPitch ? 'var(--accent)' : '#fff', lineHeight: 1, textShadow: isPerfectPitch ? '0 0 24px var(--accent)' : '0 0 12px rgba(255,255,255,0.4)', transition: 'color 0.1s', fontFamily: 'sans-serif', letterSpacing: '-2px' }}>
                {tunerNote || '-'}
              </div>
            </div>
            
            {/* Шкала стробоскопа (LED Array) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '24px', padding: '0 8px', marginTop: '8px' }}>
              {leds.map(led => {
                const isCenter = led === 0;
                const isActive = tunerNote && led === activeLedIndex;
                
                let ledBg = '#222';
                let ledShadow = 'none';

                if (isActive) {
                  if (isCenter) {
                    ledBg = 'var(--accent)';
                    ledShadow = '0 0 12px var(--accent), 0 0 24px var(--accent)';
                  } else {
                    ledBg = led < 0 ? '#ff3333' : '#ff3333'; // Красный для отклонений
                    ledShadow = '0 0 8px #ff3333';
                  }
                } else if (isCenter) {
                  // Центральный светодиод всегда слегка подсвечен как ориентир
                  ledBg = 'rgba(0, 255, 157, 0.15)'; 
                }

                return (
                  <div key={led} style={{
                    width: isCenter ? '6px' : '4px',
                    height: isCenter ? '24px' : (Math.abs(led) % 5 === 0 ? '16px' : '8px'), // Риски высоты
                    background: ledBg,
                    borderRadius: '2px',
                    boxShadow: ledShadow,
                    transition: 'background 0.05s ease-out, box-shadow 0.05s ease-out'
                  }} />
                );
              })}
            </div>

            {/* Инфо панель */}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '9px', fontWeight: 800, fontFamily: 'monospace', marginTop: '4px' }}>
              <span>FLAT</span>
              <span style={{ color: isPerfectPitch ? 'var(--accent)' : '#666' }}>
                {tunerNote ? `${frequency} Hz | ${cents > 0 ? '+' : ''}${cents} ¢` : 'AWAITING SIGNAL...'}
              </span>
              <span>SHARP</span>
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#444', fontSize: '11px', padding: '32px 0', fontWeight: 800, letterSpacing: '1px' }}>
            TUNER BYPASSED
          </div>
        )}
      </div>

    </div>
  );
};

export default ToolBox;
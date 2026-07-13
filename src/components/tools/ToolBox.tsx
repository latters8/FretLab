import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';
import { useTuner } from '../../hooks/useTuner';

const ToolBox: React.FC = () => {
  const { bpm, setBpm, isPlaying, togglePlay } = useMusic();
  useMetronome(bpm);
  
  // Подключаем хук тюнера
  const { isActive: isTunerActive, startTuner, stopTuner, note: tunerNote, cents } = useTuner();

  // Логика цвета тюнера: зеленый, если попал в ноту (погрешность меньше 5 центов)
  const isPerfectPitch = Math.abs(cents) < 5;
  const needleColor = isPerfectPitch ? 'var(--accent)' : (cents < 0 ? '#ffb800' : '#ff3333');

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      borderRadius: 'var(--radius)', 
      border: '1px solid var(--border-color)', 
      padding: '24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px',
      flexShrink: 0 
    }}>
      
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
        🎛️ Control Center
      </div>

      {/* 1. Блок Метронома */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-root)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>TEMPO</span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 900 }}>BPM</span>
        </div>
        
        <input 
          type="number" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))} 
          style={{ 
            width: '70px', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '6px',
            color: 'var(--text-primary)', 
            fontWeight: 900, 
            fontSize: '18px', 
            outline: 'none', 
            textAlign: 'center',
            padding: '4px 0'
          }} 
        />
        
        <button 
          onClick={togglePlay} 
          style={{ 
            marginLeft: 'auto', 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            background: isPlaying ? 'var(--accent)' : 'var(--bg-secondary)', 
            color: isPlaying ? '#000' : 'var(--accent)', 
            border: `2px solid var(--accent)`, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '16px',
            transition: '0.2s',
            boxShadow: isPlaying ? '0 0 12px var(--accent)' : 'none'
          }}
        >
          {isPlaying ? '■' : '▶'}
        </button>
      </div>

      {/* 2. Блок Цифрового Тюнера */}
      <div style={{ background: 'var(--bg-root)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>CHROMATIC TUNER</span>
          <button 
            onClick={isTunerActive ? stopTuner : startTuner}
            style={{
              background: isTunerActive ? 'var(--accent)' : 'transparent',
              color: isTunerActive ? '#000' : 'var(--text-muted)',
              border: `1px solid ${isTunerActive ? 'var(--accent)' : 'var(--border-color)'}`,
              padding: '4px 12px', borderRadius: '12px', fontSize: '9px', fontWeight: 900, cursor: 'pointer', transition: '0.2s',
              boxShadow: isTunerActive ? '0 0 8px rgba(0,255,157,0.4)' : 'none'
            }}
          >
            {isTunerActive ? 'ON' : 'OFF'}
          </button>
        </div>

        {isTunerActive ? (
          <div style={{ textAlign: 'center', position: 'relative', padding: '8px 0' }}>
            <div style={{ fontSize: '42px', fontWeight: 900, color: isPerfectPitch ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1, textShadow: isPerfectPitch ? '0 0 16px var(--accent)' : 'none', transition: 'color 0.1s' }}>
              {tunerNote || '-'}
            </div>
            
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', height: '12px' }}>
              {tunerNote ? (cents > 0 ? `+${cents} cents` : `${cents} cents`) : 'Listening...'}
            </div>
            
            {/* Шкала отклонения тюнера (Gauge) */}
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', marginTop: '16px', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', background: 'var(--text-muted)', left: '50%', transform: 'translateX(-50%)', zIndex: 1 }} />
              
              {/* Бегающая игла */}
              {tunerNote && (
                <div style={{ 
                  position: 'absolute', top: 0, bottom: 0, width: '8px', borderRadius: '4px',
                  background: needleColor,
                  left: `calc(50% + ${cents}%)`, transform: 'translateX(-50%)', 
                  transition: 'left 0.1s linear, background 0.1s', zIndex: 2,
                  boxShadow: `0 0 8px ${needleColor}`
                }} />
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '24px 0', opacity: 0.5 }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎙️</span>
            Click ON to tune your guitar
          </div>
        )}

      </div>

    </div>
  );
};

export default ToolBox;
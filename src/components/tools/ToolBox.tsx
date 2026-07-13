// src/components/tools/ToolBox.tsx

import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';
import { useTuner } from '../../hooks/useTuner';

const ToolBox: React.FC = () => {
  const { 
    bpm, setBpm, isPlaying, togglePlay, 
    timeSignature, setTimeSignature 
  } = useMusic();
  useMetronome(bpm, timeSignature);
  
  const { 
    isActive: isTunerActive, 
    startTuner, 
    stopTuner, 
    note: tunerNote, 
    cents, 
    frequency
  } = useTuner();

  const getTunerColor = () => {
    if (!isTunerActive) return 'var(--text-muted)';
    const absCents = Math.abs(cents);
    if (absCents < 3) return 'var(--accent)';
    if (absCents < 10) return '#ffb800';
    if (absCents < 20) return '#ff8800';
    return '#ff3333';
  };

  const isInTune = isTunerActive && Math.abs(cents) < 3 && tunerNote !== '-' && tunerNote !== '...';
  const tunerColor = getTunerColor();

  // 🔥 ДОСТУПНЫЕ РАЗМЕРЫ
  const TIME_SIGNATURES = [
    { beats: 4, noteValue: 4, label: '4/4' },
    { beats: 3, noteValue: 4, label: '3/4' },
    { beats: 2, noteValue: 4, label: '2/4' },
    { beats: 6, noteValue: 8, label: '6/8' },
    { beats: 5, noteValue: 4, label: '5/4' },
    { beats: 7, noteValue: 4, label: '7/4' },
    { beats: 12, noteValue: 8, label: '12/8' },
  ];

  //const currentSigLabel = TIME_SIGNATURES.find(
    //s => s.beats === timeSignature.beats && s.noteValue === timeSignature.noteValue
  //)?.label || `${timeSignature.beats}/${timeSignature.noteValue}`;

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      borderRadius: 'var(--radius)', 
      border: '1px solid var(--border-color)', 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px',
      flexShrink: 0,
      minWidth: '200px'
    }}>
      
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
        🎛️ Control Center
      </div>

      {/* ===== МЕТРОНОМ С РАЗМЕРОМ ===== */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        background: 'var(--bg-root)', 
        padding: '10px 14px', 
        borderRadius: '10px', 
        border: '1px solid var(--border-color)' 
      }}>
        {/* Верхняя строка: BPM + Play */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>TEMPO</span>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 900 }}>BPM</span>
          </div>
          
          <input 
            type="number" 
            value={bpm} 
            onChange={(e) => setBpm(Number(e.target.value))} 
            style={{ 
              width: '60px', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '6px',
              color: 'var(--text-primary)', 
              fontWeight: 900, 
              fontSize: '16px', 
              outline: 'none', 
              textAlign: 'center',
              padding: '4px 0'
            }} 
          />
          
          <button 
            onClick={togglePlay} 
            style={{ 
              marginLeft: 'auto', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: isPlaying ? 'var(--accent)' : 'var(--bg-secondary)', 
              color: isPlaying ? '#000' : 'var(--accent)', 
              border: `2px solid var(--accent)`, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '14px',
              transition: '0.2s',
              boxShadow: isPlaying ? '0 0 12px var(--accent)' : 'none'
            }}
          >
            {isPlaying ? '■' : '▶'}
          </button>
        </div>

        {/* 🔥 НИЖНЯЯ СТРОКА: ВЫБОР РАЗМЕРА */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
            TIME
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {TIME_SIGNATURES.map(sig => (
              <button
                key={sig.label}
                onClick={() => setTimeSignature({ beats: sig.beats, noteValue: sig.noteValue })}
                style={{
                  background: timeSignature.beats === sig.beats && timeSignature.noteValue === sig.noteValue 
                    ? 'var(--accent)' 
                    : 'var(--bg-secondary)',
                  color: timeSignature.beats === sig.beats && timeSignature.noteValue === sig.noteValue 
                    ? '#000' 
                    : 'var(--text-muted)',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.2s',
                  fontFamily: 'monospace'
                }}
                onMouseEnter={e => {
                  if (!(timeSignature.beats === sig.beats && timeSignature.noteValue === sig.noteValue)) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!(timeSignature.beats === sig.beats && timeSignature.noteValue === sig.noteValue)) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {sig.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== ТЮНЕР ===== */}
      <div style={{ 
        background: 'var(--bg-root)', 
        padding: '14px', 
        borderRadius: '10px', 
        border: `1px solid ${isTunerActive ? 'var(--accent)' : 'var(--border-color)'}`,
        boxShadow: isTunerActive ? '0 0 20px rgba(0,255,157,0.05)' : 'none',
        transition: 'all 0.3s'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🎙️</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>TUNER</span>
            {isTunerActive && (
              <span style={{ 
                fontSize: '8px', 
                color: 'var(--accent)',
                fontWeight: 700,
                background: 'rgba(0,255,157,0.1)',
                padding: '2px 8px',
                borderRadius: '8px'
              }}>
                🎵 ACTIVE
              </span>
            )}
          </div>
          
          <button 
            onClick={isTunerActive ? stopTuner : startTuner}
            style={{
              background: isTunerActive ? 'var(--accent)' : 'transparent',
              color: isTunerActive ? '#000' : 'var(--text-muted)',
              border: `1px solid ${isTunerActive ? 'var(--accent)' : 'var(--border-color)'}`,
              padding: '2px 14px', 
              borderRadius: '12px', 
              fontSize: '9px', 
              fontWeight: 900, 
              cursor: 'pointer', 
              transition: '0.2s',
              boxShadow: isTunerActive ? '0 0 12px rgba(0,255,157,0.3)' : 'none'
            }}
          >
            {isTunerActive ? 'ON' : 'OFF'}
          </button>
        </div>

        {isTunerActive ? (
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ 
              fontSize: '40px', 
              fontWeight: 900, 
              color: tunerColor, 
              lineHeight: 1, 
              textShadow: isInTune ? `0 0 30px ${tunerColor}` : 'none',
              transition: 'color 0.1s, text-shadow 0.3s',
              letterSpacing: '2px',
              fontFamily: 'monospace'
            }}>
              {tunerNote || '-'}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {frequency > 0 ? `${frequency} Hz` : '—'}
              </span>
              <span style={{ 
                fontSize: '11px', 
                color: isInTune ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: 700
              }}>
                {isInTune ? '✓ IN TUNE' : (tunerNote !== '-' && tunerNote !== '...' ? `${cents > 0 ? '♯' : '♭'} ${Math.abs(cents)}¢` : '—')}
              </span>
            </div>

            <div style={{ 
              width: '100%', 
              height: '28px', 
              background: 'var(--bg-secondary)', 
              marginTop: '10px', 
              borderRadius: '4px', 
              position: 'relative', 
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                bottom: 0, 
                width: '2px', 
                background: 'var(--text-muted)', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 2,
                opacity: 0.3
              }} />
              
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '10%',
                right: '10%',
                background: `linear-gradient(to right, #ff3333, #ff8800, #ffb800, var(--accent), var(--accent), #ffb800, #ff8800, #ff3333)`,
                opacity: 0.12,
                borderRadius: '4px'
              }} />

              {tunerNote && tunerNote !== '-' && tunerNote !== '...' && (
                <div style={{ 
                  position: 'absolute', 
                  top: '2px', 
                  bottom: '2px',
                  width: '4px', 
                  borderRadius: '2px',
                  background: tunerColor,
                  left: `calc(50% + ${Math.max(-80, Math.min(80, cents))}%)`, 
                  transform: 'translateX(-50%)', 
                  transition: 'left 0.05s linear, background 0.1s',
                  zIndex: 3,
                  boxShadow: `0 0 12px ${tunerColor}`
                }} />
              )}

              {isInTune && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '9px',
                  fontWeight: 900,
                  color: 'var(--accent)',
                  letterSpacing: '1px',
                  textShadow: '0 0 20px var(--accent)',
                  zIndex: 4,
                  background: 'var(--bg-secondary)',
                  padding: '0 12px',
                  borderRadius: '2px'
                }}>
                  ✓ TUNE
                </div>
              )}
            </div>

            <div style={{ 
              width: '100%', 
              height: '3px', 
              background: 'var(--bg-secondary)', 
              marginTop: '6px', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '50%',
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 0.1s',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '20px 0', opacity: 0.5 }}>
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🎙️</span>
            Click <strong style={{ color: 'var(--accent)' }}>ON</strong> to tune your guitar
          </div>
        )}
      </div>

    </div>
  );
};

export default ToolBox;
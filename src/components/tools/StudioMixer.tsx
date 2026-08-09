import { useState, useEffect, useCallback, useRef } from 'react';
import type React from 'react';
import { audioManager } from '../../services/AudioManager';
import { useTranslation } from '../../context/LocaleContext';

// ============================================
// 🎛️ ТИПЫ
// ============================================

interface ChannelState {
  volume: number;   // dB
  mute: boolean;
  solo: boolean;
}

interface EQState {
  low: number;    // -12 to +12 dB
  mid: number;
  high: number;
}

// ============================================
// 🎛️ КОМПОНЕНТ МИКШЕРА (560px ширина)
// ============================================

const CHANNEL_CONFIG: { key: string; label: string; color: string; defaultDb: number }[] = [
  { key: 'chords',  label: 'CHORDS',  color: '#00bcd4', defaultDb: -6 },
  { key: 'guitar',  label: 'GUITAR',  color: '#00FF9D', defaultDb: 6 },
  { key: 'bass',    label: 'BASS',    color: '#ff9800', defaultDb: 0 },
  { key: 'drums',   label: 'DRUMS',   color: '#e94560', defaultDb: 0 },
  { key: 'master',  label: 'MASTER',  color: '#ffffff', defaultDb: 0 },
];

const EQ_BANDS: { key: 'low' | 'mid' | 'high'; label: string; freq: string; color: string }[] = [
  { key: 'low',  label: 'LOW',  freq: '200Hz',  color: '#ff6b6b' },
  { key: 'mid',  label: 'MID',  freq: '1kHz',  color: '#ffd93d' },
  { key: 'high', label: 'HIGH', freq: '8kHz',  color: '#6bcb77' },
];

const DEFAULT_CHANNELS: Record<string, ChannelState> = {
  chords: { volume: -6, mute: false, solo: false },
  guitar: { volume: 6, mute: false, solo: false },
  bass: { volume: 0, mute: false, solo: false },
  drums: { volume: 0, mute: false, solo: false },
  master: { volume: 0, mute: false, solo: false },
};

const DEFAULT_EQ: EQState = { low: 0, mid: 0, high: 0 };

const StudioMixer: React.FC = () => {
  const { t } = useTranslation();
  const [channels, setChannels] = useState<Record<string, ChannelState>>(DEFAULT_CHANNELS);
  const [eq, setEq] = useState<EQState>(DEFAULT_EQ);

  useEffect(() => {
    // Инициализируем AudioManager при монтировании
    audioManager.init().catch(console.warn);
  }, []);

  // Синхронизация каналов с AudioManager
  useEffect(() => {
    Object.entries(channels).forEach(([key, state]) => {
      try {
        audioManager.setVolume(key as any, state.volume);
        audioManager.setMute(key as any, state.mute);
      } catch (err) {
        console.warn(`🎚️ Channel ${key} error:`, err);
      }
    });
  }, [channels]);

  // Синхронизация EQ с AudioManager
  useEffect(() => {
    try {
      audioManager.setEQ('low', eq.low);
      audioManager.setEQ('mid', eq.mid);
      audioManager.setEQ('high', eq.high);
    } catch (err) {
      console.warn('🎚️ EQ sync error:', err);
    }
  }, [eq]);

  const handleVolumeChange = useCallback((channel: string, db: number) => {
    setChannels(prev => ({
      ...prev,
      [channel]: { ...prev[channel], volume: db }
    }));
  }, []);

  const handleMuteToggle = useCallback((channel: string) => {
    setChannels(prev => ({
      ...prev,
      [channel]: { ...prev[channel], mute: !prev[channel].mute }
    }));
  }, []);

  // Сохраняем mute-состояния до включения соло (для восстановления после выключения)
  const savedMuteBeforeSolo = useRef<Record<string, boolean> | null>(null);

  const handleSoloToggle = useCallback((channel: string) => {
    if (channel === 'master') return; // мастер не солируется

    setChannels(prev => {
      const newChannels = { ...prev };
      const isCurrentlySolo = prev[channel].solo;

      if (isCurrentlySolo) {
        // 🔴 Выключаем соло — восстанавливаем mute из бэкапа
        Object.keys(newChannels).forEach(key => {
          newChannels[key] = {
            ...newChannels[key],
            solo: false,
            mute: savedMuteBeforeSolo.current?.[key] ?? prev[key].mute,
          };
        });
        savedMuteBeforeSolo.current = null;
      } else {
        // 🟢 Включаем соло — сохраняем текущие mute, глушим всё, кроме соло-канала
        const backup: Record<string, boolean> = {};
        Object.keys(newChannels).forEach(key => {
          backup[key] = prev[key].mute;
          newChannels[key] = {
            ...newChannels[key],
            solo: key === channel,
            mute: key !== channel && key !== 'master', // глушим всё, кроме мастера и соло
          };
        });
        savedMuteBeforeSolo.current = backup;
      }

      return newChannels;
    });
  }, []);

  const handleEQChange = useCallback((band: 'low' | 'mid' | 'high', value: number) => {
    setEq(prev => ({ ...prev, [band]: value }));
  }, []);

  const getVuHeight = (db: number): number => {
    const normalized = Math.max(0, Math.min(1, (db + 60) / 72));
    return normalized * 100;
  };

  // 🎚️ Преобразование позиции клика (в %) в dB
  const getDbFromClick = (clientY: number, rect: DOMRect): number => {
    const relY = rect.bottom - clientY; // 0 = bottom, height = top
    const percent = Math.max(0, Math.min(1, relY / rect.height));
    return Math.round((percent * 72 - 60) * 2) / 2; // -60 to +12 dB, шаг 0.5
  };

  // 🖱️ Обработчик клика/перетаскивания по VU-метру
  const handleVuMouseDown = useCallback((channel: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const db = getDbFromClick(e.clientY, rect);
    handleVolumeChange(channel, db);

    const handleMouseMove = (ev: MouseEvent) => {
      const db2 = getDbFromClick(ev.clientY, rect);
      handleVolumeChange(channel, db2);
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleVolumeChange]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 'none',
      margin: '0 auto',
      background: '#0d0e14',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      
      {/* ===== HEADER ===== */}
      <div style={{
        padding: '10px 16px',
        background: 'linear-gradient(180deg, #151620 0%, #0d0e14 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
{t.studioMixer.title}
        </span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>
          {t.studioMixer.master}
        </span>
      </div>

      {/* ===== CHANNEL STRIPS ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'stretch',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '12px 12px 8px',
        overflowX: 'auto',
      }}>
        {CHANNEL_CONFIG.map(ch => {
          const state = channels[ch.key] || { volume: ch.defaultDb, mute: false, solo: false };
          const vuPercent = getVuHeight(state.volume);
          
          return (
            <div key={ch.key} style={{
              flex: '1 1 0',
              minWidth: '72px',
              maxWidth: 'none',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '8px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              opacity: state.mute ? 0.4 : 1,
            }}>
              
              {/* VU Meter — выше (150px), кликабельный регулятор громкости */}
              <div
                style={{
                  width: '100%',
                  height: '150px',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }}
                onMouseDown={(e) => handleVuMouseDown(ch.key, e)}
title={`${t.studioMixer.volumeTitle}: ${state.volume} dB`}
              >
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: `${vuPercent}%`,
                  background: `linear-gradient(0deg, ${ch.color}44, ${ch.color})`,
                  transition: 'height 0.15s ease',
                  borderRadius: '2px',
                }} />
                {/* dB label inside VU */}
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'monospace',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  pointerEvents: 'none',
                }}>
                  {state.volume > 0 ? `+${state.volume}` : state.volume}
                </div>
                {state.volume > 6 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: '#ff4444',
                    animation: 'pulse 0.5s infinite',
                  }} />
                )}
              </div>

              {/* Label — крупнее */}
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                color: state.mute ? 'rgba(255,255,255,0.2)' : ch.color,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}>
{ch.key === 'master' ? t.studioMixer.mstr : ch.key.toUpperCase()}
              </span>

              {/* M / S buttons — крупнее */}
              <div style={{ display: 'flex', gap: '3px', width: '100%' }}>
                <button
                  onClick={() => handleMuteToggle(ch.key)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    fontSize: '9px',
                    fontWeight: 900,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: state.mute ? ch.color : 'rgba(255,255,255,0.06)',
                    color: state.mute ? '#000' : 'rgba(255,255,255,0.3)',
                    transition: '0.15s',
                    letterSpacing: '0.5px',
                  }}
                >
                  M
                </button>
                <button
                  onClick={() => handleSoloToggle(ch.key)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    fontSize: '9px',
                    fontWeight: 900,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: state.solo ? '#ffd93d' : 'rgba(255,255,255,0.06)',
                    color: state.solo ? '#000' : 'rgba(255,255,255,0.3)',
                    transition: '0.15s',
                    letterSpacing: '0.5px',
                  }}
                >
                  S
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== EQ SECTION ===== */}
      <div style={{
        margin: '4px 12px 12px',
        background: 'rgba(255,255,255,0.015)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.04)',
        padding: '10px 12px',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '10px',
          textAlign: 'center',
        }}>
{t.studioMixer.equalizer}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {EQ_BANDS.map(band => (
            <div key={band.key} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              flex: 1,
            }}>
              {/* Knob circle — больше */}
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: `rgba(255,255,255,0.05)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                border: `2px solid ${band.color}${(eq[band.key] !== 0) ? '88' : '22'}`,
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#1a1b24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: '3px',
                    height: '14px',
                    background: band.color,
                    borderRadius: '2px',
                    transform: `rotate(${(eq[band.key] / 12) * 45}deg)`,
                    transition: 'transform 0.1s',
                  }} />
                </div>
              </div>

              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={eq[band.key]}
                onChange={(e) => handleEQChange(band.key, Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '3px',
                  accentColor: band.color,
                  cursor: 'pointer',
                }}
                title={`${band.label}: ${eq[band.key]} dB`}
              />

              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.5px',
              }}>
                {band.label}
              </span>

              <span style={{
                fontSize: '8px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.15)',
                fontFamily: 'monospace',
              }}>
                {band.freq}
              </span>

              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: eq[band.key] !== 0 ? band.color : 'rgba(255,255,255,0.2)',
                fontFamily: 'monospace',
              }}>
                {eq[band.key] > 0 ? `+${eq[band.key]}` : eq[band.key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default StudioMixer;
export type { ChannelState, EQState };


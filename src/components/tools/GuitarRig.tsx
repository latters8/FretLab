/**
 * 🎛️ GuitarRigboard — виртуальный гитарный процессор (на базе AudioWorklet)
 * 
 * Полноценный DSP-процессор с цепочкой эффектов:
 * NoiseGate → TubeDrive → AmpEQ → Cabinet → CompHQ → DelayHQ → ReverbHQ
 * 
 * Особенности:
 * - 8 заводских пресетов (Crystal Clean, Blues Breaker, Classic Rock, Metal Machine, Djent Core, Shimmer Wash, Post-Rock Space)
 * - Визуальные "педали" с переключением
 * - Регулировка каждого параметра в реальном времени
 * - Реальный FFT-анализатор
 * - GR-метр компрессора
 * - Bypass каждого эффекта
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGuitarRig } from '../../hooks/useGuitarRig';
import { FACTORY_PRESETS } from '../../audio/presets';
import type { RigParams, ParamKey, PresetCategory } from '../../types/rig';

// ============================================
// 🎛️ ТИПЫ
// ============================================

type EffectKey = 
  | 'gate'
  | 'drive'
  | 'eq'
  | 'cabinet'
  | 'compressor'
  | 'delay'
  | 'reverb'
  | 'master';

// ============================================
// 🎛️ КОНФИГУРАЦИЯ ЭФФЕКТОВ
// ============================================

const EFFECT_CONFIGS: Record<EffectKey, { label: string; icon: string; color: string }> = {
  gate:       { label: 'Noise Gate',    icon: '🚪', color: '#64748b' },
  drive:      { label: 'Tube Drive',    icon: '⚡', color: '#f97316' },
  eq:         { label: 'Amp EQ',        icon: '🎚️', color: '#a855f7' },
  cabinet:    { label: 'Cabinet',       icon: '📦', color: '#84cc16' },
  compressor: { label: 'Comp HQ',       icon: '📊', color: '#06b6d4' },
  delay:      { label: 'Delay HQ',      icon: '⏳', color: '#ec4899' },
  reverb:     { label: 'Reverb HQ',     icon: '🏔️', color: '#6366f1' },
  master:     { label: 'Master',        icon: '🔊', color: '#f43f5e' },
};

// ============================================
// 🎛️ КОМПОНЕНТ — GUITAR RIG
// ============================================

const GuitarRig: React.FC = () => {
  const {
    isReady,
    isPlaying,
    toggle,
    params,
    updateParam,
    loadPreset,
    getFFT,
    getWaveform,
    getReduction,
  } = useGuitarRig();

  const [currentPresetName, setCurrentPresetName] = useState<string>('Crystal Clean');
  const [selectedEffect, setSelectedEffect] = useState<EffectKey | null>(null);
  const [visualMode, setVisualMode] = useState<'fft' | 'waveform'>('fft');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Загрузка пресета
  const handlePresetChange = useCallback((presetName: string) => {
    loadPreset(presetName);
    setCurrentPresetName(presetName);
  }, [loadPreset]);

  // Визуализация FFT/Waveform
  useEffect(() => {
    if (!isReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const data = visualMode === 'fft' ? getFFT() : getWaveform();
      const w = canvas.width;
      const h = canvas.height;
      const len = data.length;

      if (visualMode === 'fft') {
        // FFT spectrum
        const barCount = Math.min(len, Math.floor(w / 3));
        const step = Math.floor(len / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = data[i * step] || 0;
          // Normalize -100..0 dB → 0..1
          const normalized = Math.max(0, Math.min(1, (val + 100) / 100));
          const barH = normalized * h;
          const x = i * (w / barCount);
          const barW = Math.max(2, w / barCount - 1);

          const isClipping = normalized > 0.9;
          const gradient = ctx.createLinearGradient(0, h, 0, h - barH);
          gradient.addColorStop(0, isClipping ? '#ff4444' : '#00FF9D');
          gradient.addColorStop(1, isClipping ? '#ff8800' : 'rgba(0,255,157,0.2)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, h - barH, barW, barH);
        }
      } else {
        // Waveform
        ctx.beginPath();
        ctx.strokeStyle = '#00FF9D';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,255,157,0.3)';

        for (let i = 0; i < len; i++) {
          const x = (i / len) * w;
          const y = h / 2 + (data[i] || 0) * (h / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
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
  }, [isReady, visualMode, getFFT, getWaveform]);

  // ============================================
  // 🎛️ РЕНДЕР ПАРАМЕТРОВ ЭФФЕКТА
  // ============================================

  const renderKnob = (
    label: string,
    paramKey: ParamKey,
    min: number,
    max: number,
    step: number,
    unit: string,
    color: string,
    disabled = false,
  ) => (
    <div style={paramItemStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <label style={paramLabelStyle}>{label}</label>
        <span style={{
          fontSize: '11px',
          fontWeight: 800,
          fontFamily: 'monospace',
          color: disabled ? 'rgba(255,255,255,0.15)' : color,
        }}>
          {typeof params[paramKey] === 'number'
            ? (params[paramKey] as number > 0 && label !== 'Threshold' && label !== 'Range' ? '+' : '') + Number(params[paramKey]).toFixed(step < 1 ? 2 : 0) + unit
            : String(params[paramKey])}
        </span>
      </div>
      {typeof params[paramKey] === 'number' ? (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={params[paramKey] as number}
          onChange={e => updateParam(paramKey, Number(e.target.value) as any)}
          disabled={disabled}
          style={{
            width: '100%',
            height: '4px',
            accentColor: color,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.3 : 1,
            background: `linear-gradient(to right, ${color}44 0%, ${color} ${((Number(params[paramKey]) - min) / (max - min)) * 100}%, rgba(255,255,255,0.05) ${((Number(params[paramKey]) - min) / (max - min)) * 100}%)`,
          }}
        />
      ) : null}
    </div>
  );

  const renderToggle = (
    label: string,
    paramKey: ParamKey,
    color: string,
  ) => (
    <div style={paramItemStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <label style={paramLabelStyle}>{label}</label>
        <button
          onClick={() => updateParam(paramKey, !params[paramKey] as any)}
          style={{
            padding: '4px 14px',
            borderRadius: '8px',
            border: 'none',
            background: params[paramKey] ? color : 'rgba(255,255,255,0.06)',
            color: params[paramKey] ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: '10px',
            fontWeight: 900,
            cursor: 'pointer',
            transition: '0.1s',
            letterSpacing: '0.5px',
          }}
        >
          {params[paramKey] ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );

  const renderEffectParams = () => {
    if (!selectedEffect) return null;

    switch (selectedEffect) {
      case 'gate':
        return (
          <div style={paramGridStyle}>
            {renderKnob('Threshold', 'gateThreshold', -70, -20, 1, 'dB', '#64748b')}
            {renderKnob('Attack', 'gateAttack', 0.001, 0.1, 0.001, 's', '#64748b')}
            {renderKnob('Release', 'gateRelease', 0.01, 0.5, 0.01, 's', '#64748b')}
          </div>
        );

      case 'drive':
        return (
          <div style={paramGridStyle}>
            {renderKnob('Drive', 'drive', 0, 1, 0.01, '', '#f97316')}
            {renderKnob('Tube', 'tubeAmount', 0, 1, 0.01, '', '#f97316')}
          </div>
        );

      case 'eq':
        return (
          <div style={paramGridStyle}>
            {renderKnob('Bass', 'bass', -12, 12, 0.5, 'dB', '#a855f7')}
            {renderKnob('Mid', 'mid', -12, 12, 0.5, 'dB', '#a855f7')}
            {renderKnob('Treble', 'treble', -12, 12, 0.5, 'dB', '#a855f7')}
            {renderKnob('Presence', 'presence', -6, 6, 0.5, 'dB', '#a855f7')}
          </div>
        );

      case 'cabinet':
        return (
          <div style={paramGridStyle}>
            {renderToggle('Cabinet Enabled', 'cabEnabled', '#84cc16')}
            <div style={paramItemStyle}>
              <label style={paramLabelStyle}>IR File</label>
              <div style={{ fontSize: '11px', color: '#84cc16', fontFamily: 'monospace', marginTop: '4px' }}>
                {params.cabIR.split('/').pop()}
              </div>
            </div>
          </div>
        );

      case 'compressor':
        return (
          <div style={paramGridStyle}>
            {renderToggle('Comp Enabled', 'compEnabled', '#06b6d4')}
            {renderKnob('Threshold', 'compThreshold', -60, 0, 1, 'dB', '#06b6d4', !params.compEnabled)}
            {renderKnob('Ratio', 'compRatio', 1, 20, 0.5, ':1', '#06b6d4', !params.compEnabled)}
            {renderKnob('Attack', 'compAttack', 0.1, 100, 0.1, 'ms', '#06b6d4', !params.compEnabled)}
            {renderKnob('Release', 'compRelease', 10, 1000, 10, 'ms', '#06b6d4', !params.compEnabled)}
            {renderKnob('Knee', 'compKnee', 0, 30, 1, 'dB', '#06b6d4', !params.compEnabled)}
            {renderKnob('Makeup', 'compMakeup', 0, 24, 0.5, 'dB', '#06b6d4', !params.compEnabled)}
            {renderKnob('Mix', 'compMix', 0, 1, 0.01, '', '#06b6d4', !params.compEnabled)}
            {renderKnob('Saturation', 'compSaturation', 0, 1, 0.01, '', '#06b6d4', !params.compEnabled)}
          </div>
        );

      case 'delay':
        return (
          <div style={paramGridStyle}>
            {renderToggle('Delay Enabled', 'delayEnabled', '#ec4899')}
            {renderKnob('Time', 'delayTime', 20, 3000, 10, 'ms', '#ec4899', !params.delayEnabled)}
            {renderKnob('Feedback', 'delayFeedback', 0, 100, 1, '%', '#ec4899', !params.delayEnabled)}
            {renderKnob('Mix', 'delayMix', 0, 100, 1, '%', '#ec4899', !params.delayEnabled)}
            {renderKnob('Mod Depth', 'delayModDepth', 0, 15, 0.1, 'ms', '#ec4899', !params.delayEnabled)}
            {renderKnob('Mod Rate', 'delayModRate', 0, 8, 0.1, 'Hz', '#ec4899', !params.delayEnabled)}
            {renderKnob('Sat.', 'delaySaturation', 0, 1, 0.01, '', '#ec4899', !params.delayEnabled)}
            {renderKnob('Diffusion', 'delayDiffusion', 0, 1, 0.01, '', '#ec4899', !params.delayEnabled)}
          </div>
        );

      case 'reverb':
        return (
          <div style={paramGridStyle}>
            {renderToggle('Reverb Enabled', 'reverbEnabled', '#6366f1')}
            {renderKnob('Decay', 'reverbDecay', 0.1, 20, 0.1, 's', '#6366f1', !params.reverbEnabled)}
            {renderKnob('Pre-Delay', 'reverbPreDelay', 0, 200, 1, 'ms', '#6366f1', !params.reverbEnabled)}
            {renderKnob('Damping', 'reverbDamping', 0, 1, 0.01, '', '#6366f1', !params.reverbEnabled)}
            {renderKnob('Mix', 'reverbMix', 0, 100, 1, '%', '#6366f1', !params.reverbEnabled)}
            {renderKnob('Room Size', 'reverbRoomSize', 0.5, 2, 0.1, '', '#6366f1', !params.reverbEnabled)}
            {renderKnob('Shimmer', 'reverbShimmer', 0, 1, 0.01, '', '#6366f1', !params.reverbEnabled)}
          </div>
        );

      case 'master':
        return (
          <div style={paramGridStyle}>
            {renderKnob('Volume', 'masterVolume', 0, 2, 0.01, '', '#f43f5e')}
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================
  // 🎛️ GR METER
  // ============================================

  const reduction = getReduction();

  // ============================================
  // 🎛️ ОСНОВНОЙ РЕНДЕР
  // ============================================

  if (!isReady) {
    return (
      <div style={{
        width: '100%',
        padding: '40px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '13px',
        fontWeight: 700,
        background: '#0d0e14',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        ⏳ Инициализация AudioWorklet…
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      background: '#0d0e14',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      
      {/* ===== HEADER ===== */}
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(180deg, #151620 0%, #0d0e14 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🎸</span>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.5px' }}>
              Guitar Rig
            </span>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
              AudioWorklet: Gate → Drive → EQ → Cab → Comp → Delay → Reverb
            </div>
          </div>
        </div>
        
        {/* Панель управления */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Кнопка переключения визуализации */}
          <button
            onClick={() => setVisualMode(v => v === 'fft' ? 'waveform' : 'fft')}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {visualMode === 'fft' ? 'FFT' : 'WAVE'}
          </button>

          {/* Кнопка PLAY/STOP */}
          <button
            onClick={toggle}
            style={{
              padding: '6px 18px',
              borderRadius: '8px',
              border: 'none',
              background: isPlaying ? '#ef4444' : '#22c55e',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {isPlaying ? '⏹ STOP' : '▶ PLAY'}
          </button>

          {/* Индикатор статуса */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '12px',
            background: isReady ? 'rgba(0,255,157,0.1)' : 'rgba(255,68,68,0.1)',
            border: `1px solid ${isReady ? 'rgba(0,255,157,0.2)' : 'rgba(255,68,68,0.2)'}`,
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isReady ? '#00FF9D' : '#ff4444',
              boxShadow: isReady ? '0 0 8px #00FF9D' : 'none',
            }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: isReady ? '#00FF9D' : '#ff4444' }}>
              {isReady ? 'READY' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ===== FFT/WAVEFORM ВИЗУАЛИЗАЦИЯ ===== */}
      <div style={{
        height: '70px',
        background: '#07080b',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '4px 16px',
      }}>
        <canvas ref={canvasRef} width={600} height={62} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* ===== GR METER ===== */}
      <div style={{
        height: '20px',
        background: '#0a0b10',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>
          GR
        </span>
        <div style={{
          flex: 1,
          height: '6px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              width: `${Math.min(100, Math.abs(reduction) * 5)}%`,
              height: '100%',
              background: '#f59e0b',
              transition: 'width 0.05s linear',
              marginLeft: 'auto',
              borderRadius: '3px',
            }}
          />
        </div>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: '#f59e0b',
          fontFamily: 'monospace',
          minWidth: '36px',
          textAlign: 'right',
        }}>
          {reduction.toFixed(1)} dB
        </span>
      </div>

      {/* ===== ПРЕСЕТЫ ===== */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.015)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Presets
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FACTORY_PRESETS.map(preset => {
            const isActive = currentPresetName === preset.name;
            const categoryColors: Record<PresetCategory, string> = {
              clean: '#22c55e',
              crunch: '#f59e0b',
              'high-gain': '#ef4444',
              ambient: '#8b5cf6',
              custom: '#06b6d4',
            };
            const color = categoryColors[preset.category];
            return (
              <button
                key={preset.name}
                onClick={() => handlePresetChange(preset.name)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '16px',
                  border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
                  background: isActive ? `${color}22` : 'rgba(255,255,255,0.03)',
                  color: isActive ? color : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== ПЕДАЛИ ЭФФЕКТОВ ===== */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '14px 16px',
        overflowX: 'auto',
        borderBottom: selectedEffect ? '1px solid rgba(255,255,255,0.04)' : 'none',
      }}>
        {(Object.keys(EFFECT_CONFIGS) as EffectKey[]).map(effectKey => {
          const config = EFFECT_CONFIGS[effectKey];
          const isSelected = selectedEffect === effectKey;

          // Определяем активность эффекта
          let isActive = true;
          switch (effectKey) {
            case 'cabinet': isActive = params.cabEnabled; break;
            case 'compressor': isActive = params.compEnabled; break;
            case 'delay': isActive = params.delayEnabled; break;
            case 'reverb': isActive = params.reverbEnabled; break;
            default: isActive = true;
          }

          return (
            <div
              key={effectKey}
              onClick={() => setSelectedEffect(isSelected ? null : effectKey)}
              style={{
                flex: '1 0 auto',
                minWidth: '90px',
                maxWidth: '110px',
                padding: '12px 8px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.3)',
                border: `2px solid ${
                  isSelected ? config.color :
                  isActive ? `${config.color}44` :
                  'rgba(255,255,255,0.05)'
                }`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: isActive ? 1 : 0.4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
              }}
            >
              {/* LED индикатор */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isActive ? config.color : 'rgba(255,255,255,0.1)',
                boxShadow: isActive ? `0 0 12px ${config.color}` : 'none',
                transition: 'all 0.2s',
              }} />
              
              {/* Иконка */}
              <span style={{ fontSize: '22px' }}>{config.icon}</span>
              
              {/* Название */}
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                color: isActive ? config.color : 'rgba(255,255,255,0.2)',
                textAlign: 'center',
                lineHeight: 1.2,
                letterSpacing: '0.3px',
              }}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ===== ПАРАМЕТРЫ ВЫБРАННОГО ЭФФЕКТА ===== */}
      {selectedEffect && (
        <div style={{
          padding: '14px 20px',
          background: 'rgba(0,0,0,0.2)',
          borderTop: `1px solid ${EFFECT_CONFIGS[selectedEffect].color}22`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '14px' }}>{EFFECT_CONFIGS[selectedEffect].icon}</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 800,
              color: EFFECT_CONFIGS[selectedEffect].color,
            }}>
              {EFFECT_CONFIGS[selectedEffect].label} Parameters
            </span>
          </div>
          {renderEffectParams()}
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '9px',
        color: 'rgba(255,255,255,0.15)',
      }}>
        <span>Chain: Input → Noise Gate → Tube Drive → Amp EQ → Cabinet → Compressor → Delay → Reverb → Master → Output</span>
        <span>FretLab AudioWorklet v2.0</span>
      </div>
    </div>
  );
};

// ============================================
// 🎛️ СТИЛИ
// ============================================

const paramGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '10px',
};

const paramItemStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.04)',
};

const paramLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

export default GuitarRig;


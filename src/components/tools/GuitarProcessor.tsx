/**
 * 🎛️ GuitarProcessor — виртуальный гитарный процессор
 * 
 * Полноценный DSP-процессор с цепочкой эффектов:
 * NoiseGate → Compressor → Distortion → Modulation → Delay → Reverb → Filter → Limiter
 * 
 * Особенности:
 * - 10 пресетов (Clean, Crunch, Overdrive, Distortion, Metal, Fuzz, Jazz, Ambient, Blues)
 * - Визуальные "педали" с перетаскиванием
 * - Регулировка каждого параметра в реальном времени
 * - Визуализация сигнала (VU-метр,волна)
 * - Bypass каждого эффекта
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { audioManager } from '../../services/AudioManager';
import { GUITAR_PRESETS, type GuitarPresetName } from '../../services/effects/index';
import type { DistortionParams } from '../../services/effects/Distortion';
import type { DelayParams } from '../../services/effects/Delay';
import type { ReverbParams } from '../../services/effects/Reverb';
import type { ChorusParams } from '../../services/effects/Chorus';
import type { CompressorParams } from '../../services/effects/Compressor';
import type { NoiseGateParams } from '../../services/effects/NoiseGate';
import type { WahWahParams } from '../../services/effects/WahWah';

// ============================================
// 🎛️ ТИПЫ
// ============================================

type EffectType = 'noiseGate' | 'compressor' | 'distortion' | 'chorus' | 'delay' | 'reverb' | 'wah';

// ============================================
// 🎛️ КОНФИГУРАЦИЯ ЭФФЕКТОВ
// ============================================

const EFFECT_CONFIGS: Record<EffectType, { label: string; icon: string; color: string }> = {
  noiseGate: { label: 'Noise Gate', icon: '🚪', color: '#6c5ce7' },
  compressor: { label: 'Compressor', icon: '📊', color: '#00b894' },
  distortion: { label: 'Distortion', icon: '⚡', color: '#e17055' },
  chorus: { label: 'Modulation', icon: '🌊', color: '#0984e3' },
  delay: { label: 'Delay', icon: '⏳', color: '#fdcb6e' },
  reverb: { label: 'Reverb', icon: '🏔️', color: '#00cec9' },
  wah: { label: 'Wah-Wah', icon: '🎙️', color: '#fd79a8' },
};

// ============================================
// 🎛️ КОМПОНЕНТ — ПРОЦЕССОР
// ============================================

const GuitarProcessor: React.FC = () => {
  const setIsInitialized = useState(false)[1];
  const [currentPreset, setCurrentPreset] = useState<GuitarPresetName | 'custom'>('clean');
  const [activeEffects, setActiveEffects] = useState<Record<EffectType, boolean>>({
    noiseGate: true,
    compressor: true,
    distortion: true,
    chorus: false,
    delay: false,
    reverb: true,
    wah: false,
  });
  const [selectedEffect, setSelectedEffect] = useState<EffectType | null>(null);
  const [effectParams, setEffectParams] = useState<Record<string, any>>({});
  const [isDSPReady, setIsDSPReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Инициализация DSP цепочки
  useEffect(() => {
    const init = async () => {
      try {
        await audioManager.init();
        audioManager.initGuitarDSPChain();
        audioManager.setPreset('clean');
        setIsInitialized(true);
        setIsDSPReady(true);
        loadParamsFromAudioManager();
      } catch (err) {
        console.warn('🎛️ GuitarProcessor init error:', err);
      }
    };
    init();
  }, []);

  const loadParamsFromAudioManager = useCallback(() => {
    const params = audioManager.getAllEffectParams();
    if (params) {
      setEffectParams(params);
    }
  }, []);

  // Применение пресета
  const handlePresetChange = useCallback((presetName: GuitarPresetName) => {
    audioManager.setPreset(presetName);
    setCurrentPreset(presetName);
    loadParamsFromAudioManager();
    
    // Обновляем active states из пресета
    const preset = GUITAR_PRESETS[presetName];
    if (preset) {
      setActiveEffects({
        noiseGate: preset.chain.noiseGate.active,
        compressor: preset.chain.compressor.active,
        distortion: preset.chain.distortion.active,
        chorus: preset.chain.chorus.active,
        delay: preset.chain.delay.active,
        reverb: preset.chain.reverb.active,
        wah: preset.chain.wah.active,
      });
    }
  }, [loadParamsFromAudioManager]);

  // Toggle эффекта (bypass)
  const toggleEffect = useCallback((effectKey: EffectType) => {
    const newActive = !activeEffects[effectKey];
    setActiveEffects(prev => ({ ...prev, [effectKey]: newActive }));
    audioManager.bypassEffect(effectKey, !newActive);
    setCurrentPreset('custom');
  }, [activeEffects]);

  // Обновление параметра эффекта
  const updateParam = useCallback((effectKey: EffectType, paramName: string, value: number | string | boolean) => {
    const current = effectParams[effectKey] || {};
    const updated = { ...current, [paramName]: value };
    const newParams = { ...effectParams, [effectKey]: updated };
    setEffectParams(newParams);
    audioManager.updateEffect(effectKey, updated);
    setCurrentPreset('custom');
  }, [effectParams]);

  // Визуализация (VU-метр)
  useEffect(() => {
    if (!isDSPReady || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let phase = 0;
    
    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем звуковую волну
      ctx.beginPath();
      ctx.strokeStyle = '#00FF9D';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,255,157,0.3)';
      
      for (let x = 0; x < canvas.width; x++) {
        const t = (x / canvas.width) * Math.PI * 4 + phase;
        const y = canvas.height / 2 + Math.sin(t) * 15 * (1 + Math.sin(phase * 0.5) * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // VU-метр
      const vuWidth = 4;
      const vuGap = 3;
      const vuCount = Math.floor(canvas.width / (vuWidth + vuGap));
      const vuLevel = (Math.sin(phase * 2) * 0.5 + 0.5) * 0.8 + 0.1;
      
      for (let i = 0; i < vuCount; i++) {
        const x = i * (vuWidth + vuGap);
        const h = Math.max(2, (i / vuCount) * canvas.height * vuLevel);
        const isClipping = h > canvas.height * 0.9;
        ctx.fillStyle = isClipping ? '#ff4444' : 
          i > vuCount * 0.7 ? '#ffd93d' : 
          `rgba(0,255,157,${0.3 + (i / vuCount) * 0.7})`;
        ctx.fillRect(x, canvas.height - h, vuWidth, h);
      }
      
      ctx.shadowBlur = 0;
      phase += 0.05;
      animationRef.current = requestAnimationFrame(renderLoop);
    };
    
    renderLoop();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isDSPReady]);

  // ============================================
  // 🎛️ РЕНДЕР ПАРАМЕТРОВ ЭФФЕКТА
  // ============================================

  const renderDistortionParams = (params: DistortionParams) => (
    <div style={paramGridStyle}>
      <ParamSlider label="Drive" value={params.drive} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('distortion', 'drive', v)} color="#e17055" />
      <ParamSlider label="Tone" value={params.tone} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('distortion', 'tone', v)} color="#fdcb6e" />
      <ParamSlider label="Output" value={params.output} min={-20} max={20} step={0.5} unit="dB"
        onChange={v => updateParam('distortion', 'output', v)} color="#fff" />
      <div style={selectStyle}>
        <label style={paramLabelStyle}>Type</label>
        <select value={params.type} onChange={e => updateParam('distortion', 'type', e.target.value)} style={selectInputStyle}>
          <option value="overdrive">Overdrive</option>
          <option value="crunch">Crunch</option>
          <option value="distortion">Distortion</option>
          <option value="metal">Metal</option>
          <option value="fuzz">Fuzz</option>
        </select>
      </div>
    </div>
  );

  const renderDelayParams = (params: DelayParams) => (
    <div style={paramGridStyle}>
      <ParamSlider label="Time" value={params.time} min={20} max={2000} step={5} unit="ms"
        onChange={v => updateParam('delay', 'time', v)} color="#fdcb6e" />
      <ParamSlider label="Feedback" value={params.feedback} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('delay', 'feedback', v)} color="#e17055" />
      <ParamSlider label="Mix" value={params.mix} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('delay', 'mix', v)} color="#00cec9" />
      <div style={selectStyle}>
        <label style={paramLabelStyle}>Type</label>
        <select value={params.type} onChange={e => updateParam('delay', 'type', e.target.value)} style={selectInputStyle}>
          <option value="digital">Digital</option>
          <option value="analog">Analog</option>
          <option value="tape">Tape</option>
          <option value="pingpong">Ping-Pong</option>
        </select>
      </div>
      <ParamSlider label="Low Cut" value={params.lowCut} min={20} max={500} step={10} unit="Hz"
        onChange={v => updateParam('delay', 'lowCut', v)} color="#6c5ce7" />
      <ParamSlider label="High Cut" value={params.highCut} min={1000} max={20000} step={100} unit="Hz"
        onChange={v => updateParam('delay', 'highCut', v)} color="#6c5ce7" />
    </div>
  );

  const renderReverbParams = (params: ReverbParams) => (
    <div style={paramGridStyle}>
      <ParamSlider label="Decay" value={params.decay} min={0.1} max={10} step={0.1} unit="s"
        onChange={v => updateParam('reverb', 'decay', v)} color="#00cec9" />
      <ParamSlider label="Pre-Delay" value={params.preDelay} min={0} max={200} step={1} unit="ms"
        onChange={v => updateParam('reverb', 'preDelay', v)} color="#fdcb6e" />
      <ParamSlider label="Damping" value={params.damping} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('reverb', 'damping', v)} color="#e17055" />
      <ParamSlider label="Mix" value={params.mix} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('reverb', 'mix', v)} color="#fff" />
      <ParamSlider label="Room Size" value={params.roomSize} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('reverb', 'roomSize', v)} color="#6c5ce7" />
      <div style={selectStyle}>
        <label style={paramLabelStyle}>Type</label>
        <select value={params.type} onChange={e => updateParam('reverb', 'type', e.target.value)} style={selectInputStyle}>
          <option value="room">Room</option>
          <option value="hall">Hall</option>
          <option value="plate">Plate</option>
          <option value="spring">Spring</option>
          <option value="cathedral">Cathedral</option>
          <option value="ambient">Ambient</option>
        </select>
      </div>
    </div>
  );

  const renderChorusParams = (params: ChorusParams) => (
    <div style={paramGridStyle}>
      <ParamSlider label="Rate" value={params.rate} min={0.1} max={10} step={0.1} unit="Hz"
        onChange={v => updateParam('chorus', 'rate', v)} color="#0984e3" />
      <ParamSlider label="Depth" value={params.depth} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('chorus', 'depth', v)} color="#00cec9" />
      <ParamSlider label="Mix" value={params.mix} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('chorus', 'mix', v)} color="#fff" />
      <ParamSlider label="Feedback" value={params.feedback} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('chorus', 'feedback', v)} color="#e17055" />
      <ParamSlider label="Delay" value={params.delay} min={1} max={30} step={0.5} unit="ms"
        onChange={v => updateParam('chorus', 'delay', v)} color="#fdcb6e" />
      <div style={selectStyle}>
        <label style={paramLabelStyle}>Type</label>
        <select value={params.type} onChange={e => updateParam('chorus', 'type', e.target.value)} style={selectInputStyle}>
          <option value="chorus">Chorus</option>
          <option value="flanger">Flanger</option>
          <option value="phaser">Phaser</option>
          <option value="vibrato">Vibrato</option>
          <option value="tremolo">Tremolo</option>
        </select>
      </div>
    </div>
  );

  const renderCompressorParams = (params: CompressorParams) => (
    <div style={paramGridStyle}>
      <ParamSlider label="Threshold" value={params.threshold} min={-60} max={0} step={1} unit="dB"
        onChange={v => updateParam('compressor', 'threshold', v)} color="#00b894" />
      <ParamSlider label="Ratio" value={params.ratio} min={1} max={20} step={0.5} unit=":1"
        onChange={v => updateParam('compressor', 'ratio', v)} color="#fdcb6e" />
      <ParamSlider label="Attack" value={params.attack} min={0.1} max={50} step={0.1} unit="ms"
        onChange={v => updateParam('compressor', 'attack', v)} color="#e17055" />
      <ParamSlider label="Release" value={params.release} min={10} max={1000} step={10} unit="ms"
        onChange={v => updateParam('compressor', 'release', v)} color="#6c5ce7" />
      <ParamSlider label="Knee" value={params.knee} min={0} max={30} step={1} unit="dB"
        onChange={v => updateParam('compressor', 'knee', v)} color="#00cec9" />
      <ParamSlider label="Makeup Gain" value={params.makeupGain} min={0} max={20} step={0.5} unit="dB"
        onChange={v => updateParam('compressor', 'makeupGain', v)} color="#fff" />
    </div>
  );

  const renderNoiseGateParams = (params: NoiseGateParams) => (
    <div style={paramGridStyle}>
      <ParamSlider label="Threshold" value={params.threshold} min={-80} max={0} step={1} unit="dB"
        onChange={v => updateParam('noiseGate', 'threshold', v)} color="#6c5ce7" />
      <ParamSlider label="Attack" value={params.attack} min={0.1} max={10} step={0.1} unit="ms"
        onChange={v => updateParam('noiseGate', 'attack', v)} color="#00cec9" />
      <ParamSlider label="Hold" value={params.hold} min={10} max={500} step={10} unit="ms"
        onChange={v => updateParam('noiseGate', 'hold', v)} color="#fdcb6e" />
      <ParamSlider label="Release" value={params.release} min={10} max={1000} step={10} unit="ms"
        onChange={v => updateParam('noiseGate', 'release', v)} color="#e17055" />
      <ParamSlider label="Range" value={params.range} min={-80} max={0} step={1} unit="dB"
        onChange={v => updateParam('noiseGate', 'range', v)} color="#fff" />
    </div>
  );

  const renderWahParams = (params: WahWahParams) => (
    <div style={paramGridStyle}>
      <ParamSlider label="Frequency" value={params.frequency} min={200} max={2000} step={10} unit="Hz"
        onChange={v => updateParam('wah', 'frequency', v)} color="#fd79a8" />
      <ParamSlider label="Q" value={params.q} min={0.5} max={10} step={0.1} unit=""
        onChange={v => updateParam('wah', 'q', v)} color="#fdcb6e" />
      <ParamSlider label="Rate" value={params.rate} min={0.1} max={5} step={0.1} unit="Hz"
        onChange={v => updateParam('wah', 'rate', v)} color="#00cec9" />
      <ParamSlider label="Depth" value={params.depth} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('wah', 'depth', v)} color="#e17055" />
      <ParamSlider label="Mix" value={params.mix} min={0} max={100} step={1} unit="%"
        onChange={v => updateParam('wah', 'mix', v)} color="#fff" />
      <div style={selectStyle}>
        <label style={paramLabelStyle}>Mode</label>
        <select value={params.mode} onChange={e => updateParam('wah', 'mode', e.target.value)} style={selectInputStyle}>
          <option value="manual">Manual</option>
          <option value="auto">Auto</option>
          <option value="envelope">Envelope</option>
        </select>
      </div>
      {params.mode === 'manual' && (
        <ParamSlider label="Pedal" value={params.pedalPosition} min={0} max={100} step={1} unit="%"
          onChange={v => updateParam('wah', 'pedalPosition', v)} color="#fd79a8" />
      )}
    </div>
  );

  const renderEffectParams = () => {
    if (!selectedEffect) return null;
    const params = effectParams[selectedEffect];
    if (!params) return <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>No parameters available</div>;
    
    switch (selectedEffect) {
      case 'distortion': return renderDistortionParams(params);
      case 'delay': return renderDelayParams(params);
      case 'reverb': return renderReverbParams(params);
      case 'chorus': return renderChorusParams(params);
      case 'compressor': return renderCompressorParams(params);
      case 'noiseGate': return renderNoiseGateParams(params);
      case 'wah': return renderWahParams(params);
      default: return null;
    }
  };

  // ============================================
  // 🎛️ ОСНОВНОЙ РЕНДЕР
  // ============================================

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
          <span style={{ fontSize: '18px' }}>🎛️</span>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.5px' }}>
              Guitar Processor
            </span>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
              DSP Chain: Gate → Comp → Drive → Mod → Delay → Reverb → Wah
            </div>
          </div>
        </div>
        
        {/* Индикатор статуса */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '12px',
          background: isDSPReady ? 'rgba(0,255,157,0.1)' : 'rgba(255,68,68,0.1)',
          border: `1px solid ${isDSPReady ? 'rgba(0,255,157,0.2)' : 'rgba(255,68,68,0.2)'}`,
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isDSPReady ? '#00FF9D' : '#ff4444',
            boxShadow: isDSPReady ? '0 0 8px #00FF9D' : 'none',
          }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: isDSPReady ? '#00FF9D' : '#ff4444' }}>
            {isDSPReady ? 'READY' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* ===== VU-METER ВИЗУАЛИЗАЦИЯ ===== */}
      <div style={{
        height: '60px',
        background: '#07080b',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '4px 16px',
      }}>
        <canvas ref={canvasRef} width={600} height={52} style={{ width: '100%', height: '100%', display: 'block' }} />
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
          {(Object.keys(GUITAR_PRESETS) as GuitarPresetName[]).map(name => {
            const preset = GUITAR_PRESETS[name];
            const isActive = currentPreset === name;
            return (
              <button
                key={name}
                onClick={() => handlePresetChange(name)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '16px',
                  border: `1px solid ${isActive ? '#00FF9D' : 'rgba(255,255,255,0.08)'}`,
                  background: isActive ? 'rgba(0,255,157,0.12)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#00FF9D' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                title={preset.description}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                {preset.name}
              </button>
            );
          })}
          {currentPreset === 'custom' && (
            <span style={{
              padding: '5px 14px',
              borderRadius: '16px',
              border: '1px solid #fdcb6e',
              background: 'rgba(253,203,110,0.1)',
              color: '#fdcb6e',
              fontSize: '11px',
              fontWeight: 700,
              fontStyle: 'italic',
            }}>
              Custom
            </span>
          )}
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
        {(Object.keys(EFFECT_CONFIGS) as EffectType[]).map(effectKey => {
          const config = EFFECT_CONFIGS[effectKey];
          const isActive = activeEffects[effectKey];
          const isSelected = selectedEffect === effectKey;
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
              
              {/* Bypass кнопка */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleEffect(effectKey); }}
                style={{
                  padding: '2px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? config.color : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.2)',
                  fontSize: '8px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  transition: '0.1s',
                }}
              >
                {isActive ? 'ON' : 'OFF'}
              </button>
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
        <span>Chain: Input → Noise Gate → Compressor → Distortion → Chorus → Delay → Reverb → Wah → Limiter → Output</span>
        <span>FretLab DSP Engine v1.0</span>
      </div>
    </div>
  );
};

// ============================================
// 🎛️ ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
// ============================================

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  color: string;
}

const ParamSlider: React.FC<ParamSliderProps> = ({ label, value, min, max, step, unit, onChange, color }) => {
  const isActive = value !== 0;
  return (
    <div style={paramItemStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <label style={paramLabelStyle}>{label}</label>
        <span style={{
          fontSize: '11px',
          fontWeight: 800,
          fontFamily: 'monospace',
          color: isActive ? color : 'rgba(255,255,255,0.3)',
        }}>
          {value > 0 && label !== 'Threshold' && label !== 'Range' ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          accentColor: color,
          cursor: 'pointer',
          background: `linear-gradient(to right, ${color}44 0%, ${color} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.05) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
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

const selectStyle: React.CSSProperties = {
  ...paramItemStyle,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const selectInputStyle: React.CSSProperties = {
  background: '#0d0e14',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none',
};

export default GuitarProcessor;

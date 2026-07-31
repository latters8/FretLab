import React, { useState } from 'react';
import { useGuitarRig } from '../../hooks/useGuitarRig';
import { Knob } from './Knob';
import { Pedal } from './Pedal';
import { Spectrum } from './Spectrum';
import { PresetPanel } from './PresetPanel';

export const PedalBoard: React.FC = () => {
  const {
    isReady,
    isPlaying,
    toggle,
    params,
    updateParam,
    loadPreset,
    savePreset,
    deletePreset,
    getAllPresets,
    getFFT,
    getWaveform,
    getReduction,
  } = useGuitarRig();

  const [visualMode, setVisualMode] = useState<'fft' | 'waveform'>('fft');

  if (!isReady) {
    return (
      <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>
        Инициализация AudioWorklet…
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: '#0f0f0f', minHeight: '100vh', color: '#eee' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 2 }}>🎸 FretLab Rig</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setVisualMode(v => v === 'fft' ? 'waveform' : 'fft')}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#1a1a1a',
              color: '#888',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {visualMode === 'fft' ? 'FFT' : 'Wave'}
          </button>
          <button
            onClick={toggle}
            style={{
              padding: '10px 28px',
              borderRadius: 6,
              border: 'none',
              background: isPlaying ? '#ef4444' : '#22c55e',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            {isPlaying ? '⏹ STOP' : '▶ PLAY'}
          </button>
        </div>
      </div>

      {/* Presets */}
      <PresetPanel
        presets={getAllPresets()}
        currentParams={params}
        onLoad={loadPreset}
        onSave={savePreset}
        onDelete={deletePreset}
      />

      {/* Spectrum */}
      <div style={{ marginBottom: 20 }}>
        <Spectrum
          getData={visualMode === 'fft' ? getFFT : getWaveform}
          mode={visualMode}
          width={800}
          height={140}
        />
      </div>

      {/* GR Meter */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#666', width: 60 }}>GR</span>
        <div style={{ flex: 1, height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.abs(getReduction()) * 5)}%`,
              height: '100%',
              background: '#f59e0b',
              transition: 'width 0.05s linear',
              marginLeft: 'auto',
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace', width: 40, textAlign: 'right' }}>
          {getReduction().toFixed(1)} dB
        </span>
      </div>

      {/* Pedals Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {/* Gate */}
        <Pedal title="Noise Gate" color="#64748b" active={true}>
          <Knob label="Thresh" value={params.gateThreshold} min={-70} max={-20} step={1} onChange={v => updateParam('gateThreshold', v)} />
          <Knob label="Attack" value={params.gateAttack} min={0.001} max={0.1} step={0.001} onChange={v => updateParam('gateAttack', v)} />
          <Knob label="Release" value={params.gateRelease} min={0.01} max={0.5} step={0.01} onChange={v => updateParam('gateRelease', v)} />
        </Pedal>

        {/* Preamp */}
        <Pedal title="Tube Drive" color="#f97316" active={true}>
          <Knob label="Drive" value={params.drive} min={0} max={1} step={0.01} onChange={v => updateParam('drive', v)} />
          <Knob label="Tube" value={params.tubeAmount} min={0} max={1} step={0.01} onChange={v => updateParam('tubeAmount', v)} />
        </Pedal>

        {/* EQ */}
        <Pedal title="Amp EQ" color="#a855f7" active={true}>
          <Knob label="Bass" value={params.bass} min={-12} max={12} step={0.5} onChange={v => updateParam('bass', v)} />
          <Knob label="Mid" value={params.mid} min={-12} max={12} step={0.5} onChange={v => updateParam('mid', v)} />
          <Knob label="Treble" value={params.treble} min={-12} max={12} step={0.5} onChange={v => updateParam('treble', v)} />
          <Knob label="Presence" value={params.presence} min={-6} max={6} step={0.5} onChange={v => updateParam('presence', v)} />
        </Pedal>

        {/* Cabinet */}
        <Pedal title="Cabinet" color="#84cc16" active={params.cabEnabled} onToggle={() => updateParam('cabEnabled', !params.cabEnabled)}>
          <div style={{ fontSize: 11, color: '#666', padding: '8px 0' }}>
            {params.cabIR.split('/').pop()}
          </div>
        </Pedal>

        {/* Compressor */}
        <Pedal title="Comp HQ" color="#06b6d4" active={params.compEnabled} onToggle={() => updateParam('compEnabled', !params.compEnabled)}>
          <Knob label="Thresh" value={params.compThreshold} min={-60} max={0} step={1} onChange={v => updateParam('compThreshold', v)} disabled={!params.compEnabled} />
          <Knob label="Ratio" value={params.compRatio} min={1} max={20} step={0.5} onChange={v => updateParam('compRatio', v)} disabled={!params.compEnabled} />
          <Knob label="Attack" value={params.compAttack} min={0.1} max={100} step={0.1} onChange={v => updateParam('compAttack', v)} disabled={!params.compEnabled} />
          <Knob label="Release" value={params.compRelease} min={10} max={1000} step={1} onChange={v => updateParam('compRelease', v)} disabled={!params.compEnabled} />
          <Knob label="Makeup" value={params.compMakeup} min={0} max={24} step={0.5} onChange={v => updateParam('compMakeup', v)} disabled={!params.compEnabled} />
          <Knob label="Mix" value={params.compMix} min={0} max={1} step={0.01} onChange={v => updateParam('compMix', v)} disabled={!params.compEnabled} />
        </Pedal>

        {/* Delay */}
        <Pedal title="Delay HQ" color="#ec4899" active={params.delayEnabled} onToggle={() => updateParam('delayEnabled', !params.delayEnabled)}>
          <Knob label="Time" value={params.delayTime} min={20} max={3000} step={1} onChange={v => updateParam('delayTime', v)} disabled={!params.delayEnabled} />
          <Knob label="Fdbk" value={params.delayFeedback} min={0} max={100} step={1} onChange={v => updateParam('delayFeedback', v)} disabled={!params.delayEnabled} />
          <Knob label="Mix" value={params.delayMix} min={0} max={100} step={1} onChange={v => updateParam('delayMix', v)} disabled={!params.delayEnabled} />
          <Knob label="Mod D" value={params.delayModDepth} min={0} max={15} step={0.1} onChange={v => updateParam('delayModDepth', v)} disabled={!params.delayEnabled} />
          <Knob label="Mod R" value={params.delayModRate} min={0} max={8} step={0.1} onChange={v => updateParam('delayModRate', v)} disabled={!params.delayEnabled} />
        </Pedal>

        {/* Reverb */}
        <Pedal title="Reverb HQ" color="#6366f1" active={params.reverbEnabled} onToggle={() => updateParam('reverbEnabled', !params.reverbEnabled)}>
          <Knob label="Decay" value={params.reverbDecay} min={0.1} max={20} step={0.1} onChange={v => updateParam('reverbDecay', v)} disabled={!params.reverbEnabled} />
          <Knob label="PreD" value={params.reverbPreDelay} min={0} max={200} step={1} onChange={v => updateParam('reverbPreDelay', v)} disabled={!params.reverbEnabled} />
          <Knob label="Damp" value={params.reverbDamping} min={0} max={1} step={0.01} onChange={v => updateParam('reverbDamping', v)} disabled={!params.reverbEnabled} />
          <Knob label="Mix" value={params.reverbMix} min={0} max={100} step={1} onChange={v => updateParam('reverbMix', v)} disabled={!params.reverbEnabled} />
          <Knob label="Room" value={params.reverbRoomSize} min={0.5} max={2} step={0.1} onChange={v => updateParam('reverbRoomSize', v)} disabled={!params.reverbEnabled} />
          <Knob label="Shimmer" value={params.reverbShimmer} min={0} max={1} step={0.01} onChange={v => updateParam('reverbShimmer', v)} disabled={!params.reverbEnabled} />
        </Pedal>

        {/* Master */}
        <Pedal title="Master" color="#f43f5e" active={true}>
          <Knob label="Volume" value={params.masterVolume} min={0} max={2} step={0.01} onChange={v => updateParam('masterVolume', v)} />
        </Pedal>
      </div>
    </div>
  );
};
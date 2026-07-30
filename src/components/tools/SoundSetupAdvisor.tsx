// src/components/tools/SoundSetupAdvisor.tsx
// 🎯 ФАЗА 4: Интерактивный советник по настройке звука

import React, { useState } from 'react';
import { getPresetForGenre, getAllGenres, EQ_TIPS, MICROPHONE_TIPS } from '../../data/equipmentGuide';

type TabType = 'presets' | 'eq' | 'microphone';

const SoundSetupAdvisor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [selectedGenre, setSelectedGenre] = useState<string>('Rock');
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  const currentPreset = getPresetForGenre(selectedGenre);

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>🎛️</span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Sound Setup Advisor
        </span>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {(['presets', 'eq', 'microphone'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === tab ? '#000' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: '0.2s'
            }}
          >
            {tab === 'presets' ? '🎸 Presets' : tab === 'eq' ? '⚡ EQ Guide' : '🎤 Mics'}
          </button>
        ))}
      </div>

      {/* PRESETS TAB */}
      {activeTab === 'presets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Genre selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {getAllGenres().map(genre => (
              <button
                key={genre}
                onClick={() => { setSelectedGenre(genre); setExpandedPreset(null); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${selectedGenre === genre ? 'var(--accent)' : 'var(--border-color)'}`,
                  background: selectedGenre === genre ? 'rgba(0,255,157,0.1)' : 'var(--bg-primary)',
                  color: selectedGenre === genre ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Preset details */}
          {currentPreset && (
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentPreset.genre}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {currentPreset.description}
                </div>
              </div>

              {/* Amp */}
              <div
                onClick={() => setExpandedPreset(expandedPreset === 'amp' ? null : 'amp')}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🔊 {currentPreset.amp.name}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {expandedPreset === 'amp' ? '▲' : '▼'}
                </span>
              </div>
              {expandedPreset === 'amp' && (
                <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <Knob label="Gain" value={currentPreset.amp.gain} />
                  <Knob label="Bass" value={currentPreset.amp.bass} />
                  <Knob label="Mid" value={currentPreset.amp.mid} />
                  <Knob label="Treble" value={currentPreset.amp.treble} />
                  <Knob label="Presence" value={currentPreset.amp.presence} />
                  <Knob label="Reverb" value={currentPreset.amp.reverb} />
                  <Knob label="Master" value={currentPreset.amp.master} />
                </div>
              )}

              {/* Pedals */}
              <div
                onClick={() => setExpandedPreset(expandedPreset === 'pedals' ? null : 'pedals')}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🔲 Pedals ({currentPreset.pedals.length})
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {expandedPreset === 'pedals' ? '▲' : '▼'}
                </span>
              </div>
              {expandedPreset === 'pedals' && currentPreset.pedals.map((pedal, idx) => (
                <div key={idx} style={{
                  padding: '8px 14px',
                  background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                  borderBottom: idx < currentPreset.pedals.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>
                    {pedal.name} ({pedal.type})
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {pedal.setting1} • {pedal.setting2} • {pedal.setting3}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                    {pedal.notes}
                  </div>
                </div>
              ))}

              {/* Guitar */}
              <div
                onClick={() => setExpandedPreset(expandedPreset === 'guitar' ? null : 'guitar')}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🎸 {currentPreset.guitar.name}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {expandedPreset === 'guitar' ? '▲' : '▼'}
                </span>
              </div>
              {expandedPreset === 'guitar' && (
                <div style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div>Pickups: {currentPreset.guitar.pickup}</div>
                  <div>Position: {currentPreset.guitar.pickupPosition}</div>
                  <div>Tone: {currentPreset.guitar.tone}/10 • Volume: {currentPreset.guitar.volume}/10</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {currentPreset.guitar.notes}
                  </div>
                </div>
              )}

              {/* EQ Advice */}
              <div style={{ padding: '10px 14px', background: 'rgba(0,255,157,0.04)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                  ⚡ EQ Advice
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {currentPreset.eqAdvice}
                </div>
              </div>

              {/* Tips */}
              <div style={{ padding: '10px 14px', background: 'rgba(255,184,0,0.04)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#ffb800', marginBottom: '4px' }}>
                  💡 Tips
                </div>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {currentPreset.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EQ GUIDE TAB */}
      {activeTab === 'eq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Quick EQ reference for guitar and bass
          </div>
          {EQ_TIPS.map((tip, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: idx % 2 === 0 ? 'var(--bg-primary)' : 'transparent',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {tip.freq}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {tip.range} • {tip.instrument}
                </div>
              </div>
              <div style={{ flex: 1, fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {tip.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MICROPHONE TAB */}
      {activeTab === 'microphone' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Mic placement guide for recording guitar cabinets
          </div>
          {MICROPHONE_TIPS.map((tip, idx) => (
            <div key={idx} style={{
              padding: '10px 12px',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🎤 {tip.mic}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(0,184,255,0.1)',
                  color: 'var(--accent-blue)'
                }}>
                  {tip.genre}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <strong>Placement:</strong> {tip.placement}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                {tip.notes}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes knobAnim {
          from { transform: rotate(-90deg); }
          to { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
};

const Knob: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const rotation = -90 + (value / 10) * 180;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: '2px',
          height: '8px',
          background: 'var(--accent)',
          borderRadius: '1px',
          transform: `rotate(${rotation}deg)`,
          position: 'absolute',
          bottom: '3px',
          transition: 'transform 0.3s ease'
        }} />
      </div>
      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
        {label}: <strong style={{ color: 'var(--text-primary)' }}>{value}</strong>
      </div>
    </div>
  );
};

export default SoundSetupAdvisor;

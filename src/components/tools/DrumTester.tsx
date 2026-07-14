// src/components/tools/DrumTester.tsx

import React, { useState } from 'react';
import { audioManager } from '../../services/AudioManager';
import * as Tone from 'tone';

const DrumTester: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastHit, setLastHit] = useState<string>('');

  const playDrum = async (type: 'kick' | 'snare' | 'hihat' | 'crash' | 'ride' | 'tom') => {
    await audioManager.init();
    await Tone.start();
    
    const velocity = 0.8 + Math.random() * 0.2;
    audioManager.playDrumHit(type, Tone.now(), velocity);
    setLastHit(`${type} (${Math.round(velocity * 100)}%)`);
    
    // Визуальная обратная связь
    const el = document.getElementById(`drum-${type}`);
    if (el) {
      el.style.transform = 'scale(0.8)';
      setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, 100);
    }
  };

  const playPattern = async () => {
    setIsPlaying(true);
    await audioManager.init();
    await Tone.start();
    
    const pattern = [
      { type: 'kick', time: 0 },
      { type: 'snare', time: 0.25 },
      { type: 'hihat', time: 0.125 },
      { type: 'kick', time: 0.5 },
      { type: 'snare', time: 0.75 },
      { type: 'hihat', time: 0.625 },
      { type: 'crash', time: 0 },
      { type: 'ride', time: 0.375 },
    ];
    
    pattern.forEach((hit) => {
      const time = Tone.now() + hit.time;
      audioManager.playDrumHit(hit.type as any, time, 0.8);
    });
    
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000);
  };

  const drumColors = {
    kick: '#ff4444',
    snare: '#ff8844',
    hihat: '#ffcc44',
    crash: '#44ff44',
    ride: '#44ccff',
    tom: '#8844ff'
  };

  const drumEmojis = {
    kick: '🥁',
    snare: '🥁',
    hihat: '🔔',
    crash: '💥',
    ride: '🔔',
    tom: '🥁'
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: 'var(--bg-root)', 
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      maxWidth: '600px',
      margin: '20px auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
        🥁 Drum Tester
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '10px',
        marginBottom: '16px'
      }}>
        {(['kick', 'snare', 'hihat', 'crash', 'ride', 'tom'] as const).map((type) => (
          <button
            id={`drum-${type}`}
            key={type}
            onClick={() => playDrum(type)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `2px solid ${drumColors[type]}`,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 700,
              transition: 'transform 0.1s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '24px' }}>{drumEmojis[type]}</span>
            <span style={{ fontSize: '12px', textTransform: 'uppercase' }}>
              {type}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <button
          onClick={playPattern}
          disabled={isPlaying}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: isPlaying ? 'var(--border-color)' : 'var(--accent)',
            color: isPlaying ? 'var(--text-muted)' : '#000',
            cursor: isPlaying ? 'default' : 'pointer',
            fontWeight: 800,
            flex: 1
          }}
        >
          {isPlaying ? '🎵 Playing...' : '🎵 Play Pattern'}
        </button>
        
        <button
          onClick={() => {
            audioManager.stopAll();
            setIsPlaying(false);
            setLastHit('Stopped');
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ⏹ Stop
        </button>
      </div>

      {lastHit && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(0,255,157,0.1)',
          borderRadius: '6px',
          border: '1px solid var(--accent)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          🎯 Last hit: <strong>{lastHit}</strong>
        </div>
      )}

      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '6px',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div>💡 Кликните на барабан чтобы услышать звук</div>
        <div>🔄 Используется MIDI-синтез (сэмплы не требуются)</div>
      </div>
    </div>
  );
};

export default DrumTester;
import React from 'react';
import { useMusic, type DiatonicChord } from '../../context/MusicContext';

const DiatonicChords: React.FC = () => {
  const { getDiatonicChords } = useMusic();
  const chords = getDiatonicChords();

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '14px', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '12px' }}>
        🎶 Diatonic Chords
      </div>
      
      {chords.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {chords.map((c: DiatonicChord) => (
            <div key={c.roman} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{c.roman}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>{c.chord}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
          No diatonic chords for this mode.
        </div>
      )}
    </div>
  );
};

export default DiatonicChords;
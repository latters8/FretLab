import React from 'react';
import { useMusic } from '../../context/MusicContext';

const Header: React.FC = () => {
  const { keyNote, mode, bpm } = useMusic();

  return (
    <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)', height: '56px'
    }}>
      <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--accent)' }}>
        ♯ FretLab
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{
            display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)',
            background: 'var(--bg-primary)', padding: '6px 16px',
            borderRadius: '20px', border: '1px solid var(--border-color)'
        }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Key</span> <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{keyNote}</span></span>
          <span><span style={{ color: 'var(--text-muted)' }}>Mode</span> <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{mode}</span></span>
          <span><span style={{ color: 'var(--text-muted)' }}>BPM</span> <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{bpm}</span></span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: 'var(--bg-hover)', border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)', cursor: 'pointer' 
          }}>▶</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
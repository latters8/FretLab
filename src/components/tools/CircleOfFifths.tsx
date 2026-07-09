import React from 'react';
import { useMusic } from '../../context/MusicContext';

const CIRCLE_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'Fm', 'Cm', 'Gm', 'Dm'];

const CircleOfFifths: React.FC = () => {
  // Вытягиваем функции изменения из нашего MusicContext
  const { keyNote, mode, setKeyNote, setMode } = useMusic();

  const radius = 90;
  const cx = 110;
  const cy = 110;

  const handleKeyClick = (key: string, isMinor: boolean) => {
    const rootNote = isMinor ? key.replace('m', '') : key;
    setKeyNote(rootNote);
    setMode(isMinor ? 'aeolian' : 'major');
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '14px', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>
        🔄 Circle of Fifths
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: '240px', height: 'auto' }}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border-color)" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={radius * 0.65} fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.5" />
          
          {CIRCLE_KEYS.map((key, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            const isActive = key === keyNote && mode === 'major';

            return (
              <text
                key={key}
                x={x}
                y={y + 4}
                textAnchor="middle"
                onClick={() => handleKeyClick(key, false)}
                style={{
                  fill: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: isActive ? '14px' : '12px',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  transition: '0.15s'
                }}
              >
                {key}
              </text>
            );
          })}

          {MINOR_KEYS.map((key, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const x = cx + (radius * 0.55) * Math.cos(angle);
            const y = cy + (radius * 0.55) * Math.sin(angle);
            const root = key.replace('m', '');
            const isActive = root === keyNote && mode === 'aeolian';

            return (
              <text
                key={key}
                x={x}
                y={y + 3}
                textAnchor="middle"
                onClick={() => handleKeyClick(key, true)}
                style={{
                  fill: isActive ? 'var(--accent-blue)' : '#4a6b8a',
                  fontSize: isActive ? '12px' : '10px',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  transition: '0.15s'
                }}
              >
                {key}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default CircleOfFifths;
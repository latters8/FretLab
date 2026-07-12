import React from 'react';
import { useMusic } from '../../context/MusicContext';

const CIRCLE_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'Fm', 'Cm', 'Gm', 'Dm'];

const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return { x: cx + (r * Math.cos(angleInRadians)), y: cy + (r * Math.sin(angleInRadians)) };
};

const describeArc = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
};

const CircleOfFifths: React.FC = () => {
  const { keyNote, mode, setKeyNote, setMode } = useMusic();

  const cx = 160;
  const cy = 160;
  const majorOuter = 150;
  const majorInner = 100;
  const minorOuter = 100;
  const minorInner = 50;

  const handleKeyClick = (key: string, isMinor: boolean) => {
    const rootNote = isMinor ? key.replace('m', '') : key;
    setKeyNote(rootNote);
    setMode(isMinor ? 'aeolian' : 'major');
  };

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px', marginBottom: '20px', textAlign: 'center' }}>
        🔄 Circle of Fifths
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
          
          {/* Сектора МАЖОРА */}
          {CIRCLE_KEYS.map((key, i) => {
            const startAngle = i * 30 - 15;
            const endAngle = i * 30 + 15;
            const isActive = key === keyNote && mode === 'major';
            const pathData = describeArc(cx, cy, majorInner, majorOuter, startAngle, endAngle);
            const textPos = polarToCartesian(cx, cy, (majorInner + majorOuter) / 2, i * 30);

            return (
              <g key={`maj-${key}`} onClick={() => handleKeyClick(key, false)} style={{ cursor: 'pointer' }}>
                <path 
                  d={pathData} 
                  fill={isActive ? 'var(--accent)' : 'var(--bg-panel)'} 
                  stroke="var(--border-color)" 
                  strokeWidth="2"
                  style={{ transition: 'fill 0.3s' }}
                />
                <text 
                  x={textPos.x} y={textPos.y + 8} textAnchor="middle" 
                  style={{ fill: isActive ? '#000' : 'var(--text-primary)', fontSize: '24px', fontWeight: 800, transition: 'fill 0.3s' }}>
                  {key}
                </text>
              </g>
            );
          })}

          {/* Сектора МИНОРА */}
          {MINOR_KEYS.map((key, i) => {
            const startAngle = i * 30 - 15;
            const endAngle = i * 30 + 15;
            const root = key.replace('m', '');
            
            // Исправлено: теперь минор проверяет строго лад aeolian
            const isActive = root === keyNote && mode === 'aeolian';
            const pathData = describeArc(cx, cy, minorInner, minorOuter, startAngle, endAngle);
            const textPos = polarToCartesian(cx, cy, (minorInner + minorOuter) / 2, i * 30);

            return (
              <g key={`min-${key}`} onClick={() => handleKeyClick(key, true)} style={{ cursor: 'pointer' }}>
                <path 
                  d={pathData} 
                  // 🔥 ИСПРАВЛЕНО: Вместо сломанной var(--accent-blue) используется валидная var(--accent-blue) из index.css
                  fill={isActive ? 'var(--accent-blue)' : 'var(--bg-secondary)'} 
                  stroke="var(--border-color)" 
                  strokeWidth="2"
                  style={{ transition: 'fill 0.3s' }}
                />
                <text 
                  x={textPos.x} y={textPos.y + 6} textAnchor="middle" 
                  style={{ fill: isActive ? '#000' : 'var(--text-secondary)', fontSize: '18px', fontWeight: 700, transition: 'fill 0.3s' }}>
                  {key}
                </text>
              </g>
            );
          })}

          {/* Пустой центр */}
          <circle cx={cx} cy={cy} r={minorInner} fill="var(--bg-primary)" stroke="var(--border-color)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

export default CircleOfFifths;
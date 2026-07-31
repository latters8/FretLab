import React, { useRef, useState, useCallback, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  size = 60,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -135 + percentage * 270;

  const handleStart = useCallback((clientY: number) => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = value;
  }, [disabled, value]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = startYRef.current - clientY;
      const range = max - min;
      const sensitivity = range / 150;
      let newValue = startValueRef.current + deltaY * sensitivity;
      newValue = Math.max(min, Math.min(max, newValue));
      newValue = Math.round(newValue / step) * step;
      newValue = parseFloat(newValue.toFixed(10));
      onChange(newValue);
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, min, max, step, onChange]);

  const strokeWidth = size * 0.14;
  const radius = (size - strokeWidth) / 2 - 4;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (270 / 360) * circumference;

  const rad = (angle - 90) * (Math.PI / 180);
  const indicatorR = radius - strokeWidth / 2;
  const indicatorX = center + indicatorR * Math.cos(rad);
  const indicatorY = center + indicatorR * Math.sin(rad);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        opacity: disabled ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : disabled ? 'not-allowed' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={(e) => handleStart(e.clientY)}
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
    >
      <svg width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(-135 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#4ade80"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${percentage * arcLength} ${circumference}`}
          transform={`rotate(-135 ${center} ${center})`}
        />
        <circle cx={indicatorX} cy={indicatorY} r={strokeWidth * 0.35} fill="#fff" />
      </svg>
      <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 11, color: '#eee', fontFamily: 'monospace', minWidth: 40, textAlign: 'center' }}>
        {Number.isInteger(step) ? value : value.toFixed(2)}
      </span>
    </div>
  );
};
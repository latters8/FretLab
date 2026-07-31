import React, { type ReactNode } from 'react';

interface PedalProps {
  title: string;
  color?: string;
  active?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}

export const Pedal: React.FC<PedalProps> = ({
  title,
  color = '#3b82f6',
  active = true,
  onToggle,
  children,
}) => {
  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: 8,
        border: `2px solid ${active ? color : '#333'}`,
        padding: 16,
        minWidth: 180,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: active ? `0 0 12px ${color}33` : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: active ? color : '#555', textTransform: 'uppercase', letterSpacing: 1 }}>
          {title}
        </span>
        <button
          onClick={onToggle}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: active ? color : '#333',
            color: '#fff',
            fontSize: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          {active ? 'ON' : 'OFF'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
};
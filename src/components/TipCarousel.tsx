// src/components/TipCarousel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { getTipByIndex, getTipCount } from '../utils/tipsGenerator';

interface TipCarouselProps {
  autoRotate?: boolean;
  rotateInterval?: number;
}

const TipCarousel: React.FC<TipCarouselProps> = ({
  autoRotate = true,
  rotateInterval = 5000
}) => {
  const [index, setIndex] = useState(0);
  const [isAuto, setIsAuto] = useState(autoRotate);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  const totalTips = getTipCount();
  const tip = getTipByIndex(index);

  const animateTo = useCallback((nextIndex: number, dir: 'prev' | 'next') => {
    if (isAnimating) return;

    setIsAnimating(true);
    setDirection(dir === 'next' ? 'right' : 'left');

    setTimeout(() => {
      setIndex(nextIndex);
      setIsAnimating(false);
    }, 150);
  }, [isAnimating]);

  const navigate = useCallback((dir: 'prev' | 'next') => {
    const next = dir === 'next'
      ? (index + 1) % totalTips
      : (index - 1 + totalTips) % totalTips;

    animateTo(next, dir);
  }, [animateTo, index, totalTips]);

  useEffect(() => {
    if (!isAuto) return;
    
    const timer = setInterval(() => {
      // Рандом: выбираем индекс, отличный от текущего.
      if (totalTips <= 1) return;
      const nextIndex = (() => {
        let candidate = Math.floor(Math.random() * totalTips);
        if (candidate === index) {
          candidate = (candidate + 1) % totalTips;
        }
        return candidate;
      })();

      const dir: 'prev' | 'next' = nextIndex === (index + 1) % totalTips ? 'next' : 'prev';
      animateTo(nextIndex, dir);
    }, rotateInterval);

    return () => clearInterval(timer);
  }, [isAuto, rotateInterval, totalTips, index, animateTo]);


  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    technique: { bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.3)', text: '#ff6b6b' },
    harmony: { bg: 'rgba(78,205,196,0.08)', border: 'rgba(78,205,196,0.3)', text: '#4ecdc4' },
    rhythm: { bg: 'rgba(255,209,102,0.08)', border: 'rgba(255,209,102,0.3)', text: '#ffd166' },
    dynamics: { bg: 'rgba(6,214,160,0.08)', border: 'rgba(6,214,160,0.3)', text: '#06d6a0' },
    style: { bg: 'rgba(17,138,178,0.08)', border: 'rgba(17,138,178,0.3)', text: '#118ab2' },
    practice: { bg: 'rgba(247,37,133,0.08)', border: 'rgba(247,37,133,0.3)', text: '#f72585' },
    touchgrass: { bg: 'rgba(118,200,147,0.08)', border: 'rgba(118,200,147,0.3)', text: '#76c893' }
  };

  const colors = categoryColors[tip.category] || categoryColors.technique;

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      padding: '20px',
      maxWidth: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '24px' }}>{tip.icon}</span>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: colors.text,
            background: colors.bg,
            padding: '4px 12px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            {tip.category}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <span>{index + 1}</span>
          <span>/</span>
          <span>{totalTips}</span>
        </div>
      </div>

      {/* Content with animation */}
      <div style={{
        transition: 'all 0.3s ease',
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating 
          ? `translateX(${direction === 'right' ? '-20px' : '20px'})` 
          : 'translateX(0)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          lineHeight: 1.3
        }}>
          {tip.title}
        </h3>
        
        <p style={{
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          marginBottom: '12px'
        }}>
          {tip.description}
        </p>

        {/* Actionable */}
        {tip.actionable && (
          <div style={{
            background: 'rgba(0,255,157,0.06)',
            borderLeft: '3px solid var(--accent)',
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '12px'
          }}>
            <span style={{
              fontWeight: 700,
              color: 'var(--accent)',
              fontSize: '12px'
            }}>
              🎯 Действие:
            </span>
            <span style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              marginLeft: '6px'
            }}>
              {tip.actionable}
            </span>
          </div>
        )}

        {/* Berklee Quote */}
        {tip.berkleeTip && (
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '12px',
            fontSize: '12px',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>🎓 </span>
            {tip.berkleeTip}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => { setIsAuto(false); navigate('prev'); }}
          style={buttonStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ←
        </button>
        
        <button
          onClick={() => setIsAuto(!isAuto)}
          style={{
            ...buttonStyle,
            minWidth: '40px',
            fontSize: '14px'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {isAuto ? '⏸' : '▶'}
        </button>
        
        <button
          onClick={() => { setIsAuto(false); navigate('next'); }}
          style={buttonStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          →
        </button>
      </div>

      {/* Progress bar */}
      {isAuto && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: 'var(--accent)',
          borderRadius: '0 0 0 16px',
          transition: 'width 0.1s linear',
          width: '100%',
          animation: `progress ${rotateInterval}ms linear infinite`
        }}>
          <style>{`
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

export default TipCarousel;
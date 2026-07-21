// src/components/tips/AnimatedTipBlock.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type Tip } from '../../utils/tipsGenerator';

interface AnimatedTipBlockProps {
  tips: Tip[];
  autoRotate?: boolean;
  minInterval?: number; // минимальный интервал в мс (по умолч. 5000)
  maxInterval?: number; // максимальный интервал в мс (по умолч. 10000)
}

type AnimPhase = 'idle' | 'fallOut' | 'fallIn';

const AnimatedTipBlock: React.FC<AnimatedTipBlockProps> = ({
  tips,
  autoRotate = true,
  minInterval = 5000,
  maxInterval = 10000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle');
  const [isAuto, setIsAuto] = useState(autoRotate);
  const timerRef = useRef<number | null>(null);

  const getRandomInterval = useCallback(() => {
    return Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
  }, [minInterval, maxInterval]);

  const advanceTip = useCallback(() => {
    if (tips.length <= 1) return;

    // 1. Начинаем выпадение старого
    setAnimPhase('fallOut');

    // 2. После выпадения (~400ms) меняем контент и запускаем падение нового
    setTimeout(() => {
      const nextIndex = (() => {
        let candidate = Math.floor(Math.random() * tips.length);
        if (candidate === currentIndex && tips.length > 1) {
          candidate = (candidate + 1) % tips.length;
        }
        return candidate;
      })();
      setCurrentIndex(nextIndex);
      setAnimPhase('fallIn');

      // 3. После завершения падения (~500ms) возвращаемся в idle
      setTimeout(() => {
        setAnimPhase('idle');
      }, 500);
    }, 400);
  }, [tips, currentIndex]);

  // Авто-ротация
  useEffect(() => {
    if (!isAuto || tips.length <= 1) return;

    const scheduleNext = () => {
      const interval = getRandomInterval();
      timerRef.current = window.setTimeout(() => {
        advanceTip();
      }, interval);
    };

    scheduleNext();

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuto, advanceTip, getRandomInterval, tips.length]);

  if (!tips || tips.length === 0) return null;

  const tip = tips[currentIndex];

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
      borderRadius: '12px',
      padding: '16px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Заголовок и категория */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>{tip.icon}</span>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: colors.text,
            background: colors.bg,
            padding: '3px 12px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            {tip.category}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAuto(!isAuto);
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.2s'
            }}
            title={isAuto ? 'Пауза' : 'Авто'}
          >
            {isAuto ? '⏸' : '▶'}
          </button>
          <span>{currentIndex + 1}/{tips.length}</span>
        </div>
      </div>

      {/* Анимированный контент */}
      <div
        key={currentIndex}
        style={{
          // Анимация:
          // fallOut: старый совет уезжает вниз и исчезает
          // fallIn: новый совет приезжает сверху и появляется
          // idle: стабильное состояние
          transform:
            animPhase === 'fallOut' ? 'translateY(30px)' :
            animPhase === 'fallIn' ? 'translateY(0)' :
            'translateY(0)',
          opacity:
            animPhase === 'fallOut' ? 0 :
            animPhase === 'fallIn' ? '1' as any :
            1,
          transition:
            animPhase === 'fallOut'
              ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease'
              : animPhase === 'fallIn'
              ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease 0.1s'
              : 'none',
          // Начальная позиция для fallIn: сверху
          ...(animPhase === 'fallIn' ? {
            animation: 'none' as const,
            // Используем небольшой хак с transform-origin для эффекта падения
          } : {}),
        }}
      >
        <h3 style={{
          fontSize: '17px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 6px 0',
          lineHeight: 1.3
        }}>
          {tip.title}
        </h3>

        <p style={{
          fontSize: '14.5px',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          margin: '0 0 10px 0'
        }}>
          {tip.description}
        </p>

        {tip.actionable && (
          <div style={{
            background: 'rgba(0,255,157,0.06)',
            borderLeft: '3px solid var(--accent)',
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '10px'
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

        {tip.berkleeTip && (
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '10px',
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

      {/* Прогресс-бар (отображается при авто) */}
      {isAuto && animPhase === 'idle' && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: 'var(--accent)',
          borderRadius: '0 0 0 12px',
          width: '0%',
          animation: `tipProgress ${getRandomInterval()}ms linear forwards`
        }}>
          <style>{`
            @keyframes tipProgress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AnimatedTipBlock;


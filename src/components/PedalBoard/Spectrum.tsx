import React, { useRef, useEffect } from 'react';

interface SpectrumProps {
  getData: () => Float32Array;
  mode?: 'fft' | 'waveform';
  width?: number;
  height?: number;
}

export const Spectrum: React.FC<SpectrumProps> = ({
  getData,
  mode = 'fft',
  width = 600,
  height = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const values = getData();
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      if (mode === 'fft') {
        // Спектр — зелёные столбики
        const barWidth = width / values.length;
        ctx.fillStyle = '#4ade80';
        for (let i = 0; i < values.length; i++) {
          const db = values[i] as number;
          const h = Math.max(0, (db + 140) / 140) * height;
          ctx.fillRect(i * barWidth, height - h, barWidth - 0.5, h);
        }
      } else {
        // Волна — линия по центру
        ctx.beginPath();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        for (let i = 0; i < values.length; i++) {
          const x = (i / values.length) * width;
          const y = (1 - (values[i] as number + 1) / 2) * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [getData, mode, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        borderRadius: 4,
        border: '1px solid #222',
        width: '100%',
        maxWidth: width,
      }}
    />
  );
};
import React, { useRef, useEffect, useState, useCallback } from 'react';

const GRID_W = 60;
const GRID_H = 40;
const CELL = 8;
const CANVAS_W = GRID_W * CELL;
const CANVAS_H = GRID_H * CELL;

interface Particle {
  x: number;
  y: number;
  color: string;
  type: 'sand' | 'water' | 'wood';
  life: number;
}

const COLORS = {
  sand: ['#e8c170', '#d4a857', '#c4963e'],
  water: ['#3b82f6', '#60a5fa', '#93c5fd'],
  wood: '#8B4513',
};

const SandboxGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedType, setSelectedType] = useState<'sand' | 'water' | 'wood'>('sand');
  const particlesRef = useRef<Particle[]>(particles);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const selectedRef = useRef(selectedType);
  const gridRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => { particlesRef.current = particles; }, [particles]);
  useEffect(() => { selectedRef.current = selectedType; }, [selectedType]);

  const resetGame = useCallback(() => {
    setParticles([]);
    particlesRef.current = [];
    gridRef.current = new Map();
  }, []);

  const addParticle = useCallback((x: number, y: number) => {
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return;

    const key = `${gx},${gy}`;
    if (gridRef.current.has(key)) return;
    gridRef.current.set(key, true);

    const type = selectedRef.current;
    const colors = COLORS[type];
    const color = type === 'wood' ? colors as string : (colors as string[])[Math.floor(Math.random() * (colors as string[]).length)];

    const newParticle: Particle = {
      x: gx,
      y: gy,
      color: color as string,
      type,
      life: 100,
    };

    setParticles(prev => [...prev, newParticle]);
  }, []);

  // Physics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const current = particlesRef.current;
      if (current.length === 0) return;

      const newGrid = new Map<string, boolean>();
      const updated: Particle[] = current.map(p => {
        const key = `${p.x},${p.y}`;
        newGrid.set(key, true);
        return { ...p };
      });

      // Sort bottom-up
      updated.sort((a, b) => b.y - a.y);

      for (let i = 0; i < updated.length; i++) {
        const p = updated[i];
        if (p.type === 'wood') continue;

        if (p.type === 'sand') {
          const bKey = `${p.x},${p.y + 1}`;
          const blKey = `${p.x - 1},${p.y + 1}`;
          const brKey = `${p.x + 1},${p.y + 1}`;

          if (p.y + 1 < GRID_H && !newGrid.has(bKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.y++;
            newGrid.set(`${p.x},${p.y}`, true);
          } else if (p.y + 1 < GRID_H && p.x - 1 >= 0 && !newGrid.has(blKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.x--; p.y++;
            newGrid.set(`${p.x},${p.y}`, true);
          } else if (p.y + 1 < GRID_H && p.x + 1 < GRID_W && !newGrid.has(brKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.x++; p.y++;
            newGrid.set(`${p.x},${p.y}`, true);
          }
        } else if (p.type === 'water') {
          const bKey = `${p.x},${p.y + 1}`;
          const lKey = `${p.x - 1},${p.y}`;
          const rKey = `${p.x + 1},${p.y}`;
          const blKey = `${p.x - 1},${p.y + 1}`;
          const brKey = `${p.x + 1},${p.y + 1}`;

          if (p.y + 1 < GRID_H && !newGrid.has(bKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.y++;
            newGrid.set(`${p.x},${p.y}`, true);
          } else if (p.x - 1 >= 0 && !newGrid.has(lKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.x--;
            newGrid.set(`${p.x},${p.y}`, true);
          } else if (p.x + 1 < GRID_W && !newGrid.has(rKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.x++;
            newGrid.set(`${p.x},${p.y}`, true);
          } else if (p.y + 1 < GRID_H && p.x - 1 >= 0 && !newGrid.has(blKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.x--; p.y++;
            newGrid.set(`${p.x},${p.y}`, true);
          } else if (p.y + 1 < GRID_H && p.x + 1 < GRID_W && !newGrid.has(brKey)) {
            newGrid.delete(`${p.x},${p.y}`);
            p.x++; p.y++;
            newGrid.set(`${p.x},${p.y}`, true);
          }
        }
      }

      gridRef.current = newGrid;
      setParticles(updated);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseRef.current.down = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    addParticle(mx, my);
  }, [addParticle]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseRef.current.down) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Add particles with spacing
    for (let i = 0; i < 3; i++) {
      addParticle(mx + (Math.random() - 0.5) * 20, my + (Math.random() - 0.5) * 20);
    }
  }, [addParticle]);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.down = false;
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x * CELL, p.y * CELL, CELL, CELL);
    });
  }, [particles]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {(['sand', 'water', 'wood'] as const).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              background: selectedType === type ? 'var(--accent)' : 'var(--bg-panel)',
              color: selectedType === type ? '#000' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '6px 14px',
              borderRadius: 6,
              fontWeight: 'bold',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'monospace',
              textTransform: 'capitalize',
            }}
          >
            {type === 'sand' && '🏖️ '}{type === 'water' && '💧 '}{type === 'wood' && '🪵 '}{type}
          </button>
        ))}
        <button
          onClick={resetGame}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            padding: '6px 14px',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          🗑️ Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          maxWidth: '100%',
          height: 'auto',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      />
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        Click & drag to place particles. Sand falls — Water flows — Wood is solid
      </div>
    </div>
  );
};

export default SandboxGame;


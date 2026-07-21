import React, { useRef, useEffect, useState, useCallback } from 'react';

const GRID_SIZE = 4;
const CELL_SIZE = 80;
const GAP = 8;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * GAP;

const TILE_COLORS: Record<number, string> = {
  2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
  32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
  512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
};

const TILE_TEXT_COLORS: Record<number, string> = {
  2: '#776e65', 4: '#776e65', 8: '#f9f6f2', 16: '#f9f6f2',
  32: '#f9f6f2', 64: '#f9f6f2', 128: '#f9f6f2', 256: '#f9f6f2',
  512: '#f9f6f2', 1024: '#f9f6f2', 2048: '#f9f6f2',
};

const createEmptyGrid = (): number[][] =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const addRandomTile = (grid: number[][]): number[][] => {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);

  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

const slideRow = (row: number[]): { result: number[]; score: number } => {
  const filtered = row.filter(v => v !== 0);
  const result: number[] = [];
  let score = 0;
  let i = 0;

  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      result.push(filtered[i] * 2);
      score += filtered[i] * 2;
      i += 2;
    } else {
      result.push(filtered[i]);
      i++;
    }
  }

  while (result.length < GRID_SIZE) result.push(0);
  return { result, score };
};

const Puzzle2048Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>(() => addRandomTile(addRandomTile(createEmptyGrid())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const gridRef = useRef<number[][]>(grid);
  const scoreRef = useRef(0);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const move = useCallback((direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
    if (gameOver || won) return;

    let newGrid = gridRef.current.map(row => [...row]);
    let totalScore = 0;
    let moved = false;

    const processRow = (row: number[]): number[] => {
      if (direction === 'RIGHT') row = [...row].reverse();
      const { result, score: s } = slideRow(row);
      totalScore += s;
      const final = direction === 'RIGHT' ? result.reverse() : result;
      if (final.join(',') !== row.join(',')) moved = true;
      return final;
    };

    if (direction === 'LEFT' || direction === 'RIGHT') {
      newGrid = newGrid.map(row => processRow(row));
    } else {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = newGrid.map(row => row[c]);
        const processed = processRow(col);
        for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = processed[r];
      }
    }

    if (moved) {
      newGrid = addRandomTile(newGrid);
      const newScore = scoreRef.current + totalScore;
      setScore(newScore);
      if (newScore > best) { setBest(newScore); }

      // Check win
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          if (newGrid[r][c] === 2048) { setWon(true); }

      // Check game over
      const hasEmpty = newGrid.some(row => row.some(v => v === 0));
      if (!hasEmpty) {
        let canMerge = false;
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE; c++) {
            if (c < GRID_SIZE - 1 && newGrid[r][c] === newGrid[r][c + 1]) canMerge = true;
            if (r < GRID_SIZE - 1 && newGrid[r][c] === newGrid[r + 1][c]) canMerge = true;
          }
        if (!canMerge) setGameOver(true);
      }

      setGrid(newGrid);
      gridRef.current = newGrid;
    }
  }, [gameOver, won, best]);

  const newGame = useCallback(() => {
    const g = addRandomTile(addRandomTile(createEmptyGrid()));
    setGrid(g); gridRef.current = g;
    setScore(0); scoreRef.current = 0;
    setGameOver(false); setWon(false);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const keyDir: Record<string, 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'> = {
        ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', ArrowUp: 'UP', ArrowDown: 'DOWN',
      };
      const dir = keyDir[e.key];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid background
    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, 8);
    ctx.fill();

    // Empty cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = c * (CELL_SIZE + GAP) + GAP;
        const y = r * (CELL_SIZE + GAP) + GAP;
        ctx.fillStyle = '#1f1f3a';
        ctx.beginPath();
        ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 4);
        ctx.fill();
      }
    }

    // Tiles
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        const x = c * (CELL_SIZE + GAP) + GAP;
        const y = r * (CELL_SIZE + GAP) + GAP;

        ctx.fillStyle = TILE_COLORS[val] || '#edc22e';
        ctx.shadowColor = 'rgba(255,255,255,0.1)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = TILE_TEXT_COLORS[val] || '#f9f6f2';
        ctx.font = `bold ${val >= 1024 ? 20 : val >= 100 ? 24 : 28}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${val}`, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText('Click "New Game" to restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 24);
    }

    if (won && !gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN! 🎉', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }
  }, [grid, gameOver, won]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12, fontFamily: 'monospace', fontSize: 14 }}>
        <div style={{ background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>SCORE</div>
          <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: 18 }}>{score}</div>
        </div>
        <div style={{ background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>BEST</div>
          <div style={{ color: 'var(--accent-blue)', fontWeight: 'bold', fontSize: 18 }}>{best}</div>
        </div>
        <button
          onClick={newGame}
          style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            padding: '8px 20px',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          NEW GAME
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        ← → ↑ ↓ Arrow Keys — Move tiles
      </div>
    </div>
  );
};

export default Puzzle2048Game;


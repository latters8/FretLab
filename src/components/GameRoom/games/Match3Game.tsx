import React, { useRef, useEffect, useState, useCallback } from 'react';

const GRID = 8;
const CELL = 44;
const CANVAS_W = GRID * CELL;
const CANVAS_H = GRID * CELL;

const GEM_COLORS = ['#e94560', '#00FF9D', '#f9a825', '#45f3ff', '#a855f7', '#f97316'];
const GEM_SYMBOLS = ['♦', '●', '★', '■', '▲', '♥'];

interface Gem {
  color: string;
  symbol: string;
  row: number;
  col: number;
}

type Grid = (Gem | null)[][];

const createGem = (row: number, col: number, forceIdx?: number): Gem => {
  const idx = forceIdx !== undefined ? forceIdx : Math.floor(Math.random() * GEM_COLORS.length);
  return { color: GEM_COLORS[idx], symbol: GEM_SYMBOLS[idx], row, col };
};

const createGrid = (): Grid => {
  const grid: Grid = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      let gem = createGem(r, c);
      // Prevent initial matches
      while (
        (r >= 2 && grid[r-1][c]?.color === gem.color && grid[r-2][c]?.color === gem.color) ||
        (c >= 2 && grid[r][c-1]?.color === gem.color && grid[r][c-2]?.color === gem.color)
      ) {
        gem = createGem(r, c);
      }
      grid[r][c] = gem;
    }
  }
  return grid;
};

const findMatches = (grid: Grid): Set<string> => {
  const matches = new Set<string>();
  // Horizontal
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID - 2; c++) {
      const g = grid[r][c];
      if (!g) continue;
      if (grid[r][c+1]?.color === g.color && grid[r][c+2]?.color === g.color) {
        matches.add(`${r},${c}`);
        matches.add(`${r},${c+1}`);
        matches.add(`${r},${c+2}`);
      }
    }
  }
  // Vertical
  for (let r = 0; r < GRID - 2; r++) {
    for (let c = 0; c < GRID; c++) {
      const g = grid[r][c];
      if (!g) continue;
      if (grid[r+1][c]?.color === g.color && grid[r+2][c]?.color === g.color) {
        matches.add(`${r},${c}`);
        matches.add(`${r+1},${c}`);
        matches.add(`${r+2},${c}`);
      }
    }
  }
  return matches;
};

const removeMatches = (grid: Grid, matches: Set<string>): [Grid, number] => {
  const newGrid = grid.map(row => row.map(cell => cell ? { ...cell } : null));
  let count = 0;
  matches.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    newGrid[r][c] = null;
    count++;
  });
  return [newGrid, count];
};

const dropGems = (grid: Grid): Grid => {
  const newGrid = grid.map(row => row.map(cell => cell ? { ...cell } : null));
  for (let c = 0; c < GRID; c++) {
    let writeRow = GRID - 1;
    for (let r = GRID - 1; r >= 0; r--) {
      if (newGrid[r][c] !== null) {
        newGrid[writeRow][c] = newGrid[r][c]!;
        newGrid[writeRow][c]!.row = writeRow;
        if (writeRow !== r) newGrid[r][c] = null;
        writeRow--;
      }
    }
    // Fill empty
    for (let r = writeRow; r >= 0; r--) {
      newGrid[r][c] = createGem(r, c);
    }
  }
  return newGrid;
};

const Match3Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Grid>(createGrid());
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const gridRef = useRef<Grid>(grid);
  const scoreRef = useRef(0);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const processBoard = useCallback((g: Grid, addScore: number): Grid => {
    let currentGrid = g.map(row => row.map(c => c ? { ...c } : null));
    let totalScore = addScore;

    const process = (): Grid => {
      const matches = findMatches(currentGrid);
      if (matches.size === 0) return currentGrid;
      
      const pts = matches.size * 10;
      totalScore += pts;
      
      const [cleared] = removeMatches(currentGrid, matches);
      currentGrid = cleared;
      currentGrid = dropGems(currentGrid);
      
      // Recursively check for chain reactions
      return process();
    };

    const finalGrid = process();
    setScore(prev => prev + totalScore);
    return finalGrid;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (animating) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(mx / CELL);
    const row = Math.floor(my / CELL);
    if (row < 0 || row >= GRID || col < 0 || col >= GRID) return;

    if (!selected) {
      setSelected({ row, col });
      return;
    }

    // Check if adjacent
    const dr = Math.abs(row - selected.row);
    const dc = Math.abs(col - selected.col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      // Swap
      setAnimating(true);
      const g = gridRef.current.map(r => r.map(c => c ? { ...c } : null));
      
      // Swap
      const temp = g[row][col];
      g[row][col] = g[selected.row][selected.col];
      g[selected.row][selected.col] = temp;
      if (g[row][col]) { g[row][col]!.row = row; g[row][col]!.col = col; }
      if (g[selected.row][selected.col]) { g[selected.row][selected.col]!.row = selected.row; g[selected.row][selected.col]!.col = selected.col; }

      const matches = findMatches(g);
      if (matches.size > 0) {
        const processed = processBoard(g, 0);
        setGrid(processed);
        gridRef.current = processed;
      } else {
        // Swap back
        setGrid(gridRef.current);
      }
      
      setAnimating(false);
      setSelected(null);
    } else {
      setSelected({ row, col });
    }
  }, [selected, animating, processBoard]);

  const resetGame = useCallback(() => {
    const g = createGrid();
    setGrid(g);
    gridRef.current = g;
    setScore(0);
    scoreRef.current = 0;
    setSelected(null);
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid background
    ctx.fillStyle = '#111216';
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#111216' : '#15171e';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }

    // Grid lines
    ctx.strokeStyle = '#2a2d39';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(CANVAS_W, i * CELL);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, CANVAS_H);
      ctx.stroke();
    }

    // Gems
    const g = gridRef.current;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const gem = g[r][c];
        if (!gem) continue;
        const x = c * CELL + CELL / 2;
        const y = r * CELL + CELL / 2;
        const isSelected = selected && selected.row === r && selected.col === c;
        const radius = CELL / 2 - 4;

        // Glow for selected
        if (isSelected) {
          ctx.shadowColor = gem.color;
          ctx.shadowBlur = 20;
        }

        // Gem circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gem.color;
        ctx.fill();

        // Inner highlight
        const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, radius);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Symbol
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gem.symbol, x, y + 1);

        // Selection ring
        if (isSelected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }, [grid, selected]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12, fontFamily: 'monospace', fontSize: 14, alignItems: 'center' }}>
        <div style={{ background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>SCORE</div>
          <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: 20 }}>{score}</div>
        </div>
        <button
          onClick={resetGame}
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
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleClick}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          maxWidth: '100%',
          height: 'auto',
          cursor: 'pointer',
        }}
      />
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        Click two adjacent gems to swap them. Match 3+ in a row!
      </div>
    </div>
  );
};

export default Match3Game;


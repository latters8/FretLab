import React, { useRef, useEffect, useState, useCallback } from 'react';

const SIZE = 15;
const CELL = 24;
const CANVAS_W = SIZE * CELL;
const CANVAS_H = SIZE * CELL;

const generateMaze = (): string[][] => {
  // Initialize all walls
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill('wall'));

  // DFS maze generation
  const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]];
  const stack: [number, number][] = [];
  const startR = 1, startC = 1;
  grid[startR][startC] = 'path';
  stack.push([startR, startC]);

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const shuffled = [...dirs].sort(() => Math.random() - 0.5);
    let moved = false;

    for (const [dr, dc] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < SIZE - 1 && nc > 0 && nc < SIZE - 1 && grid[nr][nc] === 'wall') {
        grid[r + dr / 2][c + dc / 2] = 'path';
        grid[nr][nc] = 'path';
        stack.push([nr, nc]);
        moved = true;
        break;
      }
    }

    if (!moved) stack.pop();
  }

  // Set start and end
  grid[1][1] = 'start';
  grid[SIZE - 2][SIZE - 2] = 'end';

  return grid;
};

const MazeRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<string[][]>(generateMaze);
  const [playerPos, setPlayerPos] = useState({ r: 1, c: 1 });
  const [won, setWon] = useState(false);
  const mazeRef = useRef<string[][]>(maze);
  const playerRef = useRef({ r: 1, c: 1 });
  const wonRef = useRef(false);

  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { playerRef.current = playerPos; }, [playerPos]);
  useEffect(() => { wonRef.current = won; }, [won]);

  const resetGame = useCallback(() => {
    const m = generateMaze();
    setMaze(m);
    mazeRef.current = m;
    setPlayerPos({ r: 1, c: 1 });
    playerRef.current = { r: 1, c: 1 };
    setWon(false);
    wonRef.current = false;
  }, []);

  const movePlayer = useCallback((dr: number, dc: number) => {
    if (wonRef.current) return;
    const p = playerRef.current;
    const nr = p.r + dr;
    const nc = p.c + dc;
    const cell = mazeRef.current[nr]?.[nc];
    if (!cell || cell === 'wall') return;

    const newPos = { r: nr, c: nc };
    setPlayerPos(newPos);
    playerRef.current = newPos;

    if (cell === 'end') {
      setWon(true);
      wonRef.current = true;
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer(1, 0); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer(0, 1); break;
        case 'r': case 'R': resetGame(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movePlayer, resetGame]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const cell = maze[r][c];

        if (cell === 'wall') {
          ctx.fillStyle = '#2a2d39';
          ctx.fillRect(x, y, CELL, CELL);
        } else if (cell === 'path') {
          ctx.fillStyle = '#111216';
          ctx.fillRect(x, y, CELL, CELL);
        } else if (cell === 'end') {
          ctx.fillStyle = '#111216';
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = '#00FF9D';
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#00FF9D';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏁', x + CELL / 2, y + CELL / 2);
        } else if (cell === 'start') {
          ctx.fillStyle = '#111216';
          ctx.fillRect(x, y, CELL, CELL);
        }
      }
    }

    // Player
    const px = playerPos.c * CELL + CELL / 2;
    const py = playerPos.r * CELL + CELL / 2;
    ctx.shadowColor = '#45f3ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#45f3ff';
    ctx.beginPath();
    ctx.arc(px, py, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Win overlay
    if (won) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText('Press R to restart', CANVAS_W / 2, CANVAS_H / 2 + 24);
    }
  }, [maze, playerPos, won]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
        <span>↑ ↓ ← → / WASD — Move</span>
        <span>R — New Maze</span>
        <span>🏁 Reach green flag to win!</span>
      </div>
    </div>
  );
};

export default MazeRunnerGame;


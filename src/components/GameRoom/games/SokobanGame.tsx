import React, { useRef, useEffect, useState, useCallback } from 'react';

const COLS = 8;
const ROWS = 8;
const CELL = 44;
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;

type CellType = 'wall' | 'floor' | 'target' | 'player' | 'box' | 'boxOnTarget' | 'playerOnTarget';

const LEVELS: string[][][] = [
  // Level 1
  [
    ['wall','wall','wall','wall','wall','wall','wall','wall'],
    ['wall','floor','floor','floor','floor','floor','floor','wall'],
    ['wall','floor','box','floor','floor','target','floor','wall'],
    ['wall','floor','floor','player','floor','floor','floor','wall'],
    ['wall','floor','floor','floor','box','floor','floor','wall'],
    ['wall','floor','target','floor','floor','floor','floor','wall'],
    ['wall','floor','floor','floor','floor','floor','floor','wall'],
    ['wall','wall','wall','wall','wall','wall','wall','wall'],
  ],
];

interface GameState {
  grid: CellType[][];
  playerPos: { r: number; c: number };
  moves: number;
}

const parseLevel = (level: string[][]): GameState => {
  const grid: CellType[][] = level.map(row => [...row] as CellType[]);
  let playerPos = { r: 0, c: 0 };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === 'player') {
        playerPos = { r, c };
      } else if (grid[r][c] === 'playerOnTarget') {
        playerPos = { r, c };
      }
    }
  }

  return { grid, playerPos, moves: 0 };
};

const checkWin = (grid: CellType[][]): boolean => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === 'box') return false;
    }
  }
  return true;
};

const SokobanGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level] = useState(0);
  const [gameState, setGameState] = useState<GameState>(() => parseLevel(LEVELS[0]));
  const [won, setWon] = useState(false);
  const gameStateRef = useRef(gameState);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const resetGame = useCallback(() => {
    const gs = parseLevel(LEVELS[level]);
    setGameState(gs);
    gameStateRef.current = gs;
    setWon(false);
  }, [level]);

  const movePlayer = useCallback((dr: number, dc: number) => {
    const gs = gameStateRef.current;
    if (won) return;

    const { grid, playerPos } = gs;
    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    const targetCell = grid[nr][nc];

    if (targetCell === 'wall') return;

    if (targetCell === 'box' || targetCell === 'boxOnTarget') {
      // Try to push box
      const nnr = nr + dr;
      const nnc = nc + dc;
      if (nnr < 0 || nnr >= ROWS || nnc < 0 || nnc >= COLS) return;
      const beyondCell = grid[nnr][nnc];
      if (beyondCell === 'wall' || beyondCell === 'box' || beyondCell === 'boxOnTarget') return;

      // Push box
      const newGrid = grid.map(row => [...row]) as CellType[][];
      newGrid[nr][nc] = newGrid[nr][nc] === 'boxOnTarget' ? 'target' : 'floor';
      newGrid[nnr][nnc] = beyondCell === 'target' ? 'boxOnTarget' : 'box';

      // Move player
      const wasOnTarget = newGrid[playerPos.r][playerPos.c] === 'playerOnTarget' || grid[playerPos.r][playerPos.c] === 'playerOnTarget';
      newGrid[playerPos.r][playerPos.c] = wasOnTarget ? 'target' : 'floor';
      newGrid[nr][nc] = grid[nr][nc] === 'boxOnTarget' ? 'playerOnTarget' : 'player';

      const newState: GameState = {
        grid: newGrid,
        playerPos: { r: nr, c: nc },
        moves: gs.moves + 1,
      };

      setGameState(newState);
      gameStateRef.current = newState;

      if (checkWin(newGrid)) {
        setWon(true);
      }
    } else if (targetCell === 'floor' || targetCell === 'target') {
      const newGrid = grid.map(row => [...row]) as CellType[][];
      const wasOnTarget = grid[playerPos.r][playerPos.c] === 'playerOnTarget';
      newGrid[playerPos.r][playerPos.c] = wasOnTarget ? 'target' : 'floor';
      newGrid[nr][nc] = targetCell === 'target' ? 'playerOnTarget' : 'player';

      const newState: GameState = {
        grid: newGrid,
        playerPos: { r: nr, c: nc },
        moves: gs.moves + 1,
      };

      setGameState(newState);
      gameStateRef.current = newState;
    }
  }, [won]);

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

    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const { grid } = gameState;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const cell = grid[r][c];

        switch (cell) {
          case 'wall':
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(x, y, CELL, CELL);
            ctx.strokeStyle = '#4e342e';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, CELL, CELL);
            break;
          case 'floor':
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(x, y, CELL, CELL);
            break;
          case 'target':
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(x, y, CELL, CELL);
            ctx.fillStyle = '#f9a825';
            ctx.beginPath();
            ctx.arc(x + CELL / 2, y + CELL / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f9a825';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + CELL / 2, y + CELL / 2, 10, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'player':
          case 'playerOnTarget':
            ctx.fillStyle = cell === 'playerOnTarget' ? '#8d6e63' : '#8d6e63';
            ctx.fillRect(x, y, CELL, CELL);
            if (cell === 'playerOnTarget') {
              ctx.fillStyle = '#f9a825';
              ctx.beginPath();
              ctx.arc(x + CELL / 2, y + CELL / 2, 6, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#00FF9D';
            ctx.shadowColor = '#00FF9D';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x + CELL / 2, y + CELL / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('😊', x + CELL / 2, y + CELL / 2 + 1);
            break;
          case 'box':
          case 'boxOnTarget':
            ctx.fillStyle = cell === 'boxOnTarget' ? '#4e342e' : '#8d6e63';
            ctx.fillRect(x, y, CELL, CELL);
            if (cell === 'boxOnTarget') {
              ctx.fillStyle = '#f9a825';
              ctx.beginPath();
              ctx.arc(x + CELL / 2, y + CELL / 2, 6, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 6, y + 6, CELL - 12, CELL - 12);
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 6, y + 6, CELL - 12, CELL - 12);
            // Cross
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 6);
            ctx.lineTo(x + CELL - 6, y + CELL - 6);
            ctx.moveTo(x + CELL - 6, y + 6);
            ctx.lineTo(x + 6, y + CELL - 6);
            ctx.stroke();
            break;
        }
      }
    }

    // Moves counter
    ctx.fillStyle = '#a0a5b5';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Moves: ${gameState.moves}`, 10, 18);

    // Level indicator
    ctx.textAlign = 'right';
    ctx.fillText(`Level ${level + 1}`, CANVAS_W - 10, 18);

    if (won) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 LEVEL COMPLETE!', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText(`Moves: ${gameState.moves}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
      ctx.fillText('Press R to replay', CANVAS_W / 2, CANVAS_H / 2 + 44);
    }
  }, [gameState, won, level]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 8, fontFamily: 'monospace', fontSize: 12, alignItems: 'center' }}>
        <button onClick={resetGame} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '4px 12px', borderRadius: 6, fontWeight: 'bold', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>↺ RESET</button>
      </div>
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
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span>← → ↑ ↓ / WASD — Move</span>
        <span>R — Reset</span>
        <span>Push all boxes onto targets 🎯</span>
      </div>
    </div>
  );
};

export default SokobanGame;


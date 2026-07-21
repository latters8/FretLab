import React, { useRef, useEffect, useState, useCallback } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 26;
const CANVAS_W = COLS * BLOCK_SIZE;
const CANVAS_H = ROWS * BLOCK_SIZE;

const SHAPES: number[][][] = [
  // I
  [
    [1,1,1,1]
  ],
  // O
  [
    [1,1],
    [1,1]
  ],
  // T
  [
    [0,1,0],
    [1,1,1]
  ],
  // S
  [
    [0,1,1],
    [1,1,0]
  ],
  // Z
  [
    [1,1,0],
    [0,1,1]
  ],
  // L
  [
    [1,0,0],
    [1,1,1]
  ],
  // J
  [
    [0,0,1],
    [1,1,1]
  ],
];

const COLORS = [
  '', '#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#f0a000', '#0000f0'
];

interface Piece {
  shape: number[][];
  color: number;
  x: number;
  y: number;
}

const randomPiece = (): Piece => {
  const idx = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[idx].map(r => [...r]);
  return {
    shape,
    color: idx + 1,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  };
};

const rotateMatrix = (matrix: number[][]): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
};

const TetrisGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<number[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [piece, setPiece] = useState<Piece>(randomPiece());
  const [nextPiece, setNextPiece] = useState<Piece>(randomPiece());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const boardRef = useRef<number[][]>(board);
  const pieceRef = useRef<Piece>(piece);
  const nextRef = useRef<Piece>(nextPiece);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { pieceRef.current = piece; }, [piece]);
  useEffect(() => { nextRef.current = nextPiece; }, [nextPiece]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const collision = useCallback((b: number[][], p: Piece, dx = 0, dy = 0, shape?: number[][]) => {
    const s = shape || p.shape;
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        const nx = p.x + c + dx;
        const ny = p.y + r + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && b[ny][nx] !== 0) return true;
      }
    }
    return false;
  }, []);

  const lockPiece = useCallback((b: number[][], p: Piece): number[][] => {
    const newBoard = b.map(row => [...row]);
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        const ny = p.y + r;
        if (ny >= 0) {
          newBoard[ny][p.x + c] = p.color;
        }
      }
    }

    // Clear lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r].every(v => v !== 0)) {
        newBoard.splice(r, 1);
        newBoard.unshift(Array(COLS).fill(0));
        cleared++;
        r++; // re-check same row
      }
    }

    if (cleared > 0) {
      const pts = [0, 100, 300, 500, 800];
      const newScore = scoreRef.current + (pts[cleared] || 0) * levelRef.current;
      setScore(newScore);
      const newLevel = Math.floor(newScore / 1000) + 1;
      if (newLevel !== levelRef.current) setLevel(newLevel);
    }

    return newBoard;
  }, []);

  const spawnNew = useCallback((b: number[][]) => {
    const newPiece = nextRef.current;
    const freshPiece: Piece = {
      shape: newPiece.shape.map(r => [...r]),
      color: newPiece.color,
      x: Math.floor((COLS - newPiece.shape[0].length) / 2),
      y: 0,
    };

    if (collision(b, freshPiece)) {
      setGameOver(true);
      gameOverRef.current = true;
    }

    setPiece(freshPiece);
    pieceRef.current = freshPiece;
    setNextPiece(randomPiece());
  }, [collision]);

  const moveDown = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!collision(b, p, 0, 1)) {
      const moved = { ...p, y: p.y + 1 };
      setPiece(moved);
      pieceRef.current = moved;
    } else {
      const newBoard = lockPiece(b, p);
      setBoard(newBoard);
      boardRef.current = newBoard;
      spawnNew(newBoard);
    }
  }, [collision, lockPiece, spawnNew]);

  const moveHorizontal = useCallback((dir: number) => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    const b = boardRef.current;
    if (!collision(b, p, dir, 0)) {
      const moved = { ...p, x: p.x + dir };
      setPiece(moved);
      pieceRef.current = moved;
    }
  }, [collision]);

  const rotate = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    const b = boardRef.current;
    const rotated = rotateMatrix(p.shape);
    if (!collision(b, p, 0, 0, rotated)) {
      const moved = { ...p, shape: rotated };
      setPiece(moved);
      pieceRef.current = moved;
    }
  }, [collision]);

  const hardDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    const b = boardRef.current;
    let dropDist = 0;
    while (!collision(b, { ...p, y: p.y + dropDist + 1 }, 0, 0)) {
      dropDist++;
    }
    const dropped = { ...p, y: p.y + dropDist };
    setPiece(dropped);
    pieceRef.current = dropped;
    // Immediately lock
    const newBoard = lockPiece(b, dropped);
    setBoard(newBoard);
    boardRef.current = newBoard;
    spawnNew(newBoard);
  }, [collision, lockPiece, spawnNew]);

  const resetGame = useCallback(() => {
    const b = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    setBoard(b);
    boardRef.current = b;
    const np = randomPiece();
    setNextPiece(np);
    nextRef.current = np;
    const p = randomPiece();
    setPiece(p);
    pieceRef.current = p;
    setScore(0);
    scoreRef.current = 0;
    setLevel(1);
    levelRef.current = 1;
    setGameOver(false);
    gameOverRef.current = false;
    setPaused(false);
    pausedRef.current = false;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); moveHorizontal(-1); break;
        case 'ArrowRight': e.preventDefault(); moveHorizontal(1); break;
        case 'ArrowDown': e.preventDefault(); moveDown(); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
        case 'p': case 'P': e.preventDefault(); setPaused(p => { pausedRef.current = !p; return !p; }); break;
        case 'r': case 'R': resetGame(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [moveHorizontal, moveDown, rotate, hardDrop, resetGame]);

  useEffect(() => {
    const speed = Math.max(50, 500 - (level - 1) * 30);
    const interval = setInterval(moveDown, speed);
    return () => clearInterval(interval);
  }, [moveDown, level]);

  // Render next piece mini canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Board
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(CANVAS_W, r * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, CANVAS_H);
      ctx.stroke();
    }

    // Board blocks
    const b = boardRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = b[r][c];
        if (!val) continue;
        ctx.fillStyle = COLORS[val] || '#fff';
        ctx.shadowColor = 'rgba(255,255,255,0.1)';
        ctx.shadowBlur = 4;
        ctx.fillRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        ctx.shadowBlur = 0;
      }
    }

    // Ghost piece
    const p = pieceRef.current;
    if (p && !gameOverRef.current) {
      let ghostY = p.y;
      while (!collision(boardRef.current, { ...p, y: ghostY + 1 }, 0, 0)) {
        ghostY++;
      }
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (!p.shape[r][c]) continue;
          const x = (p.x + c) * BLOCK_SIZE + 1;
          const y = (ghostY + r) * BLOCK_SIZE + 1;
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        }
      }

      // Current piece
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (!p.shape[r][c]) continue;
          const x = (p.x + c) * BLOCK_SIZE + 1;
          const y = (p.y + r) * BLOCK_SIZE + 1;
          ctx.fillStyle = COLORS[p.color] || '#fff';
          ctx.shadowColor = 'rgba(255,255,255,0.2)';
          ctx.shadowBlur = 6;
          ctx.fillRect(x, y, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Game over overlay
    if (gameOverRef.current) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 12);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
      ctx.fillText('Press R to restart', CANVAS_W / 2, CANVAS_H / 2 + 44);
    }

    if (pausedRef.current && !gameOverRef.current) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '12px monospace';
      ctx.fillText('Press P to resume', CANVAS_W / 2, CANVAS_H / 2 + 28);
    }
  }, [board, piece, gameOver, paused, collision]);

  // Render next piece
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = nextCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const size = 22;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, 120, 120);

    const np = nextRef.current;
    if (!np) return;
    const shape = np.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    const ox = (120 - cols * size) / 2;
    const oy = (120 - rows * size) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!shape[r][c]) continue;
        ctx.fillStyle = COLORS[np.color] || '#fff';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255,255,255,0.15)';
        ctx.fillRect(ox + c * size + 1, oy + r * size + 1, size - 2, size - 2);
        ctx.shadowBlur = 0;
      }
    }
  }, [nextPiece]);

  return (
    <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div>
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
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>← → Move</span>
          <span>↑ Rotate</span>
          <span>↓ Soft drop</span>
          <span>Space — Hard drop</span>
          <span>P — Pause</span>
          <span>R — Restart</span>
        </div>
      </div>
      <div style={{ textAlign: 'left', minWidth: 120 }}>
        <div style={{ background: 'var(--bg-panel)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>NEXT</div>
          <canvas ref={nextCanvasRef} width={120} height={120} style={{ display: 'block', marginTop: 8, borderRadius: 4 }} />
        </div>
        <div style={{ background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>SCORE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', fontFamily: 'monospace' }}>{score}</div>
        </div>
        <div style={{ background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>LEVEL</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{level}</div>
        </div>
        <button
          onClick={resetGame}
          style={{
            marginTop: 12,
            width: '100%',
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          NEW GAME
        </button>
      </div>
    </div>
  );
};

export default TetrisGame;


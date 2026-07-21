import React, { useRef, useEffect, useState, useCallback } from 'react';

const COLS = 9;
const ROWS = 9;
const CELL_SIZE = 32;
const CANVAS_W = COLS * CELL_SIZE;
const CANVAS_H = ROWS * CELL_SIZE;
const MINE_COUNT = 10;

interface Cell {
  isMine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

const createBoard = (firstRow: number, firstCol: number): Cell[][] => {
  const board: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  );

  // Place mines (avoid first click position)
  let placed = 0;
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (board[r][c].isMine) continue;
    if (Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1) continue;
    board[r][c].isMine = true;
    placed++;
  }

  // Calculate adjacent numbers
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
            count++;
          }
        }
      }
      board[r][c].adjacent = count;
    }
  }

  return board;
};

const revealCell = (board: Cell[][], r: number, c: number): Cell[][] => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  const stack = [[r, c]];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    const cell = newBoard[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          stack.push([cr + dr, cc + dc]);
        }
      }
    }
  }
  
  return newBoard;
};

const checkWin = (board: Cell[][]): boolean => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (!cell.isMine && !cell.revealed) return false;
    }
  }
  return true;
};

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000ff', 2: '#008000', 3: '#ff0000', 4: '#000080',
  5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080',
};

const MinesweeperGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Cell[][] | null>(null);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'ready'>('ready');
  const [flagCount, setFlagCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const boardRef = useRef<Cell[][] | null>(board);
  const statusRef = useRef<string>(status);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const resetGame = useCallback(() => {
    setBoard(null);
    setStatus('ready');
    setFlagCount(0);
    setGameStarted(false);
  }, []);

  const handleCellClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(mx / CELL_SIZE);
    const row = Math.floor(my / CELL_SIZE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    if (!gameStarted) {
      // First click — create board
      const newBoard = createBoard(row, col);
      const revealed = revealCell(newBoard, row, col);
      setBoard(revealed);
      boardRef.current = revealed;
      setGameStarted(true);
      setStatus('playing');
      statusRef.current = 'playing';
      if (checkWin(revealed)) {
        setStatus('won');
        statusRef.current = 'won';
      }
      return;
    }

    const b = boardRef.current;
    if (!b) return;
    const cell = b[row][col];
    if (cell.revealed || cell.flagged) return;

    if (cell.isMine) {
      // Reveal all mines
      const newBoard = b.map(r => r.map(c => ({ ...c, revealed: c.isMine ? true : c.revealed })));
      setBoard(newBoard);
      boardRef.current = newBoard;
      setStatus('lost');
      statusRef.current = 'lost';
      return;
    }

    const revealed = revealCell(b, row, col);
    setBoard(revealed);
    boardRef.current = revealed;
    if (checkWin(revealed)) {
      setStatus('won');
      statusRef.current = 'won';
    }
  }, [gameStarted]);

  const handleRightClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!gameStarted || statusRef.current === 'won' || statusRef.current === 'lost') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(mx / CELL_SIZE);
    const row = Math.floor(my / CELL_SIZE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    const b = boardRef.current;
    if (!b || b[row][col].revealed) return;
    const newBoard = b.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);
    boardRef.current = newBoard;
    setFlagCount(prev => newBoard[row][col].flagged ? prev + 1 : prev - 1);
  }, [gameStarted]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const b = boardRef.current;

    // Background
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(CANVAS_W, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, CANVAS_H);
      ctx.stroke();
    }

    if (!b) {
      // Ready state — show empty board
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = '#b0b0b0';
          ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Click to start', CANVAS_W / 2, CANVAS_H / 2 + 5);
      return;
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = b[r][c];
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;

        if (cell.revealed) {
          ctx.fillStyle = '#e0e0e0';
          ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

          if (cell.isMine) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
          } else if (cell.adjacent > 0) {
            ctx.fillStyle = NUMBER_COLORS[cell.adjacent] || '#000';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${cell.adjacent}`, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
          }
        } else {
          ctx.fillStyle = '#b0b0b0';
          ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          
          // 3D bevel effect
          ctx.strokeStyle = '#dfdfdf';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 1, y + CELL_SIZE - 1);
          ctx.lineTo(x + 1, y + 1);
          ctx.lineTo(x + CELL_SIZE - 1, y + 1);
          ctx.stroke();
          ctx.strokeStyle = '#808080';
          ctx.beginPath();
          ctx.moveTo(x + 1, y + CELL_SIZE - 1);
          ctx.lineTo(x + CELL_SIZE - 1, y + CELL_SIZE - 1);
          ctx.lineTo(x + CELL_SIZE - 1, y + 1);
          ctx.stroke();

          if (cell.flagged) {
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚩', x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
          }
        }
      }
    }

    // Status overlay
    if (status === 'lost') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, CANVAS_H / 2 - 30, CANVAS_W, 60);
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💥 GAME OVER', CANVAS_W / 2, CANVAS_H / 2 + 7);
    } else if (status === 'won') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, CANVAS_H / 2 - 30, CANVAS_W, 60);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🎉 YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 + 7);
    }
  }, [board, status, gameStarted]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12, fontFamily: 'monospace', fontSize: 14, alignItems: 'center' }}>
        <div style={{ background: 'var(--bg-panel)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>🚩 </span>
          <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: 16 }}>{MINE_COUNT - flagCount}</span>
        </div>
        <div style={{ 
          fontSize: 20, 
          cursor: 'pointer',
          background: status === 'lost' ? '#e94560' : status === 'won' ? '#00FF9D' : 'var(--bg-panel)',
          padding: '4px 12px',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
        }} onClick={resetGame}>
          {status === 'lost' ? '😵' : status === 'won' ? '😎' : '🙂'}
        </div>
        <button
          onClick={resetGame}
          style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            padding: '6px 16px',
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
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCellClick}
        onContextMenu={handleRightClick}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          maxWidth: '100%',
          height: 'auto',
          cursor: 'pointer',
        }}
      />
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span>Left Click — Reveal</span>
        <span>Right Click — Flag 🚩</span>
        <span>R — Restart</span>
      </div>
    </div>
  );
};

export default MinesweeperGame;


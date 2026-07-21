import React, { useRef, useEffect, useState, useCallback } from 'react';

const CELL = 40;
const BOARD_SIZE = 9;
const CANVAS_W = CELL * BOARD_SIZE;
const CANVAS_H = CELL * BOARD_SIZE;

const generateSudoku = (): number[][] => {
  // Simple backtracking sudoku generator
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  const isValid = (brd: number[][], row: number, col: number, num: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (brd[row][i] === num) return false;
      if (brd[i][col] === num) return false;
    }
    const boxR = Math.floor(row / 3) * 3;
    const boxC = Math.floor(col / 3) * 3;
    for (let r = boxR; r < boxR + 3; r++) {
      for (let c = boxC; c < boxC + 3; c++) {
        if (brd[r][c] === num) return false;
      }
    }
    return true;
  };

  const solve = (brd: number[][]): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (brd[r][c] === 0) {
          const nums = Array.from({ length: 9 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(brd, r, c, num)) {
              brd[r][c] = num;
              if (solve(brd)) return true;
              brd[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  solve(board);

  // Remove some cells
  const puzzle = board.map(row => [...row]);
  const toRemove = 40;
  let removed = 0;
  while (removed < toRemove) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
  }

  return puzzle;
};

const SudokuGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerBoard, setPlayerBoard] = useState<number[][]>(() => {
    const p = generateSudoku();
    return p.map(row => [...row]);
  });
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const playerBoardRef = useRef<number[][]>(playerBoard);
  const originalPuzzleRef = useRef<number[][]>(playerBoard);

  useEffect(() => { playerBoardRef.current = playerBoard; }, [playerBoard]);

  const resetGame = useCallback(() => {
    const p = generateSudoku();
    setPlayerBoard(p.map(row => [...row]));
    playerBoardRef.current = p.map(row => [...row]);
    originalPuzzleRef.current = p.map(row => [...row]);
    setSelectedCell(null);
    setMistakes(0);
    setGameWon(false);
    setGameOver(false);
  }, []);

  const checkWin = useCallback((board: number[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) return false;
      }
    }
    return true;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || gameWon) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(mx / CELL);
    const row = Math.floor(my / CELL);
    if (row < 0 || row >= 9 || col < 0 || col >= 9) return;
    setSelectedCell([row, col]);
  }, [gameOver, gameWon]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver || gameWon || !selectedCell) return;
    const [r, c] = selectedCell;
    if (originalPuzzleRef.current[r][c] !== 0) return; // Can't change original

    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      const newBoard = playerBoardRef.current.map(row => [...row]);
      newBoard[r][c] = num;
      setPlayerBoard(newBoard);
      playerBoardRef.current = newBoard;

      if (checkWin(newBoard)) {
        setGameWon(true);
      }
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      const newBoard = playerBoardRef.current.map(row => [...row]);
      newBoard[r][c] = 0;
      setPlayerBoard(newBoard);
      playerBoardRef.current = newBoard;
    } else if (e.key === 'r' || e.key === 'R') {
      resetGame();
    }

    // Movement
    if (e.key === 'ArrowUp' && r > 0) setSelectedCell([r - 1, c]);
    if (e.key === 'ArrowDown' && r < 8) setSelectedCell([r + 1, c]);
    if (e.key === 'ArrowLeft' && c > 0) setSelectedCell([r, c - 1]);
    if (e.key === 'ArrowRight' && c < 8) setSelectedCell([r, c + 1]);
  }, [selectedCell, gameOver, gameWon, checkWin, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const isOriginal = originalPuzzleRef.current[r][c] !== 0;
        const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;

        ctx.fillStyle = isSelected ? '#1f1f3a' : (r + c) % 2 === 0 ? '#16213e' : '#1a1a2e';
        ctx.fillRect(x, y, CELL, CELL);

        const val = playerBoard[r][c];
        if (val !== 0) {
          ctx.fillStyle = isOriginal ? '#e0e0e0' : '#00FF9D';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${val}`, x + CELL / 2, y + CELL / 2 + 1);
        }

        // 3x3 box borders
        if (c % 3 === 0) {
          ctx.strokeStyle = '#2a2d39';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + CELL);
          ctx.stroke();
        }
        if (r % 3 === 0) {
          ctx.strokeStyle = '#2a2d39';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL, y);
          ctx.stroke();
        }
      }
    }

    // Outer border
    ctx.strokeStyle = '#00FF9D';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H);

    if (gameWon) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText('Press R for new puzzle', CANVAS_W / 2, CANVAS_H / 2 + 24);
    }
  }, [playerBoard, selectedCell, gameWon]);

  return (
    <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 10, alignItems: 'center', fontSize: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>Mistakes: <strong style={{ color: '#e94560' }}>{mistakes}</strong></span>
        <button onClick={resetGame} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '4px 14px', borderRadius: 6, fontWeight: 'bold', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>NEW GAME</button>
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
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        1-9 to fill · Arrow keys to navigate · R — New puzzle
      </div>
    </div>
  );
};

export default SudokuGame;


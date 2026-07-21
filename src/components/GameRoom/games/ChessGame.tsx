import React, { useRef, useEffect, useState, useCallback } from 'react';

const CELL = 50;
const BOARD_SIZE = 8;
const CANVAS_W = CELL * BOARD_SIZE;
const CANVAS_H = CELL * BOARD_SIZE;

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
}

type Board = (Piece | null)[][];

const PIECE_SYMBOLS: Record<PieceType, string> = {
  king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟',
};

const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: 'black' };
    board[1][c] = { type: 'pawn', color: 'black' };
    board[6][c] = { type: 'pawn', color: 'white' };
    board[7][c] = { type: backRow[c], color: 'white' };
  }

  return board;
};

const getValidMoves = (board: Board, r: number, c: number): [number, number][] => {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: [number, number][] = [];
  const { type, color } = piece;
  const dir = color === 'white' ? -1 : 1;
  const enemy = color === 'white' ? 'black' : 'white';
  const startRow = color === 'white' ? 6 : 1;

  const addIfValid = (tr: number, tc: number, canCapture = true) => {
    if (tr < 0 || tr >= 8 || tc < 0 || tc >= 8) return;
    const target = board[tr][tc];
    if (!target) {
      moves.push([tr, tc]);
      return true; // empty
    } else if (canCapture && target.color === enemy) {
      moves.push([tr, tc]);
    }
    return false;
  };

  switch (type) {
    case 'pawn': {
      // Forward
      if (addIfValid(r + dir, c, false)) {
        if (r === startRow) addIfValid(r + 2 * dir, c, false);
      }
      // Capture
      addIfValid(r + dir, c - 1);
      addIfValid(r + dir, c + 1);
      break;
    }
    case 'rook': {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (!addIfValid(nr, nc)) break;
          nr += dr; nc += dc;
        }
      }
      break;
    }
    case 'knight': {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        addIfValid(r + dr, c + dc);
      }
      break;
    }
    case 'bishop': {
      for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (!addIfValid(nr, nc)) break;
          nr += dr; nc += dc;
        }
      }
      break;
    }
    case 'queen': {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (!addIfValid(nr, nc)) break;
          nr += dr; nc += dc;
        }
      }
      break;
    }
    case 'king': {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        addIfValid(r + dr, c + dc);
      }
      break;
    }
  }

  return moves;
};

const ChessGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [turn, setTurn] = useState<PieceColor>('white');
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<Piece[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<Piece[]>([]);
  const boardRef = useRef<Board>(board);

  useEffect(() => { boardRef.current = board; }, [board]);

  const resetGame = useCallback(() => {
    const b = createInitialBoard();
    setBoard(b);
    boardRef.current = b;
    setTurn('white');
    setSelected(null);
    setValidMoves([]);
    setGameOver(false);
    setWinner(null);
    setCapturedWhite([]);
    setCapturedBlack([]);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(mx / CELL);
    const row = Math.floor(my / CELL);
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return;

    const b = boardRef.current;
    const clickedPiece = b[row][col];

    if (selected) {
      // Try to move
      const isValid = validMoves.some(([r, c]) => r === row && c === col);
      if (isValid) {
        const newBoard = b.map(r => r.map(cell => cell ? { ...cell } : null));
        const captured = newBoard[row][col];
        if (captured) {
          if (captured.color === 'white') setCapturedWhite(prev => [...prev, captured]);
          else setCapturedBlack(prev => [...prev, captured]);
        }
        newBoard[row][col] = newBoard[selected[0]][selected[1]];
        newBoard[selected[0]][selected[1]] = null;

// Check for king capture (game over)
        let whiteKingFound = false, blackKingFound = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (newBoard[r][c]?.type === 'king') {
              if (newBoard[r][c]?.color === 'white') whiteKingFound = true;
              else blackKingFound = true;
            }
          }
        }

        setBoard(newBoard);
        boardRef.current = newBoard;
        const nextTurn = turn === 'white' ? 'black' : 'white';
        setTurn(nextTurn);

        // Check if opponent king is gone
        let whiteKing = false, blackKing = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (newBoard[r][c]?.type === 'king') {
              if (newBoard[r][c]?.color === 'white') whiteKing = true;
              else blackKing = true;
            }
          }
        }
        if (!whiteKing || !blackKing) {
          setGameOver(true);
          setWinner(whiteKing ? 'white' : 'black');
        }
        setSelected(null);
        setValidMoves([]);
      } else if (clickedPiece && clickedPiece.color === turn) {
        const moves = getValidMoves(b, row, col);
        setSelected([row, col]);
        setValidMoves(moves);
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    } else if (clickedPiece && clickedPiece.color === turn) {
      const moves = getValidMoves(b, row, col);
      setSelected([row, col]);
      setValidMoves(moves);
    }
  }, [selected, validMoves, turn, gameOver]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Board
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#b58863' : '#f0d9b5';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }

    // Valid moves
    validMoves.forEach(([r, c]) => {
      ctx.fillStyle = 'rgba(0, 255, 157, 0.3)';
      ctx.beginPath();
      ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Selected
    if (selected) {
      ctx.strokeStyle = '#00FF9D';
      ctx.lineWidth = 3;
      ctx.strokeRect(selected[1] * CELL, selected[0] * CELL, CELL, CELL);
    }

    // Pieces
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = piece.color === 'white' ? '#fff' : '#1a1a1a';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText(PIECE_SYMBOLS[piece.type], c * CELL + CELL / 2, r * CELL + CELL / 2 + 2);
        ctx.shadowBlur = 0;
      }
    }

    // Turn indicator
    ctx.fillStyle = '#a0a5b5';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${turn.toUpperCase()} to move`, 4, CELL * 8 + 16);

    if (gameOver && winner) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${winner.toUpperCase()} WINS! 🏆`, CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText('Press R to restart', CANVAS_W / 2, CANVAS_H / 2 + 24);
    }
  }, [board, selected, validMoves, turn, gameOver, winner]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 10, fontFamily: 'monospace', fontSize: 12, alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>Turn: <strong style={{ color: turn === 'white' ? '#fff' : '#1a1a1a', background: turn === 'white' ? '#333' : '#ddd', padding: '2px 8px', borderRadius: 4 }}>{turn}</strong></span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>⚪ captured: {capturedWhite.length}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>⚫ captured: {capturedBlack.length}</span>
        <button onClick={resetGame} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '4px 12px', borderRadius: 6, fontWeight: 'bold', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>NEW GAME</button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H + 20}
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
        Click a piece → click valid move (green dots). R — Restart
      </div>
    </div>
  );
};

export default ChessGame;


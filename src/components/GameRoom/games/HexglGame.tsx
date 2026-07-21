import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 400;
const HEIGHT = 500;
const PLAYER_R = 12;
const HEX_SIZE = 30;

interface HexTile {
  x: number;
  y: number;
  row: number;
  col: number;
  active: boolean;
}

interface Player {
  x: number;
  y: number;
  col: number;
  row: number;
}

const createHexGrid = (): HexTile[] => {
  const tiles: HexTile[] = [];
  const rows = 8;
  const cols = 8;
  const w = HEX_SIZE * 1.5;
  const h = HEX_SIZE * Math.sqrt(3);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * w + (r % 2) * (w / 2) + HEX_SIZE;
      const y = r * h * 0.75 + HEX_SIZE;
      tiles.push({ x, y, row: r, col: c, active: true });
    }
  }
  return tiles;
};

const HexglGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiles, setTiles] = useState<HexTile[]>(createHexGrid);
  const [player, setPlayer] = useState<Player>(() => {
    const firstTile = createHexGrid()[0];
    return { x: firstTile.x, y: firstTile.y, col: 0, row: 0 };
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const playerRef = useRef(player);
  const tilesRef = useRef(tiles);
  const scoreRef = useRef(score);
  const gameOverRef = useRef(gameOver);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { tilesRef.current = tiles; }, [tiles]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  const resetGame = useCallback(() => {
    const newTiles = createHexGrid();
    setTiles(newTiles);
    tilesRef.current = newTiles;
    const firstTile = newTiles[0];
    setPlayer({ x: firstTile.x, y: firstTile.y, col: 0, row: 0 });
    playerRef.current = { x: firstTile.x, y: firstTile.y, col: 0, row: 0 };
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    gameOverRef.current = false;
  }, []);

  const movePlayer = useCallback((dc: number, dr: number) => {
    if (gameOverRef.current) return;
    const p = playerRef.current;
    const newCol = p.col + dc;
    const newRow = p.row + dr;
    
    const targetTile = tilesRef.current.find(t => t.col === newCol && t.row === newRow);
    if (!targetTile || !targetTile.active) return;

    setPlayer({ x: targetTile.x, y: targetTile.y, col: newCol, row: newRow });
    playerRef.current = { x: targetTile.x, y: targetTile.y, col: newCol, row: newRow };
    
    // Deactivate current tile
    const newTiles = tilesRef.current.map(t =>
      t.col === newCol && t.row === newRow ? { ...t, active: false } : t
    );
    setTiles(newTiles);
    tilesRef.current = newTiles;
    setScore(s => s + 1);
    scoreRef.current = scoreRef.current + 1;

    // Check if stuck (no active neighbors)
    const neighbors: [number, number][] = [
      [0, -1], [0, 1], [-1, 0], [1, 0],
      [p.row % 2 === 0 ? -1 : 1, -1],
      [p.row % 2 === 0 ? -1 : 1, 1],
    ];
    const hasMove = neighbors.some(([rdc, rdr]) => {
      const nn = tilesRef.current.find(t => t.col === newCol + rdc && t.row === newRow + rdr);
      return nn && nn.active;
    });
    if (!hasMove) {
      setGameOver(true);
      gameOverRef.current = true;
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer(1, 0); break;
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

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw hex grid
    tiles.forEach(tile => {
      const x = tile.x;
      const y = tile.y;
      const r = HEX_SIZE;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = tile.active ? '#16213e' : '#0a0a1a';
      ctx.fill();
      ctx.strokeStyle = tile.active ? '#2a2d39' : '#1a1a2e';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Player
    ctx.shadowColor = '#45f3ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#45f3ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#a0a5b5';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 10, 24);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 12);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
      ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 44);
    }
  }, [tiles, player, score, gameOver]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
        <span>← → ↑ ↓ / WASD — Move</span>
        <span>Visit all hex tiles!</span>
        <span>R — Restart</span>
      </div>
    </div>
  );
};

export default HexglGame;


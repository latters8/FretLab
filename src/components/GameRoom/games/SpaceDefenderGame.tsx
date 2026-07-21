import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 400;
const HEIGHT = 500;
const PLAYER_W = 40;
const PLAYER_H = 20;
const BULLET_R = 4;
const ENEMY_W = 30;
const ENEMY_H = 20;

interface Bullet { x: number; y: number; }
interface Enemy { x: number; y: number; alive: boolean; }

const SpaceDefenderGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerX, setPlayerX] = useState(WIDTH / 2 - PLAYER_W / 2);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({
      x: (i % 8) * (ENEMY_W + 10) + 20,
      y: Math.floor(i / 8) * (ENEMY_H + 10) + 30,
      alive: true,
    }))
  );
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [enemyDir, setEnemyDir] = useState(1);

  const playerRef = useRef(playerX);
  const bulletsRef = useRef<Bullet[]>(bullets);
  const enemiesRef = useRef<Enemy[]>(enemies);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const gameOverRef = useRef(gameOver);
  const enemyDirRef = useRef(enemyDir);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => { playerRef.current = playerX; }, [playerX]);
  useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { enemyDirRef.current = enemyDir; }, [enemyDir]);

  const resetGame = useCallback(() => {
    setPlayerX(WIDTH / 2 - PLAYER_W / 2);
    playerRef.current = WIDTH / 2 - PLAYER_W / 2;
    setBullets([]);
    bulletsRef.current = [];
    const newEnemies = Array.from({ length: 24 }, (_, i) => ({
      x: (i % 8) * (ENEMY_W + 10) + 20,
      y: Math.floor(i / 8) * (ENEMY_H + 10) + 30,
      alive: true,
    }));
    setEnemies(newEnemies);
    enemiesRef.current = newEnemies;
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setGameOver(false);
    gameOverRef.current = false;
    setEnemyDir(1);
    enemyDirRef.current = 1;
  }, []);

  // Game update
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      // Move player
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
        setPlayerX(p => Math.max(0, p - 5));
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
        setPlayerX(p => Math.min(WIDTH - PLAYER_W, p + 5));
      }

      // Move bullets
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - 6 })).filter(b => b.y > 0));

      // Move enemies
      setEnemies(prev => {
        let dir = enemyDirRef.current;
        let newEnemies = prev.map(e => ({ ...e, x: e.x + dir }));
        
        // Check if any enemy hits edge
        const hitEdge = newEnemies.some(e => e.alive && (e.x <= 0 || e.x >= WIDTH - ENEMY_W));
        if (hitEdge) {
          dir *= -1;
          newEnemies = newEnemies.map(e => ({ ...e, x: e.x + dir, y: e.y + 8 }));
        }
        setEnemyDir(dir);
        enemyDirRef.current = dir;
        
        return newEnemies;
      });

      // Collision detection
      const currentBullets = bulletsRef.current;
      const currentEnemies = enemiesRef.current;
      
      for (let bi = currentBullets.length - 1; bi >= 0; bi--) {
        const b = currentBullets[bi];
        for (let ei = 0; ei < currentEnemies.length; ei++) {
          const e = currentEnemies[ei];
          if (!e.alive) continue;
          if (
            b.x >= e.x && b.x <= e.x + ENEMY_W &&
            b.y >= e.y && b.y <= e.y + ENEMY_H
          ) {
            // Hit
            setBullets(prev => prev.filter((_, i) => i !== bi));
            setEnemies(prev => prev.map((en, i) => i === ei ? { ...en, alive: false } : en));
            setScore(s => s + 10);
            break;
          }
        }
      }

      // Check enemy reach bottom
      const reachedBottom = currentEnemies.some(e => e.alive && e.y >= HEIGHT - 40);
      if (reachedBottom) {
        setLives(l => l - 1);
        if (livesRef.current <= 1) {
          setGameOver(true);
          gameOverRef.current = true;
        } else {
          // Reset positions
          const newEnemies = Array.from({ length: 24 }, (_, i) => ({
            x: (i % 8) * (ENEMY_W + 10) + 20,
            y: Math.floor(i / 8) * (ENEMY_H + 10) + 30,
            alive: true,
          }));
          setEnemies(newEnemies);
          enemiesRef.current = newEnemies;
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Shooting
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if ((e.key === ' ' || e.key === 'Space') && !gameOverRef.current) {
        e.preventDefault();
        setBullets(prev => [...prev, { x: playerRef.current + PLAYER_W / 2, y: HEIGHT - PLAYER_H - 10 }]);
      }
      if (e.key === 'r' || e.key === 'R') resetGame();
    };
    const handleUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleUp);
    };
  }, [resetGame]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 37) % WIDTH;
      const sy = (i * 53) % HEIGHT;
      ctx.globalAlpha = 0.3 + (i % 3) * 0.3;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // Player
    ctx.shadowColor = '#45f3ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#45f3ff';
    ctx.beginPath();
    ctx.moveTo(playerX + PLAYER_W / 2, HEIGHT - PLAYER_H - 10);
    ctx.lineTo(playerX, HEIGHT - 10);
    ctx.lineTo(playerX + PLAYER_W, HEIGHT - 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bullets
    ctx.fillStyle = '#f9a825';
    ctx.shadowColor = '#f9a825';
    ctx.shadowBlur = 8;
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Enemies
    enemies.forEach(e => {
      if (!e.alive) return;
      ctx.shadowColor = '#e94560';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#e94560';
      ctx.fillRect(e.x, e.y, ENEMY_W, ENEMY_H);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('👾', e.x + ENEMY_W / 2, e.y + ENEMY_H - 3);
    });

    // Score & Lives
    ctx.fillStyle = '#a0a5b5';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`❤️ ${lives}`, WIDTH - 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 12);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 16);
      ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 40);
    }
  }, [playerX, bullets, enemies, score, lives, gameOver]);

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
        <span>← → / A D — Move</span>
        <span>Space — Shoot</span>
        <span>R — Restart</span>
      </div>
    </div>
  );
};

export default SpaceDefenderGame;


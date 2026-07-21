import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 600;
const HEIGHT = 350;
const GROUND_Y = HEIGHT - 40;
const PLAYER_W = 20;
const PLAYER_H = 30;

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
}

interface Enemy {
  x: number;
  y: number;
  alive: boolean;
  shootTimer: number;
  type: 'walker' | 'turret';
}

const ContraGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<Player>({ x: 50, y: GROUND_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: 1 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const playerRef = useRef(player);
  const bulletsRef = useRef<Bullet[]>(bullets);
  const enemiesRef = useRef<Enemy[]>(enemies);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const gameOverRef = useRef(gameOver);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  const resetGame = useCallback(() => {
    const p: Player = { x: 50, y: GROUND_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: 1 };
    setPlayer(p);
    playerRef.current = p;
    setBullets([]);
    bulletsRef.current = [];
    setEnemies([]);
    enemiesRef.current = [];
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setGameOver(false);
    gameOverRef.current = false;
    frameRef.current = 0;
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      frameRef.current++;
      let p = { ...playerRef.current };

      // Input
      const speed = 4;
      p.vx = 0;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
        p.vx = -speed;
        p.facing = -1;
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
        p.vx = speed;
        p.facing = 1;
      }
      if ((keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) && p.onGround) {
        p.vy = -10;
        p.onGround = false;
      }

      // Gravity
      p.vy += 0.6;
      p.x += p.vx;
      p.y += p.vy;

      // Ground collision
      if (p.y >= GROUND_Y - PLAYER_H) {
        p.y = GROUND_Y - PLAYER_H;
        p.vy = 0;
        p.onGround = true;
      }

      // World bounds
      p.x = Math.max(0, Math.min(WIDTH - PLAYER_W, p.x));

      // Shooting
      if (keysRef.current.has(' ') || keysRef.current.has('Space')) {
        if (frameRef.current % 8 === 0) {
          setBullets(prev => [...prev, { x: p.x + PLAYER_W / 2, y: p.y + 8, vx: p.facing * 8 }]);
        }
      }

      // Move bullets
      setBullets(prev => prev.map(b => ({ ...b, x: b.x + b.vx })).filter(b => b.x > 0 && b.x < WIDTH));

      // Spawn enemies
      if (frameRef.current % 120 === 0 && enemiesRef.current.length < 8) {
        const fromRight = Math.random() > 0.5;
        setEnemies(prev => [...prev, {
          x: fromRight ? WIDTH - 30 : -10,
          y: GROUND_Y - 30,
          alive: true,
          shootTimer: 60 + Math.floor(Math.random() * 60),
          type: 'walker',
        }]);
      }

      // Update enemies
      setEnemies(prev => prev.map(e => {
        if (!e.alive) return e;
        const newE = { ...e, shootTimer: e.shootTimer - 1 };
        // Move toward player
        const dir = playerRef.current.x > e.x ? 1 : -1;
        newE.x += dir * 1.5;
        // Shoot
        if (newE.shootTimer <= 0) {
          newE.shootTimer = 60 + Math.floor(Math.random() * 60);
          setBullets(prev => [...prev, { x: newE.x + 10, y: newE.y + 10, vx: dir * 5 }]);
        }
        return newE;
      }));

      // Bullet-enemy collision
      const currentBullets = bulletsRef.current;
      const currentEnemies = enemiesRef.current;

      for (let bi = 0; bi < currentBullets.length; bi++) {
        const b = currentBullets[bi];
        if (b.vx === 0) continue;
        for (let ei = 0; ei < currentEnemies.length; ei++) {
          const e = currentEnemies[ei];
          if (!e.alive) continue;
          if (b.x >= e.x && b.x <= e.x + 25 && b.y >= e.y && b.y <= e.y + 30) {
            setEnemies(prev => prev.map((en, i) => i === ei ? { ...en, alive: false } : en));
            setScore(s => s + 100);
            setBullets(prev => prev.filter((_, i) => i !== bi));
            break;
          }
        }
      }

      // Enemy-player collision
      const pe = playerRef.current;
      for (const e of currentEnemies) {
        if (!e.alive) continue;
        if (
          pe.x < e.x + 25 && pe.x + PLAYER_W > e.x &&
          pe.y < e.y + 30 && pe.y + PLAYER_H > e.y
        ) {
          setLives(l => {
            if (l <= 1) {
              setGameOver(true);
              gameOverRef.current = true;
              return 0;
            }
            return l - 1;
          });
          // Reset player position
          const newP: Player = { x: 50, y: GROUND_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: 1 };
          setPlayer(newP);
          playerRef.current = newP;
          break;
        }
      }

      setPlayer(p);
      playerRef.current = p;
    }, 30);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
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

    // Background
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#2a3a2a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT / 3);

    // Ground
    ctx.fillStyle = '#4e7c2f';
    ctx.fillRect(0, GROUND_Y, WIDTH, 40);
    ctx.fillStyle = '#3a6a1f';
    ctx.fillRect(0, GROUND_Y, WIDTH, 4);

    // Platforms
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(200, HEIGHT / 2, 100, 12);
    ctx.fillRect(400, HEIGHT / 3, 100, 12);

    // Player
    const p = player;
    ctx.shadowColor = '#f9a825';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f9a825';
    ctx.fillRect(p.x, p.y, PLAYER_W, PLAYER_H);
    ctx.shadowBlur = 0;
    // Head
    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.arc(p.x + PLAYER_W / 2, p.y - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    // Gun
    ctx.fillStyle = '#666';
    ctx.fillRect(p.x + (p.facing > 0 ? PLAYER_W : -4), p.y + 8, 8, 3);

    // Enemies
    enemies.forEach(e => {
      if (!e.alive) return;
      ctx.fillStyle = '#e94560';
      ctx.fillRect(e.x, e.y, 25, 30);
      ctx.fillStyle = '#f5d0a9';
      ctx.beginPath();
      ctx.arc(e.x + 12, e.y - 2, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    // Bullets
    ctx.fillStyle = '#f9a825';
    ctx.shadowColor = '#f9a825';
    ctx.shadowBlur = 6;
    bullets.forEach(b => {
      if (b.vx === 0) return;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // HUD
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
      ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
      ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 44);
    }
  }, [player, bullets, enemies, score, lives, gameOver]);

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
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span>← → / A D — Move</span>
        <span>↑ / W — Jump</span>
        <span>Space — Shoot</span>
        <span>R — Restart</span>
      </div>
    </div>
  );
};

export default ContraGame;


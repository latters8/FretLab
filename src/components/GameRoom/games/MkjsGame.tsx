import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 500;
const HEIGHT = 350;
const GROUND_Y = HEIGHT - 50;
const FIGHTER_W = 35;

interface Fighter {
  x: number;
  y: number;
  hp: number;
  state: 'idle' | 'attack' | 'hit' | 'block';
  stateTimer: number;
  facing: number;
  jumpY: number;
  isJumping: boolean;
}

const createFighter = (x: number): Fighter => ({
  x,
  y: GROUND_Y - 50,
  hp: 100,
  state: 'idle',
  stateTimer: 0,
  facing: 1,
  jumpY: 0,
  isJumping: false,
});

const MkjsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p1, setP1] = useState<Fighter>(createFighter(100));
  const [p2, setP2] = useState<Fighter>(createFighter(WIDTH - 135));
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const p1Ref = useRef(p1);
  const p2Ref = useRef(p2);
  const gameOverRef = useRef(gameOver);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => { p1Ref.current = p1; }, [p1]);
  useEffect(() => { p2Ref.current = p2; }, [p2]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  const resetGame = useCallback(() => {
    const newP1 = createFighter(100);
    const newP2 = createFighter(WIDTH - 135);
    newP2.facing = -1;
    setP1(newP1);
    p1Ref.current = newP1;
    setP2(newP2);
    p2Ref.current = newP2;
    setGameOver(false);
    setWinner(null);
    gameOverRef.current = false;
  }, []);

  // AI for P2
  const updateAI = useCallback(() => {
    const ai = p2Ref.current;
    const player = p1Ref.current;
    if (gameOverRef.current || ai.hp <= 0 || player.hp <= 0) return ai;

    const dist = Math.abs(ai.x - player.x);
    const dir = player.x > ai.x ? 1 : -1;
    const newAI: Fighter = { ...ai, state: 'idle' as Fighter['state'], stateTimer: Math.max(0, ai.stateTimer - 1) };

    if (Math.random() < 0.03) {
      if (dist > 70) {
        newAI.x += dir * 3;
        newAI.facing = dir;
      } else if (dist < 40) {
        newAI.x -= dir * 2;
      } else if (Math.random() < 0.4) {
        newAI.state = 'attack';
        newAI.stateTimer = 15;
        return newAI;
      } else if (Math.random() < 0.3) {
        newAI.state = 'block';
        newAI.stateTimer = 20;
        return newAI;
      }
    }

    return newAI;
  }, []);

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      let newP1 = { ...p1Ref.current };
      const newP2 = updateAI();

      // Update timers
      newP1.stateTimer = Math.max(0, newP1.stateTimer - 1);
      if (newP1.stateTimer === 0) newP1.state = 'idle';

      // P1 controls
      const speed = 3;
      if (keysRef.current.has('a') || keysRef.current.has('A')) {
        newP1.x = Math.max(10, newP1.x - speed);
        newP1.facing = -1;
      }
      if (keysRef.current.has('d') || keysRef.current.has('D')) {
        newP1.x = Math.min(WIDTH - FIGHTER_W - 10, newP1.x + speed);
        newP1.facing = 1;
      }
      if (keysRef.current.has('w') || keysRef.current.has('W')) {
        if (!newP1.isJumping) {
          newP1.isJumping = true;
          newP1.jumpY = -50;
        }
      }
      // Jump physics
      if (newP1.isJumping) {
        newP1.jumpY += 3;
        newP1.y = newP1.y + (newP1.jumpY < 0 ? -4 : 4);
        if (newP1.jumpY >= 0) {
          newP1.isJumping = false;
          newP1.jumpY = 0;
          newP1.y = GROUND_Y - 50;
        }
      }
      if ((keysRef.current.has(' ') || keysRef.current.has('Space')) && newP1.state === 'idle') {
        newP1.state = 'attack';
        newP1.stateTimer = 15;
      }
      if ((keysRef.current.has('s') || keysRef.current.has('S')) && newP1.state === 'idle') {
        newP1.state = 'block';
        newP1.stateTimer = 20;
      }

      // Combat
      const dist = Math.abs(newP1.x - (newP2 as Fighter).x);
      if (newP1.state === 'attack' && dist < 50 && (newP2 as Fighter).state !== 'block') {
        const updatedP2 = { ...(newP2 as Fighter), hp: (newP2 as Fighter).hp - 8, state: 'hit' as const, stateTimer: 10 };
        setP2(updatedP2);
        p2Ref.current = updatedP2;
      }
      if ((newP2 as Fighter).state === 'attack' && dist < 50 && newP1.state !== 'block') {
        newP1.hp -= 8;
        newP1.state = 'hit';
        newP1.stateTimer = 10;
      }

      // Block reduces damage
      if ((newP2 as Fighter).state === 'attack' && dist < 50 && newP1.state === 'block') {
        newP1.hp -= 2; // Reduced damage
      }

      // Check game over
      if (newP1.hp <= 0 || (newP2 as Fighter).hp <= 0) {
        setGameOver(true);
        gameOverRef.current = true;
        setWinner(newP1.hp > 0 ? 1 : 2);
      }

      setP1(newP1);
      p1Ref.current = newP1;
      setP2(newP2 as Fighter);
      p2Ref.current = newP2 as Fighter;
    }, 30);

    return () => clearInterval(interval);
  }, [updateAI]);

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
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT / 3);

    // Ground
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(0, GROUND_Y, WIDTH, 50);
    ctx.strokeStyle = '#4a3a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.stroke();

    // Health bars
    const hpW = 150;
    [p1, p2].forEach((fighter, idx) => {
      const x = idx === 0 ? 20 : WIDTH - 20 - hpW;
      ctx.fillStyle = '#333';
      ctx.fillRect(x, 10, hpW, 12);
      ctx.fillStyle = fighter === p1 ? '#e94560' : '#45f3ff';
      ctx.fillRect(x, 10, hpW * (fighter.hp / 100), 12);
      ctx.strokeStyle = '#a0a5b5';
      ctx.strokeRect(x, 10, hpW, 12);
    });

// Draw fighters
    [p1, p2].forEach((_fighter, idx) => {
      const isP1 = idx === 0;
      const f = isP1 ? p1 : p2;
      const drawY = f.isJumping ? f.y : GROUND_Y - 50;

      // Body
      ctx.fillStyle = f.state === 'hit' ? '#fff' : isP1 ? '#e94560' : '#45f3ff';
      ctx.shadowColor = isP1 ? '#e94560' : '#45f3ff';
      ctx.shadowBlur = f.state === 'attack' ? 25 : 8;
      ctx.fillRect(f.x, drawY, 35, 50);
      ctx.shadowBlur = 0;

      // Head
      ctx.fillStyle = '#f5d0a9';
      ctx.beginPath();
      ctx.arc(f.x + 17, drawY - 8, 14, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#333';
      ctx.fillRect(f.x + 17 + f.facing * 4 - 2, drawY - 12, 3, 3);

      // Attack effect
      if (f.state === 'attack') {
        ctx.fillStyle = '#f9a825';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(f.x + 17 + f.facing * 25, drawY + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Block shield
      if (f.state === 'block') {
        ctx.fillStyle = 'rgba(0, 255, 157, 0.3)';
        ctx.beginPath();
        ctx.arc(f.x + 17, drawY + 15, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // State label
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.state.toUpperCase(), f.x + 17, drawY - 22);
    });

    // Names
    ctx.fillStyle = '#a0a5b5';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P1 (WASD + Space/Block=S)', 100, 6);
    ctx.fillText('AI', WIDTH - 100, 6);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f9a825';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(winner === 1 ? '🏆 VICTORY!' : '💀 FATALITY!', WIDTH / 2, HEIGHT / 2 - 12);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 24);
    }
  }, [p1, p2, gameOver, winner]);

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
        <span>A/D — Move</span>
        <span>W — Jump</span>
        <span>Space — Attack</span>
        <span>S — Block</span>
        <span>R — Rematch</span>
      </div>
    </div>
  );
};

export default MkjsGame;


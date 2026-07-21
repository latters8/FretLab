import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 500;
const HEIGHT = 350;
const GROUND_Y = HEIGHT - 50;
const FIGHTER_W = 35;
const FIGHTER_H = 55;

interface Fighter {
  x: number;
  y: number;
  hp: number;
  facing: number; // 1 = right, -1 = left
  attacking: boolean;
  attackTimer: number;
  hitTimer: number;
}

const createFighter = (x: number, facing: number): Fighter => ({
  x,
  y: GROUND_Y - FIGHTER_H,
  hp: 100,
  facing,
  attacking: false,
  attackTimer: 0,
  hitTimer: 0,
});

const StreetFighterGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p1, setP1] = useState<Fighter>(createFighter(80, 1));
  const [p2, setP2] = useState<Fighter>(createFighter(WIDTH - 115, -1));
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const p1Ref = useRef(p1);
  const p2Ref = useRef(p2);
  const gameOverRef = useRef(gameOver);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);

  useEffect(() => { p1Ref.current = p1; }, [p1]);
  useEffect(() => { p2Ref.current = p2; }, [p2]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  const resetGame = useCallback(() => {
    const newP1 = createFighter(80, 1);
    const newP2 = createFighter(WIDTH - 115, -1);
    setP1(newP1);
    p1Ref.current = newP1;
    setP2(newP2);
    p2Ref.current = newP2;
    setGameOver(false);
    setWinner(null);
    gameOverRef.current = false;
    frameRef.current = 0;
  }, []);

  // AI for P2
  const aiUpdate = useCallback(() => {
    const ai = p2Ref.current;
    const player = p1Ref.current;
    if (gameOverRef.current || ai.hp <= 0 || player.hp <= 0) return;

    const dist = Math.abs(ai.x - player.x);
    const dir = player.x > ai.x ? 1 : -1;

    // Random AI behavior
    if (Math.random() < 0.02) {
      if (dist > 60) {
        // Move toward player
        const newP2 = { ...ai, x: ai.x + dir * 3, facing: dir };
        setP2(newP2);
        p2Ref.current = newP2;
      } else if (Math.random() < 0.3) {
        // Attack
        const newP2 = { ...ai, attacking: true, attackTimer: 20 };
        setP2(newP2);
        p2Ref.current = newP2;

        if (dist < 50) {
          const newP1 = { ...player, hp: player.hp - 5, hitTimer: 10 };
          setP1(newP1);
          p1Ref.current = newP1;
        }
      }
    }
  }, []);

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;

      let newP1 = { ...p1Ref.current };
      let newP2 = { ...p2Ref.current };

      // Decrease timers
      if (newP1.attackTimer > 0) { newP1.attackTimer--; if (newP1.attackTimer === 0) newP1.attacking = false; }
      if (newP1.hitTimer > 0) newP1.hitTimer--;
      if (newP2.attackTimer > 0) { newP2.attackTimer--; if (newP2.attackTimer === 0) newP2.attacking = false; }
      if (newP2.hitTimer > 0) newP2.hitTimer--;

      // P1 input
      const speed = 3;
      if (keysRef.current.has('a') || keysRef.current.has('A')) {
        newP1.x = Math.max(10, newP1.x - speed);
        newP1.facing = -1;
      }
      if (keysRef.current.has('d') || keysRef.current.has('D')) {
        newP1.x = Math.min(WIDTH - 10, newP1.x + speed);
        newP1.facing = 1;
      }
      if (keysRef.current.has(' ') && !newP1.attacking) {
        newP1.attacking = true;
        newP1.attackTimer = 20;

        // Check hit
        const dist = Math.abs(newP1.x - newP2.x);
        if (dist < 50) {
          newP2.hp -= 5;
          newP2.hitTimer = 10;
        }
      }

      // AI
      aiUpdate();

      // Check HP
      if (newP1.hp <= 0 || newP2.hp <= 0) {
        setGameOver(true);
        gameOverRef.current = true;
        setWinner(newP1.hp > 0 ? 1 : 2);
      }

      setP1(newP1);
      p1Ref.current = newP1;
      setP2(newP2);
      p2Ref.current = newP2;
    }, 30);

    return () => clearInterval(interval);
  }, [aiUpdate]);

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
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT / 2);

    // Ground
    ctx.fillStyle = '#2a2d39';
    ctx.fillRect(0, GROUND_Y, WIDTH, 50);
    ctx.strokeStyle = '#3a3d49';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.stroke();

    // Health bars
    const hpW = 150;
    const hpX1 = 20;
    const hpX2 = WIDTH - 20 - hpW;
    ctx.fillStyle = '#333';
    ctx.fillRect(hpX1, 10, hpW, 12);
    ctx.fillRect(hpX2, 10, hpW, 12);
    ctx.fillStyle = '#e94560';
    ctx.fillRect(hpX1, 10, hpW * (p1.hp / 100), 12);
    ctx.fillStyle = '#45f3ff';
    ctx.fillRect(hpX2, 10, hpW * (p2.hp / 100), 12);
    ctx.strokeStyle = '#a0a5b5';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpX1, 10, hpW, 12);
    ctx.strokeRect(hpX2, 10, hpW, 12);

    // P1
    const p1Draw = p1;
    ctx.fillStyle = p1.hitTimer > 0 ? '#fff' : '#00FF9D';
    ctx.shadowColor = '#00FF9D';
    ctx.shadowBlur = p1.attacking ? 20 : 8;
    ctx.fillRect(p1Draw.x, p1Draw.y, FIGHTER_W, FIGHTER_H);
    ctx.shadowBlur = 0;
    // Head
    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.arc(p1Draw.x + FIGHTER_W / 2, p1Draw.y - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#333';
    ctx.fillRect(p1Draw.x + FIGHTER_W / 2 + p1Draw.facing * 4 - 2, p1Draw.y - 12, 3, 3);
    // Fist
    if (p1Draw.attacking) {
      ctx.fillStyle = '#f5d0a9';
      ctx.beginPath();
      ctx.arc(p1Draw.x + (p1Draw.facing > 0 ? FIGHTER_W + 10 : -10), p1Draw.y + 15, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // P2
    const p2Draw = p2;
    ctx.fillStyle = p2.hitTimer > 0 ? '#fff' : '#e94560';
    ctx.shadowColor = '#e94560';
    ctx.shadowBlur = p2.attacking ? 20 : 8;
    ctx.fillRect(p2Draw.x, p2Draw.y, FIGHTER_W, FIGHTER_H);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.arc(p2Draw.x + FIGHTER_W / 2, p2Draw.y - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillRect(p2Draw.x + FIGHTER_W / 2 + p2Draw.facing * 4 - 2, p2Draw.y - 12, 3, 3);

    // Names
    ctx.fillStyle = '#a0a5b5';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P1 (WASD + Space)', hpX1 + hpW / 2, 8);
    ctx.fillText('AI', hpX2 + hpW / 2, 8);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#00FF9D';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(winner === 1 ? '🏆 P1 WINS!' : '🤖 AI WINS!', WIDTH / 2, HEIGHT / 2 - 12);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '14px monospace';
      ctx.fillText('Press R to rematch', WIDTH / 2, HEIGHT / 2 + 24);
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
        <span>Space — Punch</span>
        <span>R — Rematch</span>
      </div>
    </div>
  );
};

export default StreetFighterGame;


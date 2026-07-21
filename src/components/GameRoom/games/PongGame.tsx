import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 600;
const HEIGHT = 400;
const PADDLE_W = 10;
const PADDLE_H = 80;
const BALL_SIZE = 8;
const WIN_SCORE = 5;

interface Paddle { y: number; }
interface Ball { x: number; y: number; vx: number; vy: number; }

const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<Paddle>({ y: HEIGHT / 2 - PADDLE_H / 2 });
  const [ai, setAi] = useState<Paddle>({ y: HEIGHT / 2 - PADDLE_H / 2 });
  const [ball, setBall] = useState<Ball>({ x: WIDTH / 2, y: HEIGHT / 2, vx: 4, vy: 3 });
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(false);
  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef({ y: HEIGHT / 2 - PADDLE_H / 2 });
  const aiRef = useRef({ y: HEIGHT / 2 - PADDLE_H / 2 });
  const ballRef = useRef<Ball>({ x: WIDTH / 2, y: HEIGHT / 2, vx: 4, vy: 3 });
  const scoreRef = useRef({ player: 0, ai: 0 });

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { aiRef.current = ai; }, [ai]);
  useEffect(() => { ballRef.current = ball; }, [ball]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const resetBall = useCallback((dir: 1 | -1 = 1) => {
    const newBall: Ball = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      vx: 4 * dir,
      vy: (Math.random() > 0.5 ? 3 : -3),
    };
    setBall(newBall);
    ballRef.current = newBall;
  }, []);

  const resetGame = useCallback(() => {
    const p = { y: HEIGHT / 2 - PADDLE_H / 2 };
    const b = { x: WIDTH / 2, y: HEIGHT / 2, vx: 4, vy: 3 };
    setPlayer(p); playerRef.current = p;
    setAi(p); aiRef.current = p;
    setBall(b); ballRef.current = b;
    setScore({ player: 0, ai: 0 }); scoreRef.current = { player: 0, ai: 0 };
    setGameOver(false);
  }, []);

  const update = useCallback(() => {
    if (gameOver) return;

    // Move player
    const speed = 6;
    const p = { ...playerRef.current };
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) {
      p.y = Math.max(0, p.y - speed);
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s') || keysRef.current.has('S')) {
      p.y = Math.min(HEIGHT - PADDLE_H, p.y + speed);
    }
    setPlayer(p); playerRef.current = p;

    // Move AI (follow ball with delay)
    const a = { ...aiRef.current };
    const aiSpeed = 3.5;
    if (Math.abs(ballRef.current.x - WIDTH) < 300) {
      if (a.y + PADDLE_H / 2 < ballRef.current.y - 10) a.y = Math.min(HEIGHT - PADDLE_H, a.y + aiSpeed);
      else if (a.y + PADDLE_H / 2 > ballRef.current.y + 10) a.y = Math.max(0, a.y - aiSpeed);
    } else {
      // Drift back to center
      if (a.y + PADDLE_H / 2 < HEIGHT / 2 - 20) a.y = Math.min(HEIGHT - PADDLE_H, a.y + aiSpeed * 0.5);
      else if (a.y + PADDLE_H / 2 > HEIGHT / 2 + 20) a.y = Math.max(0, a.y - aiSpeed * 0.5);
    }
    setAi(a); aiRef.current = a;

    // Move ball
    const b = { ...ballRef.current };
    b.x += b.vx;
    b.y += b.vy;

    // Top/bottom bounce
    if (b.y <= 0 || b.y >= HEIGHT - BALL_SIZE) b.vy = -b.vy;

    // Player paddle bounce
    if (
      b.x <= PADDLE_W + BALL_SIZE &&
      b.y >= p.y - BALL_SIZE &&
      b.y <= p.y + PADDLE_H &&
      b.vx < 0
    ) {
      b.vx = -b.vx * 1.05;
      const hitPos = (b.y - p.y) / PADDLE_H;
      b.vy = (hitPos - 0.5) * 6;
      b.x = PADDLE_W + BALL_SIZE + 1;
    }

    // AI paddle bounce
    if (
      b.x >= WIDTH - PADDLE_W - BALL_SIZE &&
      b.y >= a.y - BALL_SIZE &&
      b.y <= a.y + PADDLE_H &&
      b.vx > 0
    ) {
      b.vx = -b.vx * 1.05;
      const hitPos = (b.y - a.y) / PADDLE_H;
      b.vy = (hitPos - 0.5) * 6;
      b.x = WIDTH - PADDLE_W - BALL_SIZE - 1;
    }

    // Clamp speed
    if (Math.abs(b.vx) > 8) b.vx = Math.sign(b.vx) * 8;
    if (Math.abs(b.vy) > 6) b.vy = Math.sign(b.vy) * 6;

    // Scoring
    if (b.x < 0) {
      const newScore = { ...scoreRef.current, ai: scoreRef.current.ai + 1 };
      setScore(newScore); scoreRef.current = newScore;
      if (newScore.ai >= WIN_SCORE) { setGameOver(true); return; }
      resetBall(1);
      return;
    }
    if (b.x > WIDTH) {
      const newScore = { ...scoreRef.current, player: scoreRef.current.player + 1 };
      setScore(newScore); scoreRef.current = newScore;
      if (newScore.player >= WIN_SCORE) { setGameOver(true); return; }
      resetBall(-1);
      return;
    }

    setBall(b); ballRef.current = b;
  }, [gameOver, resetBall]);

  useEffect(() => {
    const interval = setInterval(update, 16);
    return () => clearInterval(interval);
  }, [update]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Center line
    ctx.strokeStyle = '#2a2d39';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00FF9D';
    ctx.fillStyle = '#00FF9D';
    ctx.fillRect(2, player.y, PADDLE_W, PADDLE_H);
    ctx.shadowColor = '#e94560';
    ctx.fillStyle = '#e94560';
    ctx.fillRect(WIDTH - PADDLE_W - 2, ai.y, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;

    // Ball
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#a0a5b5';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.player}`, WIDTH / 2 - 40, 40);
    ctx.fillText(`${score.ai}`, WIDTH / 2 + 40, 40);

    // Win text
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = score.player > score.ai ? '#00FF9D' : '#e94560';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(score.player > score.ai ? 'YOU WIN!' : 'AI WINS!', WIDTH / 2, HEIGHT / 2 - 12);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '16px monospace';
      ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 24);
    }
  }, [player, ai, ball, score, gameOver]);

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
        <span>↑ ↓ / W S — Move</span>
        <span>R — Restart</span>
        <span>First to {WIN_SCORE} wins!</span>
      </div>
    </div>
  );
};

export default PongGame;


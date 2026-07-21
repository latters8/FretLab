import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 300;
const HEIGHT = 500;
const CAR_W = 30;
const CAR_H = 50;
const LANE_COUNT = 3;
const LANE_W = WIDTH / LANE_COUNT;

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

const PixelRacerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerX, setPlayerX] = useState(LANE_W);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(3);
  const playerRef = useRef(playerX);
  const obstaclesRef = useRef<Obstacle[]>(obstacles);
  const scoreRef = useRef(score);
  const gameOverRef = useRef(gameOver);
  const speedRef = useRef(speed);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);

  useEffect(() => { playerRef.current = playerX; }, [playerX]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const resetGame = useCallback(() => {
    setPlayerX(LANE_W);
    playerRef.current = LANE_W;
    setObstacles([]);
    obstaclesRef.current = [];
    setScore(0);
    scoreRef.current = 0;
    setSpeed(3);
    speedRef.current = 3;
    setGameOver(false);
    gameOverRef.current = false;
    frameRef.current = 0;
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      frameRef.current++;

// Move player
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
        setPlayerX(prev => Math.max(0, prev - LANE_W));
        // Cooldown to prevent instant lane skip
        if (frameRef.current % 10 !== 0) {}
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
        setPlayerX(prev => Math.min(WIDTH - CAR_W, prev + LANE_W));
      }

      // Spawn obstacles
      if (frameRef.current % 40 === 0) {
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const obsWidth = 30 + Math.random() * 20;
        setObstacles(prev => [...prev, {
          x: lane * LANE_W + (LANE_W - obsWidth) / 2,
          y: -CAR_H,
          width: obsWidth,
          height: CAR_H,
          speed: speedRef.current + Math.random() * 0.5,
        }]);
      }

// Move obstacles & collision
      setObstacles(prev => {
        const newObs = prev
          .map(o => ({ ...o, y: o.y + o.speed }))
          .filter(o => o.y < HEIGHT + 50);

        // Collision
        const px = playerRef.current;
        const py = HEIGHT - CAR_H - 20;
        for (const o of newObs) {
          if (
            o.y + o.height >= py &&
            o.y <= py + CAR_H &&
            o.x + o.width >= px &&
            o.x <= px + CAR_W
          ) {
            setGameOver(true);
            gameOverRef.current = true;
            return newObs;
          }
        }

        return newObs;
      });

      // Score
      setScore(prev => prev + 1);
      if (scoreRef.current % 100 === 0 && scoreRef.current > 0) {
        setSpeed(s => Math.min(8, s + 0.5));
      }
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

    // Road
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Road markings
    ctx.strokeStyle = '#2a2d39';
    ctx.lineWidth = 2;
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_W, 0);
      ctx.lineTo(i * LANE_W, HEIGHT);
      ctx.stroke();
    }

    // Dashed center lines
    ctx.strokeStyle = '#4a4d59';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 15]);
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_W, 0);
      ctx.lineTo(i * LANE_W, HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Obstacles (enemy cars)
    obstacles.forEach(o => {
      ctx.fillStyle = '#e94560';
      ctx.shadowColor = '#e94560';
      ctx.shadowBlur = 6;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.shadowBlur = 0;
      // Windows
      ctx.fillStyle = '#a0a5b5';
      ctx.fillRect(o.x + 4, o.y + 8, o.width - 8, 10);
    });

    // Player car
    const px = playerRef.current;
    const py = HEIGHT - CAR_H - 20;
    ctx.shadowColor = '#00FF9D';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00FF9D';
    ctx.fillRect(px, py, CAR_W, CAR_H);
    ctx.shadowBlur = 0;
    // Windshield
    ctx.fillStyle = '#a0a5b5';
    ctx.fillRect(px + 4, py + 8, CAR_W - 8, 12);
    // Wheels
    ctx.fillStyle = '#333';
    ctx.fillRect(px - 3, py + 5, 4, 10);
    ctx.fillRect(px + CAR_W - 1, py + 5, 4, 10);
    ctx.fillRect(px - 3, py + CAR_H - 15, 4, 10);
    ctx.fillRect(px + CAR_W - 1, py + CAR_H - 15, 4, 10);

    // Score
    ctx.fillStyle = '#a0a5b5';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 10, 25);

    // Speed indicator
    ctx.fillStyle = speed > 6 ? '#e94560' : speed > 4 ? '#f9a825' : '#a0a5b5';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SPD: ${speed.toFixed(1)}`, WIDTH - 10, 25);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.fillStyle = '#a0a5b5';
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 12);
      ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 40);
    }
  }, [playerX, obstacles, score, gameOver, speed]);

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
        <span>← → / A D — Switch lanes</span>
        <span>R — Restart</span>
        <span>Avoid enemy cars!</span>
      </div>
    </div>
  );
};

export default PixelRacerGame;


import React, { useRef, useEffect, useState, useCallback } from 'react';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const CELL_SIZE = 50;
const GAP = 6;
const CANVAS_W = WORD_LENGTH * (CELL_SIZE + GAP) + GAP;
const CANVAS_H = MAX_GUESSES * (CELL_SIZE + GAP) + GAP + 40;

const WORDS = [
  'REACT', 'BUILD', 'POWER', 'WORLD', 'HELLO', 'MUSIC', 'GAMES', 'FRONT',
  'CLOUD', 'STACK', 'QUERY', 'LOGIC', 'FRAME', 'STATE', 'EVENT', 'STYLE',
  'CLASS', 'ARRAY', 'FLOAT', 'LIGHT', 'SOUND', 'RHYTHM', 'BEATS', 'CHORD',
  'SCALE', 'NOTE', 'TEMPO', 'BASS', 'DRUM', 'PIANO', 'GUITAR', 'SOLO',
  'JAZZ', 'BLUES', 'ROCK', 'FOLK', 'METAL', 'POP', 'FUNK', 'SOUL',
];

const getWord = (): string => WORDS[Math.floor(Math.random() * WORDS.length)];

const getFeedback = (guess: string, target: string): ('correct' | 'present' | 'absent')[] => {
  const result: ('correct' | 'present' | 'absent')[] = Array(WORD_LENGTH).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');

  // First pass: correct
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      targetArr[i] = '#';
      guessArr[i] = '#';
    }
  }

  // Second pass: present
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === '#') continue;
    const idx = targetArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = 'present';
      targetArr[idx] = '#';
    }
  }

  return result;
};

const WordleGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [targetWord, setTargetWord] = useState(getWord);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const guessesRef = useRef<string[]>(guesses);
  const currentRef = useRef(currentGuess);
  const wonRef = useRef(won);

  useEffect(() => { guessesRef.current = guesses; }, [guesses]);
  useEffect(() => { currentRef.current = currentGuess; }, [currentGuess]);
  useEffect(() => { wonRef.current = won; }, [won]);

  const resetGame = useCallback(() => {
    const w = getWord();
    setTargetWord(w);
    setGuesses([]);
    guessesRef.current = [];
    setCurrentGuess('');
    currentRef.current = '';
    setGameOver(false);
    setWon(false);
    wonRef.current = false;
    setMessage('');
  }, []);

  const submitGuess = useCallback(() => {
    if (gameOver || won) return;
    const guess = currentRef.current;
    if (guess.length !== WORD_LENGTH) {
      setMessage('Not enough letters');
      return;
    }

    const newGuesses = [...guessesRef.current, guess];
    setGuesses(newGuesses);
    guessesRef.current = newGuesses;
    setCurrentGuess('');
    currentRef.current = '';

    if (guess === targetWord) {
      setWon(true);
      wonRef.current = true;
      setGameOver(true);
      setMessage('🎉 You got it!');
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      setMessage(`The word was: ${targetWord}`);
    }
  }, [gameOver, won, targetWord]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
        return;
      }

      if (e.key === 'Backspace') {
        setCurrentGuess(prev => {
          const next = prev.slice(0, -1);
          currentRef.current = next;
          return next;
        });
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      const letter = e.key.toUpperCase();
      if (/^[A-Z]$/.test(letter) && currentRef.current.length < WORD_LENGTH) {
        setCurrentGuess(prev => {
          const next = prev + letter;
          currentRef.current = next;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameOver, submitGuess, resetGame]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let row = 0; row < MAX_GUESSES; row++) {
      for (let col = 0; col < WORD_LENGTH; col++) {
        const x = col * (CELL_SIZE + GAP) + GAP;
        const y = row * (CELL_SIZE + GAP) + GAP;

        let letter = '';
        let bgColor = '#16213e';
        let borderColor = '#2a2d39';

        if (row < guesses.length) {
          const guess = guesses[row];
          letter = guess[col] || '';
          const feedback = getFeedback(guess, targetWord);
          
          switch (feedback[col]) {
            case 'correct':
              bgColor = '#00FF9D';
              borderColor = '#00FF9D';
              break;
            case 'present':
              bgColor = '#f9a825';
              borderColor = '#f9a825';
              break;
            case 'absent':
              bgColor = '#2a2d39';
              borderColor = '#2a2d39';
              break;
          }
        } else if (row === guesses.length) {
          letter = currentGuess[col] || '';
          if (letter) {
            borderColor = '#a0a5b5';
          }
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        if (letter) {
          ctx.fillStyle = borderColor === '#00FF9D' || borderColor === '#f9a825' ? '#000' : '#fff';
          ctx.font = 'bold 24px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
        }
      }
    }

    // Message
    if (message) {
      ctx.fillStyle = won ? '#00FF9D' : '#e94560';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(message, CANVAS_W / 2, CANVAS_H - 10);
    }
  }, [guesses, currentGuess, targetWord, message, won]);

  return (
    <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span>Type letters</span>
        <span>Enter — Submit</span>
        <span>Backspace — Delete</span>
        <span>R — New word</span>
      </div>
    </div>
  );
};

export default WordleGame;


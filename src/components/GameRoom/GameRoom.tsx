import React, { useState } from 'react';
import {
  SnakeGame, PongGame, Puzzle2048Game, TetrisGame, MinesweeperGame, Match3Game,
  MazeRunnerGame, SpaceDefenderGame, PixelRacerGame, ChessGame, HexglGame,
  SandboxGame, SudokuGame, WordleGame, StreetFighterGame, MkjsGame,
  ContraGame, SokobanGame
} from './games';
import './GameRoom.module.css';

// Minimal SVG icons for each game (8x8 pixel art style, simplified)
const ICONS: Record<string, React.ReactNode> = {
  snake: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="4" y="4" width="6" height="6" fill="#00FF9D" rx="1"/>
      <rect x="10" y="4" width="6" height="6" fill="#00cc7a" rx="1"/>
      <rect x="16" y="4" width="6" height="6" fill="#00cc7a" rx="1"/>
      <rect x="4" y="10" width="6" height="6" fill="#00cc7a" rx="1"/>
      <rect x="4" y="16" width="6" height="6" fill="#00cc7a" rx="1"/>
      <circle cx="12" cy="7" r="1.5" fill="#fff"/>
    </svg>
  ),
  tetris: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="8" y="4" width="6" height="6" fill="#e94560" rx="1"/>
      <rect x="14" y="4" width="6" height="6" fill="#e94560" rx="1"/>
      <rect x="8" y="10" width="6" height="6" fill="#e94560" rx="1"/>
      <rect x="14" y="10" width="6" height="6" fill="#e94560" rx="1"/>
      <rect x="20" y="10" width="6" height="6" fill="#00FF9D" rx="1"/>
      <rect x="20" y="16" width="6" height="6" fill="#00FF9D" rx="1"/>
      <rect x="4" y="20" width="6" height="6" fill="#f9a825" rx="1"/>
    </svg>
  ),
  pong: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="2" y="10" width="3" height="10" fill="#00FF9D" rx="1"/>
      <rect x="27" y="12" width="3" height="10" fill="#e94560" rx="1"/>
      <circle cx="16" cy="16" r="2" fill="#fff"/>
      <line x1="16" y1="0" x2="16" y2="32" stroke="#2a2d39" strokeWidth="1" strokeDasharray="3"/>
    </svg>
  ),
  maze: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="2" y="2" width="28" height="28" fill="#16213e" rx="3"/>
      <rect x="6" y="6" width="5" height="5" fill="#e94560" rx="1"/>
      <rect x="14" y="6" width="5" height="5" fill="#0f3460" rx="1"/>
      <rect x="22" y="14" width="5" height="5" fill="#00FF9D" rx="1"/>
      <rect x="6" y="14" width="5" height="5" fill="#0f3460" rx="1"/>
      <rect x="6" y="22" width="5" height="5" fill="#0f3460" rx="1"/>
      <rect x="14" y="22" width="5" height="5" fill="#0f3460" rx="1"/>
    </svg>
  ),
  space: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#0a0a1a"/>
      <polygon points="16,4 8,24 24,24" fill="#00FF9D"/>
      <rect x="4" y="26" width="24" height="4" fill="#e94560" rx="1"/>
      <circle cx="6" cy="8" r="2" fill="#f9a825"/>
      <circle cx="26" cy="12" r="1.5" fill="#f9a825"/>
    </svg>
  ),
  racer: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
      <rect x="8" y="18" width="16" height="8" fill="#e94560" rx="2"/>
      <rect x="10" y="14" width="12" height="4" fill="#f9a825" rx="1"/>
      <rect x="6" y="22" width="4" height="4" fill="#333" rx="1"/>
      <rect x="22" y="22" width="4" height="4" fill="#333" rx="1"/>
      <line x1="0" y1="10" x2="32" y2="10" stroke="#fff" strokeWidth="1" strokeDasharray="4"/>
      <line x1="0" y1="30" x2="32" y2="30" stroke="#fff" strokeWidth="1" strokeDasharray="4"/>
    </svg>
  ),
  chess: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#c9a96e"/>
      <rect x="4" y="4" width="6" height="6" fill="#8b6914" rx="1"/>
      <rect x="16" y="4" width="6" height="6" fill="#8b6914" rx="1"/>
      <rect x="10" y="10" width="6" height="6" fill="#8b6914" rx="1"/>
      <rect x="22" y="10" width="6" height="6" fill="#8b6914" rx="1"/>
      <rect x="4" y="16" width="6" height="6" fill="#8b6914" rx="1"/>
      <rect x="16" y="16" width="6" height="6" fill="#8b6914" rx="1"/>
      <rect x="14" y="22" width="4" height="6" fill="#333" rx="1"/>
    </svg>
  ),
  hexgl: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#0a0a1a"/>
      <polygon points="16,4 26,12 26,22 16,28 6,22 6,12" fill="none" stroke="#45f3ff" strokeWidth="1.5"/>
      <polygon points="16,8 22,14 22,20 16,24 10,20 10,14" fill="#45f3ff" opacity="0.3"/>
      <rect x="2" y="24" width="28" height="3" fill="#e94560" rx="1"/>
    </svg>
  ),
  sandbox: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#87CEEB"/>
      <rect x="4" y="14" width="10" height="12" fill="#8B4513" rx="1"/>
      <rect x="6" y="10" width="6" height="4" fill="#228B22" rx="1"/>
      <rect x="18" y="10" width="10" height="16" fill="#A9A9A9" rx="1"/>
      <rect x="20" y="12" width="3" height="3" fill="#87CEEB" rx="1"/>
      <rect x="26" y="24" width="4" height="4" fill="#228B22" rx="1"/>
    </svg>
  ),
  sudoku: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
      <line x1="12" y1="0" x2="12" y2="32" stroke="#333" strokeWidth="2"/>
      <line x1="20" y1="0" x2="20" y2="32" stroke="#333" strokeWidth="2"/>
      <line x1="0" y1="12" x2="32" y2="12" stroke="#333" strokeWidth="2"/>
      <line x1="0" y1="20" x2="32" y2="20" stroke="#333" strokeWidth="2"/>
      <text x="6" y="10" fontSize="8" fill="#00FF9D" fontFamily="monospace" fontWeight="bold">5</text>
      <text x="22" y="10" fontSize="8" fill="#e94560" fontFamily="monospace" fontWeight="bold">3</text>
      <text x="22" y="30" fontSize="8" fill="#00FF9D" fontFamily="monospace" fontWeight="bold">7</text>
      <text x="14" y="18" fontSize="8" fill="#f9a825" fontFamily="monospace" fontWeight="bold">1</text>
    </svg>
  ),
  wordle: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
      <rect x="2" y="2" width="8" height="8" fill="#00FF9D" rx="1"/>
      <rect x="12" y="2" width="8" height="8" fill="#f9a825" rx="1"/>
      <rect x="22" y="2" width="8" height="8" fill="#333" rx="1"/>
      <rect x="2" y="12" width="8" height="8" fill="#333" rx="1"/>
      <rect x="12" y="12" width="8" height="8" fill="#00FF9D" rx="1"/>
      <rect x="22" y="12" width="8" height="8" fill="#f9a825" rx="1"/>
      <rect x="2" y="22" width="8" height="8" fill="#f9a825" rx="1"/>
      <rect x="12" y="22" width="8" height="8" fill="#333" rx="1"/>
      <rect x="22" y="22" width="8" height="8" fill="#00FF9D" rx="1"/>
    </svg>
  ),
  streetfighter: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#2a1a1a"/>
      <rect x="0" y="24" width="32" height="8" fill="#444"/>
      <rect x="4" y="8" width="6" height="6" fill="#fff" rx="1"/>
      <rect x="4" y="14" width="6" height="8" fill="#e94560" rx="1"/>
      <rect x="4" y="22" width="3" height="4" fill="#333" rx="1"/>
      <rect x="7" y="22" width="3" height="4" fill="#333" rx="1"/>
      <rect x="22" y="8" width="6" height="6" fill="#f9a825" rx="1"/>
      <rect x="22" y="14" width="6" height="8" fill="#e94560" rx="1"/>
      <rect x="22" y="22" width="3" height="4" fill="#333" rx="1"/>
      <rect x="25" y="22" width="3" height="4" fill="#333" rx="1"/>
      <text x="12" y="20" fontSize="7" fill="#fff" fontFamily="monospace" fontWeight="bold">VS</text>
    </svg>
  ),
  mkjs: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#1a0a0a"/>
      <rect x="0" y="24" width="32" height="8" fill="#333"/>
      <rect x="6" y="10" width="5" height="5" fill="#f5d0a9" rx="1"/>
      <rect x="6" y="15" width="5" height="7" fill="#e94560" rx="1"/>
      <rect x="6" y="22" width="3" height="4" fill="#333"/>
      <rect x="8" y="22" width="3" height="4" fill="#333"/>
      <rect x="21" y="10" width="5" height="5" fill="#f5d0a9" rx="1"/>
      <rect x="21" y="15" width="5" height="7" fill="#8b1c3a" rx="1"/>
      <rect x="21" y="22" width="3" height="4" fill="#333"/>
      <rect x="23" y="22" width="3" height="4" fill="#333"/>
      <polygon points="16,14 14,18 18,18" fill="#f9a825"/>
    </svg>
  ),
  contra: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#1a2a1a"/>
      <rect x="0" y="26" width="32" height="6" fill="#4e7c2f"/>
      <rect x="8" y="12" width="4" height="4" fill="#f5d0a9" rx="1"/>
      <rect x="8" y="16" width="5" height="8" fill="#228B22" rx="1"/>
      <rect x="8" y="24" width="3" height="4" fill="#333"/>
      <rect x="10" y="24" width="3" height="4" fill="#333"/>
      <rect x="13" y="15" width="6" height="3" fill="#666" rx="1"/>
      <rect x="19" y="14" width="2" height="5" fill="#666" rx="1"/>
      <rect x="22" y="10" width="4" height="4" fill="#e94560" rx="1"/>
      <rect x="22" y="14" width="5" height="7" fill="#8b1c3a" rx="1"/>
    </svg>
  ),
  puzzle2048: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#bbada0"/>
      <rect x="2" y="2" width="13" height="13" fill="#eee4da" rx="1"/>
      <rect x="17" y="2" width="13" height="13" fill="#ede0c8" rx="1"/>
      <rect x="2" y="17" width="13" height="13" fill="#f2b179" rx="1"/>
      <rect x="17" y="17" width="13" height="13" fill="#f59563" rx="1"/>
      <text x="5" y="12" fontSize="9" fill="#776e65" fontFamily="monospace" fontWeight="bold">2</text>
      <text x="20" y="12" fontSize="9" fill="#776e65" fontFamily="monospace" fontWeight="bold">4</text>
      <text x="5" y="27" fontSize="9" fill="#fff" fontFamily="monospace" fontWeight="bold">8</text>
      <text x="19" y="27" fontSize="7" fill="#fff" fontFamily="monospace" fontWeight="bold">16</text>
    </svg>
  ),
  sokoban: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#5d4037"/>
      <line x1="10" y1="0" x2="10" y2="32" stroke="#4e342e" strokeWidth="1"/>
      <line x1="20" y1="0" x2="20" y2="32" stroke="#4e342e" strokeWidth="1"/>
      <line x1="0" y1="10" x2="32" y2="10" stroke="#4e342e" strokeWidth="1"/>
      <line x1="0" y1="20" x2="32" y2="20" stroke="#4e342e" strokeWidth="1"/>
      <rect x="10" y="10" width="8" height="8" fill="#8B4513" stroke="#5d4037" strokeWidth="1"/>
      <rect x="12" y="12" width="4" height="4" fill="#5d4037"/>
      <rect x="4" y="4" width="4" height="4" fill="#f9a825" rx="1"/>
      <rect x="22" y="2" width="6" height="6" fill="#00FF9D" opacity="0.5" rx="1"/>
    </svg>
  ),
  minesweeper: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#c0c0c0"/>
      <line x1="10" y1="0" x2="10" y2="32" stroke="#808080" strokeWidth="1"/>
      <line x1="20" y1="0" x2="20" y2="32" stroke="#808080" strokeWidth="1"/>
      <line x1="0" y1="10" x2="32" y2="10" stroke="#808080" strokeWidth="1"/>
      <line x1="0" y1="20" x2="32" y2="20" stroke="#808080" strokeWidth="1"/>
      <rect x="2" y="2" width="8" height="8" fill="#e0e0e0"/>
      <text x="4" y="8" fontSize="7" fill="#0000ff" fontFamily="monospace" fontWeight="bold">1</text>
      <rect x="12" y="2" width="8" height="8" fill="#e0e0e0"/>
      <text x="14" y="8" fontSize="7" fill="#008000" fontFamily="monospace" fontWeight="bold">2</text>
      <rect x="22" y="12" width="8" height="8" fill="#e0e0e0"/>
      <text x="24" y="18" fontSize="7" fill="#ff0000" fontFamily="monospace" fontWeight="bold">3</text>
      <circle cx="16" cy="24" r="3" fill="#333"/>
      <line x1="13" y1="21" x2="19" y2="27" stroke="#333" strokeWidth="1"/>
      <line x1="19" y1="21" x2="13" y2="27" stroke="#333" strokeWidth="1"/>
    </svg>
  ),
  match3: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#1a1a3e"/>
      <line x1="10" y1="0" x2="10" y2="32" stroke="#333" strokeWidth="1"/>
      <line x1="20" y1="0" x2="20" y2="32" stroke="#333" strokeWidth="1"/>
      <line x1="0" y1="10" x2="32" y2="10" stroke="#333" strokeWidth="1"/>
      <line x1="0" y1="20" x2="32" y2="20" stroke="#333" strokeWidth="1"/>
      <circle cx="5" cy="5" r="3.5" fill="#e94560"/>
      <circle cx="15" cy="5" r="3.5" fill="#00FF9D"/>
      <circle cx="25" cy="5" r="3.5" fill="#f9a825"/>
      <circle cx="5" cy="15" r="3.5" fill="#f9a825"/>
      <circle cx="15" cy="15" r="3.5" fill="#e94560"/>
      <circle cx="25" cy="15" r="3.5" fill="#00FF9D"/>
      <circle cx="5" cy="25" r="3.5" fill="#00FF9D"/>
      <circle cx="15" cy="25" r="3.5" fill="#f9a825"/>
      <circle cx="25" cy="25" r="3.5" fill="#e94560"/>
    </svg>
  ),
};

// Game catalog with playable status
const GAMES = [
  { id: 'snake', title: 'SNAKE.EXE', genre: 'Arcade', tag: 'PLAYABLE', icon: 'snake', playable: true },
  { id: 'tetris', title: 'TETRIS BLOCK', genre: 'Puzzle', tag: 'PLAYABLE', icon: 'tetris', playable: true },
  { id: 'pong', title: 'PONG CLASSIC', genre: 'Sports', tag: 'PLAYABLE', icon: 'pong', playable: true },
  { id: 'maze', title: 'MAZE RUNNER', genre: 'Adventure', tag: 'PLAYABLE', icon: 'maze', playable: true },
  { id: 'space', title: 'SPACE DEFENDER', genre: 'Shooter', tag: 'PLAYABLE', icon: 'space', playable: true },
  { id: 'racer', title: 'PIXEL RACER', genre: 'Racing', tag: 'PLAYABLE', icon: 'racer', playable: true },
  { id: 'chess', title: 'LICHESS.ORG', genre: 'Strategy', tag: 'PLAYABLE', icon: 'chess', playable: true },
  { id: 'hexgl', title: 'HEXGL RACER', genre: 'Racing', tag: 'PLAYABLE', icon: 'hexgl', playable: true },
  { id: 'sandbox', title: 'SANDBOXELS', genre: 'Sandbox', tag: 'PLAYABLE', icon: 'sandbox', playable: true },
  { id: 'sudoku', title: 'SUDOKU PRO', genre: 'Puzzle', tag: 'PLAYABLE', icon: 'sudoku', playable: true },
  { id: 'wordle', title: 'WORDLE CLONE', genre: 'Puzzle', tag: 'PLAYABLE', icon: 'wordle', playable: true },
  { id: 'streetfighter', title: 'STREET FIGHTER', genre: 'Fighting', tag: 'PLAYABLE', icon: 'streetfighter', playable: true },
  { id: 'mkjs', title: 'MK.JS FIGHTING', genre: 'Fighting', tag: 'PLAYABLE', icon: 'mkjs', playable: true },
  { id: 'contra', title: 'CONTRA FORCE', genre: 'Shooter', tag: 'PLAYABLE', icon: 'contra', playable: true },
  { id: 'puzzle2048', title: '2048 PUZZLE', genre: 'Puzzle', tag: 'PLAYABLE', icon: 'puzzle2048', playable: true },
  { id: 'sokoban', title: 'SOKOBAN BOX', genre: 'Puzzle', tag: 'PLAYABLE', icon: 'sokoban', playable: true },
  { id: 'minesweeper', title: 'MINESWEEPER', genre: 'Puzzle', tag: 'PLAYABLE', icon: 'minesweeper', playable: true },
  { id: 'match3', title: 'MATCH 3 GEMS', genre: 'Puzzle', tag: 'PLAYABLE', icon: 'match3', playable: true },
];

const ALL_GENRES = ['All', ...Array.from(new Set(GAMES.map(g => g.genre))).sort()];

const GAME_COMPONENTS: Record<string, React.ReactNode> = {
  snake: <SnakeGame />,
  pong: <PongGame />,
  puzzle2048: <Puzzle2048Game />,
  tetris: <TetrisGame />,
  minesweeper: <MinesweeperGame />,
  match3: <Match3Game />,
  maze: <MazeRunnerGame />,
  space: <SpaceDefenderGame />,
  racer: <PixelRacerGame />,
  chess: <ChessGame />,
  hexgl: <HexglGame />,
  sandbox: <SandboxGame />,
  sudoku: <SudokuGame />,
  wordle: <WordleGame />,
  streetfighter: <StreetFighterGame />,
  mkjs: <MkjsGame />,
  contra: <ContraGame />,
  sokoban: <SokobanGame />,
};

const GameRoom: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const filteredGames = selectedGenre === 'All'
    ? GAMES
    : GAMES.filter(g => g.genre === selectedGenre);

  const handleCardClick = (gameId: string, playable: boolean) => {
    if (!playable) return; // Non-playable games just show hover details
    setActiveGame(gameId);
  };

  const handleBack = () => setActiveGame(null);

  // Game view
  if (activeGame) {
    return (
      <div className="game-room">
        <div className="game-view">
          <button className="back-btn" onClick={handleBack}>
            ← Back to Game Room
          </button>
          <h2 className="game-view-title">
            {GAMES.find(g => g.id === activeGame)?.title}
          </h2>
          <div className="game-canvas-wrapper">
            {GAME_COMPONENTS[activeGame] || (
              <div className="coming-soon-view">
                <div className="coming-soon-icon">🎮</div>
                <h3>Coming Soon</h3>
                <p>This game is being developed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-room">
      <header className="gr-header">
        <h1>🎮 Game Room</h1>
        <p>Select a game to play</p>
      </header>

      {/* Genre Filter */}
      <div className="gr-genre-filter">
        <div className="gr-genre-buttons">
          {ALL_GENRES.map(genre => (
            <button
              key={genre}
              className={`gr-genre-btn ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
              <span className="gr-genre-count">
                {genre === 'All' ? GAMES.length : GAMES.filter(g => g.genre === genre).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="gr-results-bar">
        <span>{filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found</span>
        {selectedGenre !== 'All' && <span className="gr-results-genre">{selectedGenre}</span>}
      </div>

      {/* Game Grid */}
      <div className="gr-grid">
        {filteredGames.map(game => (
          <div
            key={game.id}
            className={`gr-card ${hoveredGame === game.id ? 'hovered' : ''} ${!game.playable ? 'disabled' : ''}`}
            onClick={() => handleCardClick(game.id, game.playable)}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
          >
            <div className="gr-card-icon">
              {ICONS[game.icon]}
            </div>
            <h3 className="gr-card-title">{game.title}</h3>
            <div className="gr-card-meta">
              <span className="gr-card-genre">{game.genre}</span>
              <span className={`gr-card-tag ${game.playable ? 'playable' : 'coming'}`}>
                {game.tag}
              </span>
            </div>

            {hoveredGame === game.id && !game.playable && (
              <div className="gr-tooltip">
                🎮 In development — check back later!
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="gr-no-games">
          <div className="gr-no-games-icon">📭</div>
          <h3>No games found</h3>
          <p>Try selecting a different genre</p>
        </div>
      )}

      <footer className="gr-footer">
        <p>🎮 Free & open-source · No license required</p>
        <p className="gr-footer-hint">Click a PLAYABLE game to start</p>
      </footer>
    </div>
  );
};

export default GameRoom;


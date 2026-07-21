import React, { useState } from 'react';
import './GameRoom.css';

// === GAME CATALOG (12 classic arcade games from juliensimon/browser-games) ===
const GAMES = [
  {
    id: 'computer-space',
    title: 'COMPUTER SPACE',
    year: 1971,
    genre: 'Arcade',
    description: 'The first commercially sold coin-operated video game. Players control a rocket ship battling two flying saucers in a space arena, with thrust-based movement and projectile shooting mechanics — a pioneering title that started the arcade revolution.',
    tag: 'PLAYABLE',
  },
  {
    id: 'pong',
    title: 'PONG',
    year: 1972,
    genre: 'Sports',
    description: 'The first commercially successful video game. A simple yet addictive table tennis simulation where two players control paddles to bounce a ball back and forth, with the goal of scoring points against each other — the game that put the arcade industry on the map.',
    tag: 'PLAYABLE',
  },
  {
    id: 'gun-fight',
    title: 'GUN FIGHT',
    year: 1975,
    genre: 'Shooter',
    description: 'Two cowboys duel in a western shootout behind sagebrush cover. Players take aim at each other while dodging bullets in a classic wild west standoff, featuring one of the earliest uses of a microprocessor in arcade gaming.',
    tag: 'PLAYABLE',
  },
  {
    id: 'breakout',
    title: 'BREAKOUT',
    year: 1976,
    genre: 'Arcade',
    description: 'Smash through rows of colored bricks at the top of the screen using a paddle and ball. A timeless arcade classic that challenges players to clear all bricks while managing ball speed and paddle positioning — created by Atari and inspired by Pong.',
    tag: 'PLAYABLE',
  },
  {
    id: 'space-invaders',
    title: 'SPACE INVADERS',
    year: 1978,
    genre: 'Shooter',
    description: 'Defend Earth from descending alien formations. Players control a laser cannon moving horizontally, shooting rows of iconic pixel aliens that gradually speed up and march closer to the ground as they are eliminated — a global phenomenon that defined the shoot-\'em-up genre.',
    tag: 'PLAYABLE',
  },
  {
    id: 'galaxian',
    title: 'GALAXIAN',
    year: 1979,
    genre: 'Shooter',
    description: 'Dive-bombing aliens with vibrant RGB color. An evolution of Space Invaders where enemy squadrons break formation to perform kamikaze-style dive attacks, introducing colorful graphics and more dynamic enemy behavior that raised the bar for arcade shooters.',
    tag: 'PLAYABLE',
  },
  {
    id: 'asteroids',
    title: 'ASTEROIDS',
    year: 1979,
    genre: 'Shooter',
    description: 'Blast asteroids into fragments in deep space. Players pilot a spaceship through an asteroid field, shooting and splitting larger rocks into smaller, faster pieces while avoiding collision and enemy UFOs — renowned for its vector graphics and physics-based gameplay.',
    tag: 'PLAYABLE',
  },
  {
    id: 'lunar-lander',
    title: 'LUNAR LANDER',
    year: 1979,
    genre: 'Simulation',
    description: 'Guide your lunar module to a safe landing on the moon. A physics-based simulation where players manage thrust, rotation, and fuel consumption to gently land the spacecraft on designated landing pads across the cratered surface — an early triumph of realistic simulation in gaming.',
    tag: 'PLAYABLE',
  },
  {
    id: 'pac-man',
    title: 'PAC-MAN',
    year: 1980,
    genre: 'Arcade',
    description: 'Navigate the maze, eat dots, and avoid four colorful ghosts. The iconic yellow character must clear every level of all pellets while dodging Blinky, Pinky, Inky, and Clyde — with power pellets granting temporary invincibility — becoming a cultural icon of the 1980s.',
    tag: 'PLAYABLE',
  },
  {
    id: 'centipede',
    title: 'CENTIPEDE',
    year: 1980,
    genre: 'Shooter',
    description: 'Blast the centipede through a mushroom field. Players defend against a descending centipede that winds through a forest of mushrooms, with bonus enemies like spiders and fleas adding to the frantic action — celebrated for its trackball controls and vibrant psychedelic visuals.',
    tag: 'PLAYABLE',
  },
  {
    id: 'missile-command',
    title: 'MISSILE COMMAND',
    year: 1980,
    genre: 'Shooter',
    description: 'Defend six cities from nuclear missiles. Players use a trackball to aim and launch counter-missiles from three bases, intercepting incoming ballistic missiles before they destroy Earth\'s last strongholds — a tense, strategic classic with an unforgettable cinematic feel.',
    tag: 'PLAYABLE',
  },
  {
    id: 'defender',
    title: 'DEFENDER',
    year: 1981,
    genre: 'Shooter',
    description: 'Defend humanoids from alien abduction in a side-scrolling shooter. Players fly over a landscape to rescue humans from alien kidnappers, with smart bombs and a radar scanner to track threats — pushing the hardware to its limits with fast-paced action and complex controls.',
    tag: 'PLAYABLE',
  },
];

const ALL_GENRES = ['All', ...Array.from(new Set(GAMES.map(g => g.genre))).sort()];

// === Pixel-art SVG icons for each game ===
const ICONS: Record<string, React.ReactNode> = {
  'computer-space': (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#0a0a1a"/>
      <polygon points="16,4 6,28 26,28" fill="none" stroke="#45f3ff" strokeWidth="1"/>
      <circle cx="12" cy="18" r="1.5" fill="#e94560"/>
      <circle cx="20" cy="14" r="1" fill="#f9a825"/>
      <rect x="4" y="24" width="24" height="2" fill="#45f3ff" opacity="0.3"/>
    </svg>
  ),
  pong: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#000"/>
      <rect x="2" y="10" width="3" height="10" fill="#fff" rx="1"/>
      <rect x="27" y="12" width="3" height="10" fill="#fff" rx="1"/>
      <circle cx="16" cy="16" r="2" fill="#fff"/>
      <line x1="16" y1="0" x2="16" y2="32" stroke="#333" strokeWidth="1" strokeDasharray="3"/>
    </svg>
  ),
  'gun-fight': (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#4a2c0a"/>
      <rect x="0" y="26" width="32" height="6" fill="#6b4423"/>
      <rect x="4" y="14" width="4" height="12" fill="#8B4513"/>
      <rect x="4" y="12" width="6" height="3" fill="#f5d0a9"/>
      <rect x="22" y="14" width="4" height="12" fill="#8B4513"/>
      <rect x="22" y="12" width="6" height="3" fill="#f5d0a9"/>
      <rect x="8" y="20" width="6" height="2" fill="#666"/>
      <rect x="18" y="20" width="6" height="2" fill="#666"/>
      <circle cx="7" cy="13" r="2" fill="#f9a825"/>
    </svg>
  ),
  breakout: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
      <rect x="2" y="2" width="28" height="4" fill="#e94560" rx="1"/>
      <rect x="2" y="7" width="28" height="4" fill="#f9a825" rx="1"/>
      <rect x="2" y="12" width="28" height="4" fill="#45f3ff" rx="1"/>
      <rect x="2" y="17" width="28" height="4" fill="#00FF9D" rx="1"/>
      <rect x="10" y="24" width="12" height="3" fill="#fff" rx="1"/>
      <circle cx="16" cy="23" r="1.5" fill="#fff"/>
    </svg>
  ),
  'space-invaders': (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#000"/>
      <rect x="6" y="4" width="4" height="4" fill="#45f3ff"/>
      <rect x="14" y="4" width="4" height="4" fill="#45f3ff"/>
      <rect x="22" y="4" width="4" height="4" fill="#45f3ff"/>
      <rect x="4" y="10" width="6" height="4" fill="#e94560"/>
      <rect x="14" y="10" width="4" height="4" fill="#e94560"/>
      <rect x="22" y="10" width="6" height="4" fill="#e94560"/>
      <rect x="10" y="16" width="4" height="4" fill="#f9a825"/>
      <rect x="18" y="16" width="4" height="4" fill="#f9a825"/>
      <rect x="12" y="24" width="8" height="4" fill="#00FF9D"/>
    </svg>
  ),
  galaxian: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#0a0a2e"/>
      <rect x="8" y="4" width="16" height="6" fill="#e94560" rx="1"/>
      <rect x="6" y="10" width="4" height="4" fill="#f9a825"/>
      <rect x="22" y="10" width="4" height="4" fill="#f9a825"/>
      <rect x="12" y="14" width="8" height="4" fill="#45f3ff"/>
      <rect x="14" y="18" width="4" height="4" fill="#fff"/>
      <circle cx="8" cy="8" r="1" fill="#fff" opacity="0.5"/>
      <circle cx="24" cy="6" r="1" fill="#fff" opacity="0.5"/>
      <circle cx="16" cy="2" r="1" fill="#fff" opacity="0.5"/>
    </svg>
  ),
  asteroids: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#000"/>
      <polygon points="16,4 12,12 20,12" fill="none" stroke="#fff" strokeWidth="1"/>
      <polygon points="12,12 8,20 16,24 20,20 20,12" fill="none" stroke="#45f3ff" strokeWidth="1"/>
      <circle cx="6" cy="8" r="3" fill="none" stroke="#666" strokeWidth="1"/>
      <circle cx="26" cy="22" r="4" fill="none" stroke="#666" strokeWidth="1"/>
      <circle cx="26" cy="22" r="1" fill="#666"/>
      <circle cx="10" cy="26" r="2" fill="none" stroke="#666" strokeWidth="1"/>
    </svg>
  ),
  'lunar-lander': (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#000"/>
      <rect x="0" y="26" width="32" height="6" fill="#444"/>
      <polygon points="14,16 12,26 20,26 18,16" fill="#666"/>
      <rect x="15" y="12" width="2" height="5" fill="#fff"/>
      <polygon points="12,26 10,28 14,28" fill="#e94560"/>
      <polygon points="20,26 18,28 22,28" fill="#e94560"/>
      <rect x="14" y="20" width="4" height="2" fill="#f9a825"/>
      <circle cx="16" cy="18" r="1" fill="#45f3ff"/>
    </svg>
  ),
  'pac-man': (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#000"/>
      <rect x="4" y="4" width="24" height="24" fill="#1a1a4e" rx="2"/>
      <circle cx="16" cy="16" r="6" fill="#f9a825"/>
      <polygon points="16,16 22,11 22,21" fill="#000"/>
      <circle cx="12" cy="10" r="1" fill="#fff"/>
      <circle cx="20" cy="10" r="1" fill="#fff"/>
      <circle cx="8" cy="14" r="2" fill="#e94560"/>
      <circle cx="24" cy="14" r="2" fill="#45f3ff"/>
    </svg>
  ),
  centipede: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#0a1a0a"/>
      <circle cx="4" cy="6" r="2" fill="#e94560"/>
      <circle cx="8" cy="6" r="2" fill="#e94560"/>
      <circle cx="12" cy="6" r="2" fill="#e94560"/>
      <circle cx="16" cy="8" r="2" fill="#e94560"/>
      <circle cx="20" cy="10" r="2" fill="#e94560"/>
      <circle cx="24" cy="12" r="2" fill="#e94560"/>
      <circle cx="26" cy="16" r="2" fill="#e94560"/>
      <rect x="2" y="16" width="3" height="3" fill="#45f3ff"/>
      <rect x="8" y="20" width="3" height="3" fill="#45f3ff"/>
      <rect x="14" y="24" width="3" height="3" fill="#45f3ff"/>
      <rect x="20" y="22" width="3" height="3" fill="#45f3ff"/>
      <rect x="4" y="28" width="24" height="4" fill="#4a2c0a"/>
    </svg>
  ),
  'missile-command': (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#000"/>
      <rect x="2" y="24" width="6" height="8" fill="#444"/>
      <rect x="13" y="24" width="6" height="8" fill="#444"/>
      <rect x="24" y="24" width="6" height="8" fill="#444"/>
      <circle cx="10" cy="6" r="2" fill="#e94560"/>
      <circle cx="22" cy="10" r="2" fill="#f9a825"/>
      <circle cx="16" cy="4" r="2" fill="#45f3ff"/>
      <line x1="5" y1="24" x2="10" y2="6" stroke="#f9a825" strokeWidth="1"/>
      <line x1="16" y1="24" x2="16" y2="4" stroke="#45f3ff" strokeWidth="1"/>
      <line x1="27" y1="24" x2="22" y2="10" stroke="#e94560" strokeWidth="1"/>
    </svg>
  ),
  defender: (
    <svg viewBox="0 0 32 32" className="game-icon">
      <rect x="0" y="0" width="32" height="32" fill="#000"/>
      <rect x="0" y="2" width="32" height="6" fill="#0a2a0a"/>
      <polygon points="16,8 10,24 22,24" fill="#45f3ff"/>
      <rect x="6" y="24" width="4" height="4" fill="#f9a825"/>
      <rect x="22" y="24" width="4" height="4" fill="#e94560"/>
      <rect x="14" y="20" width="4" height="8" fill="#45f3ff"/>
      <circle cx="8" cy="12" r="2" fill="#e94560"/>
      <circle cx="24" cy="14" r="2" fill="#f9a825"/>
      <rect x="2" y="28" width="28" height="4" fill="#333"/>
      <rect x="0" y="2" width="32" height="1" fill="#00FF9D" opacity="0.5"/>
      <rect x="0" y="6" width="32" height="1" fill="#00FF9D" opacity="0.5"/>
    </svg>
  ),
};

const GameRoom: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const filteredGames = selectedGenre === 'All'
    ? GAMES
    : GAMES.filter(g => g.genre === selectedGenre);

  const handleCardClick = (gameId: string) => {
    setActiveGame(gameId);
  };

  const handleBack = () => setActiveGame(null);

  // === GAME VIEW (iframe) ===
  if (activeGame) {
    const game = GAMES.find(g => g.id === activeGame)!;
    return (
      <div className="game-room">
        <div className="game-view">
          <button className="back-btn" onClick={handleBack}>
            ← Back to Game Room
          </button>
          <h2 className="game-view-title">
            {game.title} ({game.year})
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
            {game.description}
          </p>
          <div className="game-canvas-wrapper">
            <iframe
              src={`/browser-games/${activeGame}/index.html`}
              title={game.title}
              className="game-iframe"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    );
  }

  // === GRID VIEW ===
  return (
    <div className="game-room">
      <header className="gr-header">
        <h1>🎮 Classic Arcade</h1>
        <p>12 faithfully recreated retro games — no dependencies, just play</p>
      </header>

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

      <div className="gr-results-bar">
        <span>{filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found</span>
        {selectedGenre !== 'All' && <span className="gr-results-genre">{selectedGenre}</span>}
      </div>

      <div className="gr-grid">
        {filteredGames.map(game => (
          <div
            key={game.id}
            className="gr-card"
            onClick={() => handleCardClick(game.id)}
          >
            <div className="gr-card-icon">
              {ICONS[game.id]}
            </div>
            <h3 className="gr-card-title">{game.title}</h3>
            <div className="gr-card-meta">
              <span className="gr-card-genre">{game.genre}</span>
              <span className="gr-card-year">{game.year}</span>
              <span className="gr-card-tag playable">
                {game.tag}
              </span>
            </div>
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
        <p>🎮 Classic arcade games recreated in vanilla JS + Canvas</p>
        <p className="gr-footer-hint">
          <a href="https://github.com/juliensimon/browser-games" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            github.com/juliensimon/browser-games
          </a>
        </p>
        <p className="gr-disclaimer" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
          Fan recreations for educational purposes. All original games are trademarks of their respective owners.
        </p>
        <p className="gr-credits" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontWeight: 700 }}>
          Thanks to <a href="https://github.com/carlos-aguayo" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Carlos Aguayo</a> and <a href="https://github.com/juliensimon" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Julien Simon</a>
        </p>
      </footer>
    </div>
  );
};

export default GameRoom;


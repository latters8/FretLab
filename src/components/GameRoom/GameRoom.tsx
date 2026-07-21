import React, { useState, useEffect } from 'react';
import styles from './GameRoom.module.css';

// ============================================================
//  ICONS — pixel-art SVG (32×32 viewBox)
// ============================================================

const ShellShockersIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
    <rect x="4" y="12" width="12" height="8" fill="#e94560" rx="2"/>
    <rect x="16" y="14" width="12" height="4" fill="#f9a825" rx="1"/>
    <circle cx="8" cy="16" r="2" fill="#fff"/>
    <rect x="22" y="10" width="6" height="12" fill="#333" rx="1"/>
  </svg>
);

const KrunkerIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#2a1a1a"/>
    <rect x="6" y="8" width="8" height="8" fill="#00FF9D" rx="1"/>
    <rect x="18" y="8" width="8" height="8" fill="#e94560" rx="1"/>
    <rect x="10" y="20" width="12" height="4" fill="#f9a825" rx="1"/>
    <line x1="16" y1="4" x2="16" y2="28" stroke="#333" strokeWidth="1"/>
  </svg>
);

const SmashKartsIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
    <rect x="6" y="18" width="20" height="8" fill="#e94560" rx="3"/>
    <rect x="8" y="14" width="16" height="4" fill="#f9a825" rx="1"/>
    <rect x="4" y="22" width="4" height="4" fill="#333" rx="1"/>
    <rect x="24" y="22" width="4" height="4" fill="#333" rx="1"/>
    <circle cx="26" cy="12" r="3" fill="#00FF9D"/>
  </svg>
);

const ZombsRoyaleIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#0a1a0a"/>
    <rect x="10" y="6" width="12" height="12" fill="#4e7c2f" rx="2"/>
    <rect x="12" y="8" width="8" height="8" fill="#2a5a1a" rx="1"/>
    <rect x="8" y="20" width="4" height="8" fill="#8B4513" rx="1"/>
    <rect x="20" y="20" width="4" height="8" fill="#8B4513" rx="1"/>
    <circle cx="16" cy="4" r="3" fill="#f9a825" opacity="0.6"/>
  </svg>
);

const SlitherIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#0a1a2e"/>
    <circle cx="8" cy="8" r="5" fill="#00FF9D"/>
    <circle cx="16" cy="12" r="4" fill="#00cc7a"/>
    <circle cx="22" cy="18" r="3" fill="#00995c"/>
    <circle cx="26" cy="24" r="2" fill="#00663d"/>
    <circle cx="6" cy="6" r="2" fill="#fff"/>
  </svg>
);

const PaperIoIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
    <rect x="4" y="4" width="10" height="10" fill="#e94560" rx="1"/>
    <rect x="16" y="4" width="10" height="10" fill="#00FF9D" rx="1"/>
    <rect x="4" y="16" width="10" height="10" fill="#f9a825" rx="1"/>
    <rect x="16" y="16" width="10" height="10" fill="#2196f3" rx="1"/>
    <rect x="14" y="14" width="4" height="4" fill="#fff" rx="1"/>
  </svg>
);

const DiepIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
    <circle cx="16" cy="16" r="8" fill="#00FF9D"/>
    <rect x="16" y="8" width="12" height="4" fill="#f9a825" rx="1"/>
    <circle cx="12" cy="13" r="2" fill="#fff"/>
    <circle cx="20" cy="13" r="2" fill="#fff"/>
    <rect x="10" y="22" width="12" height="3" fill="#333" rx="1"/>
  </svg>
);

const BloxdIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#87CEEB"/>
    <rect x="4" y="14" width="10" height="12" fill="#8B4513" rx="1"/>
    <rect x="6" y="10" width="6" height="4" fill="#228B22" rx="1"/>
    <rect x="18" y="10" width="10" height="16" fill="#A9A9A9" rx="1"/>
    <rect x="20" y="12" width="3" height="3" fill="#87CEEB" rx="1"/>
    <rect x="26" y="24" width="4" height="4" fill="#228B22" rx="1"/>
  </svg>
);

const LolBeansIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#ff6b9d"/>
    <circle cx="10" cy="12" r="5" fill="#f9a825"/>
    <circle cx="22" cy="12" r="5" fill="#00FF9D"/>
    <circle cx="8" cy="11" r="1.5" fill="#000"/>
    <circle cx="20" cy="11" r="1.5" fill="#000"/>
    <rect x="6" y="20" width="20" height="6" fill="#e94560" rx="3"/>
    <circle cx="16" cy="23" r="2" fill="#fff"/>
  </svg>
);

const SoccerIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#2a5a1a"/>
    <circle cx="16" cy="16" r="8" fill="#fff"/>
    <polygon points="16,10 20,14 18,19 14,19 12,14" fill="#333"/>
    <rect x="2" y="14" width="4" height="4" fill="#fff" rx="1"/>
    <rect x="26" y="14" width="4" height="4" fill="#fff" rx="1"/>
  </svg>
);

const RockRacingIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#1a0a2e"/>
    <rect x="0" y="24" width="32" height="8" fill="#333"/>
    <rect x="4" y="16" width="10" height="6" fill="#e94560" rx="2"/>
    <rect x="18" y="14" width="10" height="6" fill="#f9a825" rx="2"/>
    <rect x="6" y="22" width="3" height="3" fill="#333" rx="1"/>
    <rect x="10" y="22" width="3" height="3" fill="#333" rx="1"/>
    <rect x="20" y="20" width="3" height="3" fill="#333" rx="1"/>
    <rect x="24" y="20" width="3" height="3" fill="#333" rx="1"/>
    <text x="6" y="12" fontSize="6" fill="#f9a825" fontFamily="monospace" fontWeight="bold">RNR</text>
  </svg>
);

const TetrisIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#1a1a2e"/>
    <rect x="8" y="4" width="6" height="6" fill="#e94560" rx="1"/>
    <rect x="14" y="4" width="6" height="6" fill="#e94560" rx="1"/>
    <rect x="8" y="10" width="6" height="6" fill="#e94560" rx="1"/>
    <rect x="14" y="10" width="6" height="6" fill="#e94560" rx="1"/>
    <rect x="20" y="10" width="6" height="6" fill="#00FF9D" rx="1"/>
    <rect x="20" y="16" width="6" height="6" fill="#00FF9D" rx="1"/>
    <rect x="4" y="20" width="6" height="6" fill="#f9a825" rx="1"/>
  </svg>
);

const SkribblIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#f5f5dc"/>
    <rect x="4" y="4" width="24" height="20" fill="#fff" rx="2" stroke="#333" strokeWidth="1"/>
    <path d="M8 20 Q12 12 16 16 T24 10" fill="none" stroke="#e94560" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 18 Q14 14 18 18" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="24" r="4" fill="#f9a825"/>
    <text x="22" y="26" fontSize="5" fill="#fff" fontWeight="bold">?</text>
  </svg>
);

const HoleIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#87CEEB"/>
    <rect x="4" y="20" width="8" height="8" fill="#8B4513" rx="1"/>
    <rect x="14" y="16" width="6" height="6" fill="#4e7c2f" rx="1"/>
    <rect x="22" y="22" width="6" height="4" fill="#666" rx="1"/>
    <circle cx="16" cy="18" r="6" fill="#1a1a2e"/>
    <circle cx="14" cy="16" r="2" fill="#e94560"/>
    <circle cx="18" cy="20" r="1.5" fill="#f9a825"/>
  </svg>
);

const PoolIcon = () => (
  <svg viewBox="0 0 32 32" className={styles.gameIcon}>
    <rect x="0" y="0" width="32" height="32" fill="#1a5c1a"/>
    <rect x="2" y="2" width="28" height="28" fill="#2a7c2a" rx="2"/>
    <circle cx="16" cy="16" r="10" fill="#1a5c1a"/>
    <circle cx="16" cy="16" r="9" fill="none" stroke="#3a9c3a" strokeWidth="0.5"/>
    <circle cx="12" cy="12" r="2.5" fill="#fff"/>
    <circle cx="12" cy="12" r="2.5" fill="none" stroke="#333" strokeWidth="0.5"/>
    <circle cx="20" cy="12" r="2.5" fill="#e94560"/>
    <circle cx="20" cy="12" r="2.5" fill="none" stroke="#333" strokeWidth="0.5"/>
    <circle cx="16" cy="20" r="2.5" fill="#f9a825"/>
    <circle cx="16" cy="20" r="2.5" fill="none" stroke="#333" strokeWidth="0.5"/>
    <circle cx="16" cy="16" r="1.8" fill="#fff"/>
    <circle cx="16" cy="16" r="1.8" fill="none" stroke="#333" strokeWidth="0.5"/>
    <circle cx="4" cy="4" r="1.5" fill="#000"/>
    <circle cx="28" cy="4" r="1.5" fill="#000"/>
    <circle cx="4" cy="28" r="1.5" fill="#000"/>
    <circle cx="28" cy="28" r="1.5" fill="#000"/>
    <circle cx="16" cy="4" r="1.5" fill="#000"/>
    <circle cx="16" cy="28" r="1.5" fill="#000"/>
  </svg>
);

// ============================================================
//  GAME DATA
// ============================================================

interface GameData {
  id: string;
  title: string;
  genre: string;
  section: 'shooter' | 'racing' | 'battle' | 'arcade' | 'puzzle' | 'sports' | 'retro'| 'party';
  description: string;
  url: string;
  icon: React.ReactNode;
  players: string;
  mobile: boolean;
}

const GAMES: GameData[] = [
  {
    id: 'shellshockers',
    title: 'SHELL SHOCKERS',
    genre: 'Shooter',
    section: 'shooter',
    description: 'FPS with egg characters. Shoot, crack, respawn.',
    url: 'https://shellshock.io',
    icon: <ShellShockersIcon />,
    players: 'Multiplayer',
    mobile: false,
  },
  {
    id: 'krunker',
    title: 'KRUNKER.IO',
    genre: 'Shooter',
    section: 'shooter',
    description: 'Fast-paced FPS. Custom maps, skins, ranked.',
    url: 'https://krunker.io',
    icon: <KrunkerIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'smashkarts',
    title: 'SMASH KARTS',
    genre: 'Racing',
    section: 'racing',
    description: 'Kart racing with guns. Power-ups, chaos fun.',
    url: 'https://smashkarts.io',
    icon: <SmashKartsIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'zombsroyale',
    title: 'ZOMBSROYALE',
    genre: 'Battle Royale',
    section: 'battle',
    description: '100 players, last one standing. Build, loot, win.',
    url: 'https://zombsroyale.io',
    icon: <ZombsRoyaleIcon />,
    players: '100 Players',
    mobile: true,
  },
  {
    id: 'slither',
    title: 'SLITHER.IO',
    genre: 'Arcade',
    section: 'arcade',
    description: 'Grow your snake. Eat or be eaten. Simple addicting.',
    url: 'https://slither.io',
    icon: <SlitherIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'paperio',
    title: 'PAPER.IO 2',
    genre: 'Arcade',
    section: 'arcade',
    description: 'Capture territory. Cut enemies. Expand your empire.',
    url: 'https://paper-io.com',
    icon: <PaperIoIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'diep',
    title: 'DIEP.IO',
    genre: 'Arcade',
    section: 'arcade',
    description: 'Tank battles. Destroy, upgrade, dominate.',
    url: 'https://diep.io',
    icon: <DiepIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'bloxd',
    title: 'BLOXD.IO',
    genre: 'Puzzle',
    section: 'puzzle',
    description: 'Minecraft-style sandbox. Parkour, build, explore.',
    url: 'https://bloxd.io',
    icon: <BloxdIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'lolbeans',
    title: 'LOL BEANS',
    genre: 'Quest',
    section: 'puzzle',
    description: 'Fall Guys in browser. Obstacles, races, fun.',
    url: 'https://lolbeans.io',
    icon: <LolBeansIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'soccer',
    title: 'WORLD CUP 2026',
    genre: 'Sports',
    section: 'sports',
    description: '1v1 soccer battles. Play as Ronaldo, Messi, Mbappe.',
    url: 'https://html5.gamedistribution.com/ad37a85f16e246fabdc818f375a5eb45/',
    icon: <SoccerIcon />,
    players: '1v1 / CPU',
    mobile: true,
  },
  {
    id: 'rockracing',
    title: 'ROCK N ROLL RACING',
    genre: 'Racing',
    section: 'retro',
    description: 'SNES classic. Weapons, boosts, heavy metal soundtrack.',
    url: 'https://www.retrogames.cc/embed/24053-rock-n-roll-racing-usa.html',
    icon: <RockRacingIcon />,
    players: 'Single',
    mobile: false,
  },
  {
    id: 'tetris',
    title: 'TETRIS',
    genre: 'Puzzle',
    section: 'puzzle',
    description: 'Classic block puzzle. Clear lines, survive.',
    url: 'https://tetris.com/play-tetris',
    icon: <TetrisIcon />,
    players: 'Single',
    mobile: true,
  },
  {
    id: 'skribbl',
    title: 'SKRIBBL.IO',
    genre: 'Party',
    section: 'party',
    description: 'Pictionary in browser. Draw, guess, laugh with friends.',
    url: 'https://skribbl.io',
    icon: <SkribblIcon />,
    players: '2-8 Players',
    mobile: true,
  },
  {
    id: 'hole',
    title: 'HOLE.IO',
    genre: 'Arcade',
    section: 'arcade',
    description: 'Control a black hole. Devour everything — cars, buildings, the whole city!',
    url: 'https://holeonline.io',
    icon: <HoleIcon />,
    players: 'Multiplayer',
    mobile: true,
  },
  {
    id: 'pool',
    title: '8 BALL POOL',
    genre: 'Sports',
    section: 'sports',
    description: 'Classic 8-ball billiards. Aim, power, spin — pocket them all.',
    url: 'https://www.coolmathgames.com/0-8-ball-pool',
    icon: <PoolIcon />,
    players: '1v1 / CPU',
    mobile: true,
  },
];

// ============================================================
//  SECTIONS & FILTERS
// ============================================================

interface SectionDef {
  key: string;
  label: string;
  emoji: string;
}

const SECTIONS: SectionDef[] = [
  { key: 'all', label: 'ALL', emoji: '🎮' },
  { key: 'shooter', label: 'SHOOTER', emoji: '🔫' },
  { key: 'racing', label: 'RACING', emoji: '🏎️' },
  { key: 'battle', label: 'BATTLE', emoji: '⚔️' },
  { key: 'arcade', label: 'ARCADE', emoji: '🎯' },
  { key: 'puzzle', label: 'PUZZLE', emoji: '🧩' },
  { key: 'party', label: 'PARTY', emoji: '🎉' },
  { key: 'sports', label: 'SPORTS', emoji: '⚽' },
  { key: 'retro', label: 'RETRO', emoji: '🕹️' },
];

// ============================================================
//  COMPONENT
// ============================================================

const GameRoom: React.FC = () => {
  const [activeSection, setActiveSection] = useState('all');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const activeGameData = activeGame ? GAMES.find(g => g.id === activeGame) : null;

  const filteredGames = activeSection === 'all'
    ? GAMES
    : GAMES.filter(g => g.section === activeSection);

  const openGame = (gameId: string) => {
    setActiveGame(gameId);
  };

  const closeGame = () => {
    setActiveGame(null);
  };

  const openFullscreen = () => {
    if (activeGameData) {
      window.open(activeGameData.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Keyboard: Escape closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeGame) {
        closeGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeGame]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (activeGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeGame]);

  return (
    <div className={styles.gameRoom}>
      {/* ===== HEADER ===== */}
      <header className={styles.grHeader}>
        <h1>🎮 Game Room</h1>
        <p>Free no-install browser games to relax 😄</p>
      </header>

      {/* ===== SECTION TABS ===== */}
      <div className={styles.grSectionTabs}>
        {SECTIONS.map(sec => {
          const count = sec.key === 'all'
            ? GAMES.length
            : GAMES.filter(g => g.section === sec.key).length;
          return (
            <button
              key={sec.key}
              className={`${styles.grSectionBtn} ${activeSection === sec.key ? styles.active : ''}`}
              onClick={() => setActiveSection(sec.key)}
            >
              <span>{sec.emoji}</span>
              <span>{sec.label}</span>
              <span className={styles.grSectionCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ===== RESULTS BAR ===== */}
      <div className={styles.grResultsBar}>
        <span>{filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}</span>
        {activeSection !== 'all' && (
          <span className={styles.grResultsSection}>
            {SECTIONS.find(s => s.key === activeSection)?.emoji} {SECTIONS.find(s => s.key === activeSection)?.label}
          </span>
        )}
      </div>

      {/* ===== GAMES GRID ===== */}
      <div className={styles.grGrid}>
        {filteredGames.map(game => (
          <div
            key={game.id}
            className={`${styles.grCard} ${hoveredGame === game.id ? styles.hovered : ''}`}
            onClick={() => openGame(game.id)}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
          >
            <div className={styles.grCardIcon}>
              {game.icon}
            </div>
            <h3 className={styles.grCardTitle}>{game.title}</h3>
            <div className={styles.grCardMeta}>
              <span className={styles.grCardGenre}>{game.genre}</span>
              <span className={`${styles.grCardTag} ${styles[game.section]}`}>
                {game.section.toUpperCase()}
              </span>
            </div>
            <div className={styles.grCardFooter}>
              <span className={styles.grCardPlayers}>👤 {game.players}</span>
              {game.mobile && <span className={styles.grCardMobile}>📱</span>}
            </div>

            {hoveredGame === game.id && (
              <div className={styles.grTooltip}>
                <p>{game.description}</p>
                <span className={styles.grTooltipHint}>Click to preview</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== EMPTY STATE ===== */}
      {filteredGames.length === 0 && (
        <div className={styles.grNoGames}>
          <div className={styles.grNoGamesIcon}>📭</div>
          <h3>No games found</h3>
          <p>Try a different section</p>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className={styles.grFooter}>
        <p>🎮 Free browser games · No install required</p>
        <p className={styles.grFooterHint}>Click any game for preview · Fullscreen for best controls</p>
      </footer>

      {/* ===== GAME MODAL ===== */}
      {activeGame && activeGameData && (
        <div className={styles.grModalOverlay} onClick={closeGame}>
          <div className={styles.grModalContent} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className={styles.grModalHeader}>
              <div className={styles.grModalTitleRow}>
                <div className={styles.grModalIcon}>{activeGameData.icon}</div>
                <div>
                  <h2>{activeGameData.title}</h2>
                  <div className={styles.grModalMeta}>
                    <span className={styles.grModalGenre}>{activeGameData.genre}</span>
                    <span className={styles.grModalPlayers}>👤 {activeGameData.players}</span>
                    {activeGameData.mobile && <span className={styles.grModalMobile}>📱 Mobile</span>}
                  </div>
                </div>
              </div>
              <div className={styles.grModalActions}>
                <button
                  className={styles.grModalBtnFullscreen}
                  onClick={openFullscreen}
                  title="Open in new tab for best controls"
                >
                  ⛶ Fullscreen
                </button>
                <button
                  className={styles.grModalBtnClose}
                  onClick={closeGame}
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Iframe */}
            <div className={styles.grIframeWrapper}>
              <iframe
                src={activeGameData.url}
                title={activeGameData.title}
                className={styles.grIframe}
                allow="fullscreen; autoplay; clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock"
                loading="eager"
              />
              {/* Overlay hint for shooters */}
              {(activeGameData.section === 'shooter' || activeGameData.section === 'battle') && (
                <div className={styles.grIframeHint}>
                  <p>🖱️ Mouse controls may be limited in preview</p>
                  <button onClick={openFullscreen} className={styles.grIframeHintBtn}>
                    ⛶ Open Fullscreen
                  </button>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className={styles.grModalFooter}>
              <p>{activeGameData.description}</p>
              <button onClick={openFullscreen} className={styles.grModalFooterBtn}>
                ▶ Play in Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
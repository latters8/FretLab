// src/components/layout/AppShell.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import DiatonicChords from '../tools/DiatonicChords';
import ChordDictionary from '../tools/ChordDictionary';
import SoloGenerator from '../tools/SoloGenerator';
import ToolBox from '../tools/ToolBox';
import PracticeDashboard from '../PracticeDashboard';
import GameRoom from '../GameRoom/GameRoom';
import { useMusic } from '../../context/MusicContext';

type ModuleType = 'engine' | 'dictionary' | 'autotab' | 'practice' | 'gameroom';

const MODULES = {
  engine: { icon: '🎸', title: 'Fretboard Engine', description: 'Interactive fretboard with playback' },
  dictionary: { icon: '📖', title: 'Chord Dictionary', description: 'Explore chords and voicings' },
  autotab: { icon: '🎼', title: 'Solo Generator', description: 'AI-powered solo generation' },
  practice: { icon: '🏋️', title: 'Practice Dashboard', description: 'Track your progress' },
  gameroom: { icon: '🎮', title: 'Game Room', description: 'Take a break with open-source games' },
} as const;

const AppShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('engine');
  const [aiTargetChord, setAiTargetChord] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { setBpm } = useMusic();

  const handleAIAction = useCallback((action: any) => {
    if (!action) return;

    console.log('🔊 AppShell received action:', action);

    const switchModule = (module: ModuleType) => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveModule(module);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 200);
    };

    switch (action.type) {
      case 'SET_BPM':
        if (action.payload?.bpm) {
          setBpm(action.payload.bpm);
          console.log('🎵 BPM set to:', action.payload.bpm);
        }
        break;

      case 'OPEN_CHORD':
        setAiTargetChord(action.payload?.chord || null);
        switchModule('dictionary');
        break;

      case 'OPEN_TAB_GEN':
      case 'OPEN_AUTOTAB':
        switchModule('autotab');
        break;

      case 'OPEN_ENGINE':
        switchModule('engine');
        break;

      case 'OPEN_PRACTICE':
        switchModule('practice');
        break;

      case 'SEARCH_BACKING':
      case 'SEARCH_YOUTUBE':
        switchModule('engine');
        const ytQuery = encodeURIComponent(action.payload?.query || 'guitar backing track');
        window.open(`https://www.youtube.com/results?search_query=${ytQuery}`, '_blank', 'noopener,noreferrer');
        break;

      case 'SEARCH_VK':
        const vkQuery = encodeURIComponent(action.payload?.query || '');
        window.open(`https://vk.com/video?q=${vkQuery}`, '_blank', 'noopener,noreferrer');
        break;

      case 'SEARCH_RUTUBE':
        const ruQuery = encodeURIComponent(action.payload?.query || '');
        window.open(`https://rutube.ru/search/?query=${ruQuery}`, '_blank', 'noopener,noreferrer');
        break;

      case 'SET_CONTEXT':
        console.log('🎯 Setting context:', action.payload);
        break;

      default:
        console.warn('⚠️ Unknown action type:', action.type);
    }
  }, [setBpm]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const modules: ModuleType[] = ['engine', 'dictionary', 'autotab', 'practice', 'gameroom'];
        const index = parseInt(e.key) - 1;
        if (index < modules.length) {
          setActiveModule(modules[index]);
        }
      }
      if (e.key === 'Escape') {
        setAiTargetChord(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleModuleClick = (module: ModuleType) => {
    setActiveModule(module);
  };

  const renderNavIcon = (module: ModuleType) => {
    const isActive = activeModule === module;
    const config = MODULES[module];

    return (
      <div 
        onClick={() => handleModuleClick(module)}
        className={`nav-icon ${isActive ? 'nav-icon-active' : ''}`}
        title={config.title}
      >
        {config.icon}
        {isActive && (
          <>
            <div className="nav-dot nav-dot-bottom" />
            <div className="nav-dot nav-dot-top" />
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'engine':
        return (
          <>
            <main className="center-column">
              <Player />
              <div className="fretboard-scroll-wrapper">
                <Fretboard />
              </div>
              <Tablature />
            </main>

            <aside className="right-column mobile-order-after">
              <CircleOfFifths />
              <DiatonicChords />
              <ToolBox />
            </aside>
          </>
        );

      case 'dictionary':
        return (
          <main className="center-column" style={{ overflowY: 'hidden' }}>
            <ChordDictionary targetChord={aiTargetChord} />
          </main>
        );

      case 'autotab':
        return (
          <main className="center-column" style={{ overflowY: 'hidden' }}>
            <SoloGenerator />
          </main>
        );

      case 'practice':
        return (
          <main className="center-column" style={{ overflowY: 'hidden' }}>
            <PracticeDashboard />
          </main>
        );

      case 'gameroom':
        return (
          <main className="center-column" style={{ overflowY: 'auto', padding: 0 }}>
            <GameRoom />
          </main>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Header onAIAction={handleAIAction} />

      <div className="app-main">
        <div className="app-layout">
          <aside className="left-sidebar">
            {renderNavIcon('engine')}
            {renderNavIcon('dictionary')}
            {renderNavIcon('autotab')}
            {renderNavIcon('practice')}
            {renderNavIcon('gameroom')}

            <div className="sidebar-footer desktop-only">
              <span className="version-text">v2.0.0</span>
              <span className="shortcut-text">Ctrl+1-5</span>
            </div>
          </aside>

          <div className={`main-workspace ${isTransitioning ? 'transitioning' : ''}`}>
            {renderContent()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { 
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% { 
            opacity: 0.5;
            transform: translateX(-50%) scale(1.5);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .center-column {
          animation: fadeIn 0.3s ease;
        }

        .nav-icon {
          padding: 12px;
          background: transparent;
          color: var(--text-muted);
          border-radius: 12px;
          cursor: pointer;
          font-size: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          transform: scale(1);
        }

        .nav-icon:hover {
          color: var(--text-primary);
          transform: scale(1.05);
        }

        .nav-icon-active {
          background: var(--bg-hover);
          color: var(--accent);
          transform: scale(1.1);
          box-shadow: inset 0 0 30px rgba(0,255,157,0.05);
        }

        .nav-dot {
          position: absolute;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 20px var(--accent);
          animation: pulse-dot 2s infinite;
        }

        .nav-dot-bottom {
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
        }

        .nav-dot-top {
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          animation-duration: 1.5s;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
          width: 80%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .version-text {
          font-size: 10px;
          color: var(--text-muted);
          opacity: 0.5;
          text-align: center;
        }

        .shortcut-text {
          font-size: 8px;
          color: var(--text-muted);
          opacity: 0.3;
          text-align: center;
        }

        .app-main {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .main-workspace {
          position: relative;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .main-workspace.transitioning {
          opacity: 0.8;
        }

        .right-column::-webkit-scrollbar,
        .center-column::-webkit-scrollbar {
          width: 4px;
        }

        .right-column::-webkit-scrollbar-track,
        .center-column::-webkit-scrollbar-track {
          background: transparent;
        }

        .right-column::-webkit-scrollbar-thumb,
        .center-column::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 2px;
        }

        .right-column::-webkit-scrollbar-thumb:hover,
        .center-column::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default AppShell;
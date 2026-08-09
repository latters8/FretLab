// src/components/layout/AppShell.tsx

import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
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
import SEOHead from '../SEOHead';
import { RigPanel } from '../FretLabRig/RigPanel';
import { useMusic } from '../../context/MusicContext';
import { IconButton } from '../ui/IconButton';
import { useTranslation } from '../../context/LocaleContext';

type ModuleType = 'engine' | 'dictionary' | 'autotab' | 'rig' | 'practice' | 'gameroom';

const AppShell: React.FC = () => {
  const { t } = useTranslation();
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

case 'OPEN_ENGINE':
        switchModule('engine');
        break;

      case 'OPEN_TAB_GEN':
      case 'OPEN_AUTOTAB':
        switchModule('autotab');
        break;

      case 'OPEN_PRACTICE':
        switchModule('practice');
        break;

      case 'OPEN_RIG':
        switchModule('rig');
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
if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const modules: ModuleType[] = ['engine', 'dictionary', 'autotab', 'rig', 'practice', 'gameroom'];
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

  const NAV_MODULES: Record<ModuleType, { icon: string; title: string }> = {
    engine: { icon: '🎸', title: t.nav.fretboard },
    dictionary: { icon: '📖', title: t.nav.dictionary },
    autotab: { icon: '🎼', title: t.nav.autotab },
    rig: { icon: '🎛️', title: t.nav.rig },
    practice: { icon: '🏋️', title: t.nav.practice },
    gameroom: { icon: '🎮', title: t.nav.gameroom },
  };

  const renderNavIcon = (module: ModuleType) => {
    const isActive = activeModule === module;
    const config = NAV_MODULES[module];

    return (
      <IconButton
        aria-label={config.title}
        title={config.title}
        size="lg"
        active={isActive}
        onClick={() => handleModuleClick(module)}
      >
        {config.icon}
      </IconButton>
    );
  };

  // Вертикальный поток: все блоки идут последовательно без колонок
  const renderContent = (): React.ReactNode => {
    switch (activeModule) {
      case 'engine':
        return (
          <main className="center-column">
            <div className="engine-page-layout">
              <div className="engine-page-layout__main">
                <Player />
                <div className="fretboard-scroll-wrapper">
                  <Fretboard />
                </div>
                <Tablature />
              </div>
              <aside className="engine-page-layout__side">
                <CircleOfFifths />
                <DiatonicChords />
              </aside>
            </div>
            {/* ⏺ RECORD — в самом низу главной страницы, на всю ширину */}
            <div className="tools-section">
              <ToolBox />
            </div>
          </main>
        );

case 'dictionary':
        return (
          <main className="center-column">
            <ChordDictionary targetChord={aiTargetChord} />
          </main>
        );

      case 'autotab':
        return (
          <main className="center-column">
            <SoloGenerator />
          </main>
        );

      case 'rig':
        return (
          <main className="center-column">
            <RigPanel />
          </main>
        );

      case 'practice':
        return (
          <main className="center-column">
            <PracticeDashboard />
          </main>
        );

      case 'gameroom':
        return (
          <main className="center-column" style={{ padding: 0 }}>
            <GameRoom />
          </main>
        );

      default:
        return null;
    }
  };

const seoByModule: Record<ModuleType, { title: string; description: string; keywords: string }> = {
    engine: {
      title: t.seo.engineTitle,
      description: t.seo.engineDesc,
      keywords: 'fretboard, guitar, notes, scales, гриф гитары, ноты на грифе',
    },
dictionary: {
      title: t.seo.dictionaryTitle,
      description: t.seo.dictionaryDesc,
      keywords: 'chords, guitar chords, аккорды для гитары, аппликатуры',
    },
    autotab: {
      title: t.seo.autotabTitle,
      description: t.seo.autotabDesc,
      keywords: 'ai solo generator, tab generator, гитарное соло онлайн, ai музыка',
    },
    rig: {
      title: t.seo.rigTitle,
      description: t.seo.rigDesc,
      keywords: 'guitar rig, педали эффектов, гитарный процессор, дисторшн, ревербератор',
    },
    practice: {
      title: t.seo.practiceTitle,
      description: t.seo.practiceDesc,
      keywords: 'guitar practice, тренировки для гитары, обучение гитаре, уроки гитары',
    },
    gameroom: {
      title: t.seo.gameroomTitle,
      description: t.seo.gameroomDesc,
      keywords: 'browser games, игры онлайн, игровая комната, ретро игры',
    },
  };

  const currentSeo = seoByModule[activeModule];

  return (
    <div className="app-container">
      <SEOHead
        title={currentSeo.title}
        description={currentSeo.description}
        keywords={currentSeo.keywords}
        ogTitle={`${currentSeo.title} | FretLab`}
        ogDescription={currentSeo.description}
      />
      <Header onAIAction={handleAIAction} />

      <div className="app-main">
        <div className="app-layout">
          <div className={`main-workspace ${isTransitioning ? 'transitioning' : ''}`}>
            {renderContent()}
          </div>

          <aside className="bottom-nav">
{renderNavIcon('engine')}
            {renderNavIcon('dictionary')}
            {renderNavIcon('autotab')}
            {renderNavIcon('rig')}
            {renderNavIcon('practice')}
            {renderNavIcon('gameroom')}
            <div className="sidebar-footer desktop-only">
              <span className="version-text">v2.0.0</span>
              <span className="shortcut-text">Ctrl+1-6</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AppShell;

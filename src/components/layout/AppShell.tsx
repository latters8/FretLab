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

type ModuleType = 'engine' | 'dictionary' | 'autotab' | 'rig' | 'practice' | 'gameroom';

const MODULES = {
  engine: { icon: '🎸', title: 'Fretboard Engine', description: 'Interactive fretboard with playback' },
  dictionary: { icon: '📖', title: 'Chord Dictionary', description: 'Explore chords and voicings' },
  autotab: { icon: '🎼', title: 'Solo Generator', description: 'AI-powered solo generation' },
  rig: { icon: '🎛️', title: 'FretLab Rig', description: 'Guitar processor with pedals' },
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

  const renderNavIcon = (module: ModuleType) => {
    const isActive = activeModule === module;
    const config = MODULES[module];

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
      title: 'Гриф гитары онлайн',
      description: 'Интерактивный гриф гитары с подсветкой нот и ступеней. Изучай расположение нот на грифе с визуализацией музыкальной теории.',
      keywords: 'гриф гитары онлайн, ноты на грифе, fretboard, аппликатуры, гаммы на грифе',
    },
    dictionary: {
      title: 'Словарь аккордов для гитары',
      description: 'Полный словарь гитарных аккордов с аппликатурами и озвучкой. Изучай аккорды для гитары с визуализацией на грифе.',
      keywords: 'аккорды для гитары, словарь аккордов, аппликатуры аккордов, гитарные аккорды, справочник аккордов',
    },
    autotab: {
      title: 'AI генератор соло для гитары',
      description: 'Генерация гитарных соло с помощью AI. Создавай уникальные соло-партии с автоматической табулатурой и DAW-микшером.',
      keywords: 'ai генератор соло, генератор табов, гитарное соло онлайн, ai музыка, solo generator, tab generator',
    },
rig: {
      title: 'Гитарный процессор FretLab Rig',
      description: 'Мощный гитарный процессор с педалями: тюнер, дисторшн, эквалайзер, кабинет IR, модуляция, дилей и ревербератор. Обрабатывай звук гитары в реальном времени онлайн.',
      keywords: 'гитарный процессор, педали эффектов онлайн, гитарные эффекты, дисторшн, дилей, ревербератор, тюнер, cabinet ir, guitar rig',
    },
    practice: {
      title: 'Тренировки для гитариста',
      description: 'Ежедневные тренировки для гитариста: гаммы, аккорды, ритм. Отслеживай прогресс обучения игре на гитаре.',
      keywords: 'тренировки для гитары, обучение гитаре, практика, уроки гитары онлайн, самоучитель гитары',
    },
    gameroom: {
      title: 'Игровая комната для гитаристов',
      description: 'Коллекция браузерных игр для отдыха между тренировками. Игры для гитаристов и любителей ретро-гейминга.',
      keywords: 'игры онлайн, браузерные игры, игровая комната, гитаристы, отдых, ретро игры',
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

